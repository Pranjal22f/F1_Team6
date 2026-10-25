export interface HammingResult {
  dataBits: string;
  parityBits: { p1: number; p2: number; p4: number };
  encodedCodeword: string;
  errorInjectedIndex?: number;
  receivedCodeword?: string;
  syndromeBits: { s1: number; s2: number; s3: number };
  syndromeDecimal: number;
  errorDetected: boolean;
  correctedCodeword: string;
  correctedDataBits: string;
  steps: string[];
}

export interface CrcDivisionStep {
  step: number;
  currentRemainder: string;
  xorOperand: string;
  action: string;
}

export interface CrcResult {
  dataBits: string;
  generator: string;
  augmentedData: string;
  remainder: string;
  transmittedCodeword: string;
  divisionSteps: CrcDivisionStep[];
  receivedCodeword?: string;
  receiverRemainder?: string;
  errorDetected?: boolean;
}

export interface ChecksumResult {
  words: string[];
  wordSumHex: string;
  carryBits: number;
  finalSumWithCarryHex: string;
  checksumHex: string;
  verificationPassed: boolean;
  steps: string[];
}

export interface ArqEvent {
  timeUnit: number;
  type: 'SEND' | 'ACK' | 'TIMEOUT' | 'LOSS' | 'BUFFER' | 'RETRANSMIT';
  frameId: number;
  details: string;
  senderWindow: number[];
  receiverWindow: number[];
}

export interface ArqSimulationResult {
  protocol: 'Go-Back-N' | 'Selective Repeat';
  totalFramesRequested: number;
  windowSize: number;
  simulatedEvents: ArqEvent[];
  totalTransmissions: number;
  retransmissions: number;
  efficiencyRatio: number;
  lossRate: number;
}

export interface AlohaCurvePoint {
  g: number; // Offered load (attempts per packet time)
  pureAlohaThroughput: number;
  slottedAlohaThroughput: number;
}

export class ProtocolSimulationEngine {
  /**
   * 1. Hamming Code (7,4) Systematic Encoding and Single-Bit Error Correction
   */
  public runHamming74(data4Bits: string, errorBitIndex = 0): HammingResult {
    const cleanData = data4Bits.replace(/[^01]/g, '').slice(0, 4).padEnd(4, '0');
    const d1 = parseInt(cleanData[0], 10);
    const d2 = parseInt(cleanData[1], 10);
    const d3 = parseInt(cleanData[2], 10);
    const d4 = parseInt(cleanData[3], 10);

    // Codeword bit positions:
    // Pos 1: P1, Pos 2: P2, Pos 3: D1, Pos 4: P4, Pos 5: D2, Pos 6: D3, Pos 7: D4
    // P1 covers bits with 1 in binary position (1, 3, 5, 7) -> P1, D1, D2, D4
    // P2 covers bits with 2 in binary position (2, 3, 6, 7) -> P2, D1, D3, D4
    // P4 covers bits with 4 in binary position (4, 5, 6, 7) -> P4, D2, D3, D4
    const p1 = (d1 ^ d2 ^ d4) & 1;
    const p2 = (d1 ^ d3 ^ d4) & 1;
    const p4 = (d2 ^ d3 ^ d4) & 1;

    const codewordArr = [0, p1, p2, d1, p4, d2, d3, d4]; // 1-indexed
    const encodedStr = `${p1}${p2}${d1}${p4}${d2}${d3}${d4}`;

    const steps: string[] = [
      `Input 4 data bits: D1=${d1}, D2=${d2}, D3=${d3}, D4=${d4}`,
      `Calculate P1 = D1 ⊕ D2 ⊕ D4 = ${d1} ⊕ ${d2} ⊕ ${d4} = ${p1}`,
      `Calculate P2 = D1 ⊕ D3 ⊕ D4 = ${d1} ⊕ ${d3} ⊕ ${d4} = ${p2}`,
      `Calculate P4 = D2 ⊕ D3 ⊕ D4 = ${d2} ⊕ ${d3} ⊕ ${d4} = ${p4}`,
      `Construct 7-bit codeword [P1, P2, D1, P4, D2, D3, D4] = "${encodedStr}"`,
    ];

    // Inject Error if requested (index 1 to 7)
    const receivedArr = [...codewordArr];
    if (errorBitIndex >= 1 && errorBitIndex <= 7) {
      receivedArr[errorBitIndex] = receivedArr[errorBitIndex] === 1 ? 0 : 1;
      steps.push(`Channel Error Injected: Flipped bit at position ${errorBitIndex}!`);
    }

    const receivedStr = receivedArr.slice(1).join('');

    // Receiver Syndrome Calculation
    // s1 = Bit 1 ⊕ Bit 3 ⊕ Bit 5 ⊕ Bit 7
    // s2 = Bit 2 ⊕ Bit 3 ⊕ Bit 6 ⊕ Bit 7
    // s3 = Bit 4 ⊕ Bit 5 ⊕ Bit 6 ⊕ Bit 7
    const s1 = (receivedArr[1] ^ receivedArr[3] ^ receivedArr[5] ^ receivedArr[7]) & 1;
    const s2 = (receivedArr[2] ^ receivedArr[3] ^ receivedArr[6] ^ receivedArr[7]) & 1;
    const s3 = (receivedArr[4] ^ receivedArr[5] ^ receivedArr[6] ^ receivedArr[7]) & 1;

    // Syndrome vector S = (s3, s2, s1)
    const syndromeDec = (s3 << 2) | (s2 << 1) | s1;
    steps.push(`Syndrome vector calculated: S = (s3, s2, s1) = (${s3}, ${s2}, ${s1}) -> Decimal: ${syndromeDec}`);

    const correctedArr = [...receivedArr];
    let errorDetected = false;

    if (syndromeDec === 0) {
      steps.push('Syndrome is 000: No transmission errors detected. Codeword is pristine.');
    } else {
      errorDetected = true;
      steps.push(`Non-zero syndrome: Error pinpointed at position ${syndromeDec}. Inverting bit ${syndromeDec} to correct.`);
      correctedArr[syndromeDec] = correctedArr[syndromeDec] === 1 ? 0 : 1;
    }

    const correctedCodeword = correctedArr.slice(1).join('');
    const correctedDataBits = `${correctedArr[3]}${correctedArr[5]}${correctedArr[6]}${correctedArr[7]}`;
    steps.push(`Recovered Original Data Bits: "${correctedDataBits}"`);

    return {
      dataBits: cleanData,
      parityBits: { p1, p2, p4 },
      encodedCodeword: encodedStr,
      errorInjectedIndex: errorBitIndex > 0 ? errorBitIndex : undefined,
      receivedCodeword: receivedStr,
      syndromeBits: { s1, s2, s3 },
      syndromeDecimal: syndromeDec,
      errorDetected,
      correctedCodeword,
      correctedDataBits,
      steps,
    };
  }

  /**
   * 2. Cyclic Redundancy Check (CRC) Polynomial Modulo-2 Division
   */
  public runCrc(dataBits: string, generator: string, corruptBitIndex = -1): CrcResult {
    const cleanData = dataBits.replace(/[^01]/g, '') || '11010011101100';
    const cleanGen = generator.replace(/[^01]/g, '') || '1011';
    const genLen = cleanGen.length;

    // Append (n - 1) zeros to data bits
    const augmented = cleanData + '0'.repeat(genLen - 1);
    const steps: CrcDivisionStep[] = [];

    // Modulo-2 division
    let remainderArr = augmented.split('').map(Number);
    for (let i = 0; i <= augmented.length - genLen; i++) {
      if (remainderArr[i] === 1) {
        steps.push({
          step: i + 1,
          currentRemainder: remainderArr.slice(i, i + genLen).join(''),
          xorOperand: cleanGen,
          action: `Bit at index ${i} is 1 -> XOR with generator ${cleanGen}`,
        });
        for (let j = 0; j < genLen; j++) {
          remainderArr[i + j] ^= parseInt(cleanGen[j], 10);
        }
      }
    }

    const remainder = remainderArr.slice(-(genLen - 1)).join('');
    const transmitted = cleanData + remainder;

    // Receiver Side Check
    let received = transmitted;
    if (corruptBitIndex >= 0 && corruptBitIndex < transmitted.length) {
      const bits = transmitted.split('');
      bits[corruptBitIndex] = bits[corruptBitIndex] === '1' ? '0' : '1';
      received = bits.join('');
    }

    // Receiver Modulo-2 Division
    let recArr = received.split('').map(Number);
    for (let i = 0; i <= received.length - genLen; i++) {
      if (recArr[i] === 1) {
        for (let j = 0; j < genLen; j++) {
          recArr[i + j] ^= parseInt(cleanGen[j], 10);
        }
      }
    }
    const receiverRemainder = recArr.slice(-(genLen - 1)).join('');
    const errorDetected = receiverRemainder.includes('1');

    return {
      dataBits: cleanData,
      generator: cleanGen,
      augmentedData: augmented,
      remainder,
      transmittedCodeword: transmitted,
      divisionSteps: steps.slice(0, 10), // Limit for presentation
      receivedCodeword: received,
      receiverRemainder,
      errorDetected,
    };
  }

  /**
   * 3. 16-bit Internet Checksum (RFC 1071)
   */
  public runChecksum(hexWords: string[], injectCorruption = false): ChecksumResult {
    const steps: string[] = [];
    const validWords = hexWords.length > 0 ? hexWords : ['4500', '003c', '1c46', '4000', '4006'];

    steps.push(`Input 16-bit words (Hex): ${validWords.join(', ')}`);

    let sum = 0;
    for (const w of validWords) {
      const val = parseInt(w, 16) || 0;
      sum += val;
      steps.push(`Add 0x${w.padStart(4, '0')} -> Current sum: 0x${sum.toString(16).toUpperCase()}`);
    }

    // Fold 32-bit sum to 16-bit by adding carry bits
    let carry = sum >> 16;
    let final16 = sum & 0xFFFF;
    while (carry > 0) {
      steps.push(`Fold carry 0x${carry.toString(16).toUpperCase()} back into 16-bit word`);
      sum = final16 + carry;
      carry = sum >> 16;
      final16 = sum & 0xFFFF;
    }

    // 1's complement of sum
    const checksum = (~final16) & 0xFFFF;
    const checksumHex = checksum.toString(16).padStart(4, '0').toUpperCase();
    steps.push(`One's Complement (NOT) of 0x${final16.toString(16).padStart(4, '0').toUpperCase()} -> Checksum: 0x${checksumHex}`);

    // Verification
    let verifySum = final16 + checksum;
    let verifyCarry = verifySum >> 16;
    let verify16 = (verifySum & 0xFFFF) + verifyCarry;
    if (injectCorruption) {
      verify16 ^= 0x0001; // Corrupt a bit
      steps.push('Tamper Test: Corrupted 1 bit during transmission!');
    }
    const verificationPassed = verify16 === 0xFFFF;
    steps.push(`Receiver Verification Sum (Data + Checksum): 0x${verify16.toString(16).toUpperCase()} -> ${verificationPassed ? 'PASSED (All 1s / 0xFFFF)' : 'FAILED (Error detected!)'}`);

    return {
      words: validWords,
      wordSumHex: sum.toString(16).toUpperCase(),
      carryBits: carry,
      finalSumWithCarryHex: final16.toString(16).padStart(4, '0').toUpperCase(),
      checksumHex,
      verificationPassed,
      steps,
    };
  }

  /**
   * 4 & 5. ARQ Simulator: Go-Back-N vs Selective Repeat
   */
  public runArqSimulation(
    protocol: 'Go-Back-N' | 'Selective Repeat',
    frameCount = 8,
    windowSize = 4,
    dropFrameId = 2
  ): ArqSimulationResult {
    const events: ArqEvent[] = [];
    let time = 0;
    let totalTransmissions = 0;
    let retransmissions = 0;

    let base = 0;
    let nextSeq = 0;
    const acked = new Array(frameCount).fill(false);
    const buffered = new Array(frameCount).fill(false);

    if (protocol === 'Go-Back-N') {
      // Go-Back-N: Receiver accepts only in-order frame. When packet drops, entire window is resent!
      while (base < frameCount) {
        // Send window
        while (nextSeq < base + windowSize && nextSeq < frameCount) {
          time++;
          totalTransmissions++;
          const isDropped = (nextSeq === dropFrameId && retransmissions === 0);

          if (isDropped) {
            events.push({
              timeUnit: time,
              type: 'LOSS',
              frameId: nextSeq,
              details: `Frame [${nextSeq}] lost in transit due to channel noise.`,
              senderWindow: Array.from({ length: Math.min(windowSize, frameCount - base) }, (_, i) => base + i),
              receiverWindow: [base],
            });
          } else {
            events.push({
              timeUnit: time,
              type: 'SEND',
              frameId: nextSeq,
              details: `Sender transmits Frame [${nextSeq}].`,
              senderWindow: Array.from({ length: Math.min(windowSize, frameCount - base) }, (_, i) => base + i),
              receiverWindow: [base],
            });
          }
          nextSeq++;
        }

        time++;
        // If the base frame was lost, timeout occurs!
        if (!acked[base]) {
          events.push({
            timeUnit: time,
            type: 'TIMEOUT',
            frameId: base,
            details: `Timer expired for unacknowledged Frame [${base}]! Go-Back-N resets window and resends all ${nextSeq - base} frames in window.`,
            senderWindow: Array.from({ length: Math.min(windowSize, frameCount - base) }, (_, i) => base + i),
            receiverWindow: [base],
          });
          retransmissions += (nextSeq - base);
          nextSeq = base; // Go Back to Base!
          dropFrameId = -1; // Recovered on retry
        }

        // Advance base
        acked[base] = true;
        base++;
      }
    } else {
      // Selective Repeat: Only corrupted/missing frame is retransmitted.
      while (base < frameCount) {
        while (nextSeq < base + windowSize && nextSeq < frameCount) {
          time++;
          totalTransmissions++;
          const isDropped = (nextSeq === dropFrameId && retransmissions === 0);

          if (isDropped) {
            events.push({
              timeUnit: time,
              type: 'LOSS',
              frameId: nextSeq,
              details: `Frame [${nextSeq}] lost in transit!`,
              senderWindow: Array.from({ length: Math.min(windowSize, frameCount - base) }, (_, i) => base + i),
              receiverWindow: Array.from({ length: windowSize }, (_, i) => base + i),
            });
          } else {
            events.push({
              timeUnit: time,
              type: 'SEND',
              frameId: nextSeq,
              details: `Sender sends Frame [${nextSeq}]. Receiver buffers frame.`,
              senderWindow: Array.from({ length: Math.min(windowSize, frameCount - base) }, (_, i) => base + i),
              receiverWindow: Array.from({ length: windowSize }, (_, i) => base + i),
            });
            buffered[nextSeq] = true;
            acked[nextSeq] = true;
          }
          nextSeq++;
        }

        // Selective retransmit if base lost
        if (!buffered[base]) {
          time++;
          events.push({
            timeUnit: time,
            type: 'RETRANSMIT',
            frameId: base,
            details: `Selective Retransmit: Resending ONLY missing Frame [${base}]. Buffered frames [${base + 1}..${nextSeq - 1}] retained at receiver!`,
            senderWindow: [base],
            receiverWindow: Array.from({ length: windowSize }, (_, i) => base + i),
          });
          totalTransmissions++;
          retransmissions++;
          buffered[base] = true;
          acked[base] = true;
        }

        while (base < frameCount && acked[base]) {
          base++;
        }
      }
    }

    const efficiencyRatio = Number((frameCount / totalTransmissions).toFixed(3));
    const lossRate = Number(((retransmissions / totalTransmissions) * 100).toFixed(1));

    return {
      protocol,
      totalFramesRequested: frameCount,
      windowSize,
      simulatedEvents: events,
      totalTransmissions,
      retransmissions,
      efficiencyRatio,
      lossRate,
    };
  }

  /**
   * 6 & 7. ALOHA Channel Throughput Calculation (Pure vs Slotted)
   */
  public getAlohaThroughputCurves(): AlohaCurvePoint[] {
    const points: AlohaCurvePoint[] = [];
    for (let g = 0.05; g <= 3.0; g += 0.05) {
      // Pure ALOHA: S = G * e^(-2G)
      const pureS = g * Math.exp(-2 * g);
      // Slotted ALOHA: S = G * e^(-G)
      const slottedS = g * Math.exp(-g);
      points.push({
        g: Number(g.toFixed(2)),
        pureAlohaThroughput: Number(pureS.toFixed(4)),
        slottedAlohaThroughput: Number(slottedS.toFixed(4)),
      });
    }
    return points;
  }
}
