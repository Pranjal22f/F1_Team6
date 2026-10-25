import React, { useState, useEffect } from 'react';
import { 
  Binary, 
  Cpu, 
  RotateCcw, 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  Layers, 
  FileCode,
  ArrowRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { api } from '../services/api';

type ProtocolLabId = 'hamming' | 'crc' | 'checksum' | 'arq' | 'aloha' | 'csma';

export const ProtocolLabPage: React.FC = () => {
  const [activeLab, setActiveLab] = useState<ProtocolLabId>('hamming');

  // Hamming State
  const [hammingData, setHammingData] = useState('1011');
  const [hammingErrorBit, setHammingErrorBit] = useState(3);
  const [hammingResult, setHammingResult] = useState<any>(null);

  // CRC State
  const [crcData, setCrcData] = useState('11010011101100');
  const [crcGen, setCrcGen] = useState('1011');
  const [crcCorruptIndex, setCrcCorruptIndex] = useState(-1);
  const [crcResult, setCrcResult] = useState<any>(null);

  // Checksum State
  const [checksumWords, setChecksumWords] = useState('4500,003c,1c46,4000,4006');
  const [checksumTamper, setChecksumTamper] = useState(false);
  const [checksumResult, setChecksumResult] = useState<any>(null);

  // ARQ State
  const [arqProto, setArqProto] = useState<'Go-Back-N' | 'Selective Repeat'>('Go-Back-N');
  const [arqFrames, setArqFrames] = useState(8);
  const [arqWindow, setArqWindow] = useState(4);
  const [arqDropId, setArqDropId] = useState(2);
  const [arqResult, setArqResult] = useState<any>(null);

  // ALOHA Curves State
  const [alohaCurves, setAlohaCurves] = useState<any[]>([]);

  useEffect(() => {
    handleRunHamming();
    handleRunCrc();
    handleRunChecksum();
    handleRunArq();
    api.getAlohaCurves().then(setAlohaCurves).catch(console.error);
  }, []);

  const handleRunHamming = async () => {
    try {
      const res = await api.simulateHamming(hammingData, hammingErrorBit);
      setHammingResult(res);
    } catch (err: any) {
      alert(`Hamming error: ${err.message}`);
    }
  };

  const handleRunCrc = async () => {
    try {
      const res = await api.simulateCrc(crcData, crcGen, crcCorruptIndex);
      setCrcResult(res);
    } catch (err: any) {
      alert(`CRC error: ${err.message}`);
    }
  };

  const handleRunChecksum = async () => {
    try {
      const words = checksumWords.split(',').map((s) => s.trim());
      const res = await api.simulateChecksum(words, checksumTamper);
      setChecksumResult(res);
    } catch (err: any) {
      alert(`Checksum error: ${err.message}`);
    }
  };

  const handleRunArq = async () => {
    try {
      const res = await api.simulateArq(arqProto, arqFrames, arqWindow, arqDropId);
      setArqResult(res);
    } catch (err: any) {
      alert(`ARQ error: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center space-x-2.5">
          <Binary className="w-5 h-5 text-cyan-400" />
          <span>Computer Networks Syllabus: Protocol Simulation Lab</span>
        </h2>
        <p className="text-xs text-noc-muted mt-1">
          Interactive step-by-step simulations of the 9 core syllabus data communication protocols paired with compilable ANSI C implementations
        </p>
      </div>

      {/* Protocol Tabs */}
      <div className="flex bg-noc-card border border-noc-border rounded-xl p-1 self-start space-x-1 max-w-fit overflow-x-auto">
        {[
          { id: 'hamming', label: '1. Hamming (7,4)' },
          { id: 'crc', label: '2. CRC Modulo-2' },
          { id: 'checksum', label: '3. Internet Checksum' },
          { id: 'arq', label: '4/5. ARQ (GBN vs SR)' },
          { id: 'aloha', label: '6/7. ALOHA (Pure/Slotted)' },
          { id: 'csma', label: '8/9. CSMA & CSMA/CD' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveLab(tab.id as ProtocolLabId)}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all ${
              activeLab === tab.id
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-noc-muted hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MODULE 1: HAMMING CODE (7,4) */}
      {activeLab === 'hamming' && (
        <div className="bg-noc-card border border-noc-border rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-noc-border pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Hamming Code (7,4) Error Detection & Correction</h3>
              <p className="text-xs text-noc-muted">Single-bit error correction using syndrome vector S = (s3, s2, s1)</p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
              C source: c-programs/hamming_code.c
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-mono text-noc-muted block mb-1">4 Data Bits (D1 D2 D3 D4)</label>
              <input
                type="text"
                maxLength={4}
                value={hammingData}
                onChange={(e) => setHammingData(e.target.value.replace(/[^01]/g, ''))}
                className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-noc-muted block mb-1">Inject 1-Bit Error at Position (1-7, 0=None)</label>
              <select
                value={hammingErrorBit}
                onChange={(e) => setHammingErrorBit(Number(e.target.value))}
                className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-sm font-mono text-cyan-400 focus:outline-none"
              >
                <option value={0}>0 (No Error Injected)</option>
                <option value={1}>Pos 1 (Parity P1)</option>
                <option value={2}>Pos 2 (Parity P2)</option>
                <option value={3}>Pos 3 (Data D1)</option>
                <option value={4}>Pos 4 (Parity P4)</option>
                <option value={5}>Pos 5 (Data D2)</option>
                <option value={6}>Pos 6 (Data D3)</option>
                <option value={7}>Pos 7 (Data D4)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleRunHamming}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
              >
                <Play className="w-4 h-4" />
                <span>Encode & Correct Error</span>
              </button>
            </div>
          </div>

          {hammingResult && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div className="bg-noc-bg p-3 rounded-xl border border-noc-border">
                  <span className="text-[10px] text-noc-muted block">Transmitted Codeword</span>
                  <span className="text-sm font-bold text-cyan-400">{hammingResult.encodedCodeword}</span>
                </div>
                <div className="bg-noc-bg p-3 rounded-xl border border-noc-border">
                  <span className="text-[10px] text-noc-muted block">Received Codeword</span>
                  <span className={`text-sm font-bold ${hammingResult.errorDetected ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {hammingResult.receivedCodeword}
                  </span>
                </div>
                <div className="bg-noc-bg p-3 rounded-xl border border-noc-border">
                  <span className="text-[10px] text-noc-muted block">Syndrome Vector & Decoded Bit</span>
                  <span className="text-sm font-bold text-purple-400">
                    S = {hammingResult.syndromeDecimal} ({hammingResult.errorDetected ? `Error at Bit ${hammingResult.syndromeDecimal}` : 'Pristine'})
                  </span>
                </div>
              </div>

              {/* Execution Steps */}
              <div className="bg-noc-bg border border-noc-border rounded-xl p-4 font-mono text-xs space-y-1.5">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-2">
                  Step-by-Step Mathematical Trace
                </span>
                {hammingResult.steps.map((st: string, idx: number) => (
                  <div key={idx} className="text-slate-300">
                    {st}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODULE 2: CRC */}
      {activeLab === 'crc' && (
        <div className="bg-noc-card border border-noc-border rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-noc-border pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Cyclic Redundancy Check (CRC) Modulo-2 Division</h3>
              <p className="text-xs text-noc-muted">Polynomial XOR division for burst error detection</p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
              C source: c-programs/crc.c
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-mono text-noc-muted block mb-1">Data Bit String</label>
              <input
                type="text"
                value={crcData}
                onChange={(e) => setCrcData(e.target.value.replace(/[^01]/g, ''))}
                className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-noc-muted block mb-1">Generator Polynomial</label>
              <input
                type="text"
                value={crcGen}
                onChange={(e) => setCrcGen(e.target.value.replace(/[^01]/g, ''))}
                className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-xs font-mono text-cyan-400 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleRunCrc}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
              >
                <Play className="w-4 h-4" />
                <span>Compute CRC Codeword</span>
              </button>
            </div>
          </div>

          {crcResult && (
            <div className="space-y-4 pt-2 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-noc-bg p-3 rounded-xl border border-noc-border">
                  <span className="text-[10px] text-noc-muted block">Computed CRC Remainder</span>
                  <span className="text-sm font-bold text-purple-400">{crcResult.remainder}</span>
                </div>
                <div className="bg-noc-bg p-3 rounded-xl border border-noc-border">
                  <span className="text-[10px] text-noc-muted block">Transmitted Codeword</span>
                  <span className="text-sm font-bold text-cyan-400">{crcResult.transmittedCodeword}</span>
                </div>
                <div className="bg-noc-bg p-3 rounded-xl border border-noc-border">
                  <span className="text-[10px] text-noc-muted block">Receiver Remainder Status</span>
                  <span className={`text-sm font-bold ${crcResult.errorDetected ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {crcResult.receiverRemainder} ({crcResult.errorDetected ? 'Error Detected' : 'Valid Frame'})
                  </span>
                </div>
              </div>

              {/* Modulo-2 XOR Steps */}
              <div className="bg-noc-bg border border-noc-border rounded-xl p-4 space-y-2">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                  Modulo-2 Division Execution Steps (First 10 Shifts)
                </span>
                {crcResult.divisionSteps?.map((step: any) => (
                  <div key={step.step} className="text-slate-300">
                    Step {step.step}: {step.action} ➔ Remainder slice: [{step.currentRemainder}]
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODULE 3: CHECKSUM */}
      {activeLab === 'checksum' && (
        <div className="bg-noc-card border border-noc-border rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-noc-border pb-3">
            <div>
              <h3 className="text-base font-bold text-white">16-bit Internet Checksum Algorithm (RFC 1071)</h3>
              <p className="text-xs text-noc-muted">One's complement addition with 16-bit carry folding</p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
              C source: c-programs/checksum.c
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-mono text-noc-muted block mb-1">Comma-separated 16-bit Hex Words</label>
              <input
                type="text"
                value={checksumWords}
                onChange={(e) => setChecksumWords(e.target.value)}
                className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleRunChecksum}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
              >
                <Play className="w-4 h-4" />
                <span>Calculate & Verify Checksum</span>
              </button>
            </div>
          </div>

          {checksumResult && (
            <div className="space-y-4 pt-2 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-noc-bg p-3 rounded-xl border border-noc-border">
                  <span className="text-[10px] text-noc-muted block">Folded 16-bit Sum</span>
                  <span className="text-sm font-bold text-cyan-400">0x{checksumResult.finalSumWithCarryHex}</span>
                </div>
                <div className="bg-noc-bg p-3 rounded-xl border border-noc-border">
                  <span className="text-[10px] text-noc-muted block">Generated Checksum (1's Compl)</span>
                  <span className="text-sm font-bold text-purple-400">0x{checksumResult.checksumHex}</span>
                </div>
                <div className="bg-noc-bg p-3 rounded-xl border border-noc-border">
                  <span className="text-[10px] text-noc-muted block">Receiver Verification</span>
                  <span className={`text-sm font-bold ${checksumResult.verificationPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {checksumResult.verificationPassed ? 'PASSED (0xFFFF)' : 'FAILED (Checksum Mismatch)'}
                  </span>
                </div>
              </div>

              <div className="bg-noc-bg border border-noc-border rounded-xl p-4 space-y-1.5">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-2">
                  One's Complement Step Execution
                </span>
                {checksumResult.steps?.map((st: string, idx: number) => (
                  <div key={idx} className="text-slate-300">
                    {st}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODULE 4/5: ARQ SLIDING WINDOW */}
      {activeLab === 'arq' && (
        <div className="bg-noc-card border border-noc-border rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-noc-border pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Sliding Window ARQ: Go-Back-N vs Selective Repeat</h3>
              <p className="text-xs text-noc-muted">Compare cumulative ACK window reset vs selective retransmission</p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
              C sources: c-programs/go_back_n.c & selective_repeat.c
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-mono text-noc-muted block mb-1">Protocol Variant</label>
              <select
                value={arqProto}
                onChange={(e) => setArqProto(e.target.value as any)}
                className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-xs font-mono text-cyan-400 focus:outline-none"
              >
                <option value="Go-Back-N">Go-Back-N</option>
                <option value="Selective Repeat">Selective Repeat</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-noc-muted block mb-1">Window Size (N)</label>
              <input
                type="number"
                value={arqWindow}
                onChange={(e) => setArqWindow(Number(e.target.value))}
                className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-noc-muted block mb-1">Drop Frame Sequence</label>
              <input
                type="number"
                value={arqDropId}
                onChange={(e) => setArqDropId(Number(e.target.value))}
                className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleRunArq}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
              >
                <Play className="w-4 h-4" />
                <span>Simulate Window Flow</span>
              </button>
            </div>
          </div>

          {arqResult && (
            <div className="space-y-4 pt-2 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-noc-bg p-3 rounded-xl border border-noc-border">
                  <span className="text-[10px] text-noc-muted block">Total Transmissions</span>
                  <span className="text-sm font-bold text-white">{arqResult.totalTransmissions} frames</span>
                </div>
                <div className="bg-noc-bg p-3 rounded-xl border border-noc-border">
                  <span className="text-[10px] text-noc-muted block">Retransmitted Overhead</span>
                  <span className="text-sm font-bold text-rose-400">{arqResult.retransmissions} frames</span>
                </div>
                <div className="bg-noc-bg p-3 rounded-xl border border-noc-border">
                  <span className="text-[10px] text-noc-muted block">Channel Efficiency</span>
                  <span className="text-sm font-bold text-emerald-400">{arqResult.efficiencyRatio * 100}%</span>
                </div>
              </div>

              {/* Event Timeline */}
              <div className="bg-noc-bg border border-noc-border rounded-xl p-4 space-y-2">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                  Transmission Sequence & Sliding Window Trace
                </span>
                {arqResult.simulatedEvents?.map((evt: any, i: number) => (
                  <div key={i} className="flex items-center space-x-3 text-slate-300">
                    <span className="text-noc-muted w-14">[T+{evt.timeUnit}]</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      evt.type === 'LOSS' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                      evt.type === 'TIMEOUT' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      evt.type === 'RETRANSMIT' ? 'bg-purple-950 text-purple-400 border border-purple-800' :
                      'bg-cyan-950 text-cyan-400 border border-cyan-800'
                    }`}>
                      {evt.type}
                    </span>
                    <span>{evt.details}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODULE 6/7: ALOHA CURVES */}
      {activeLab === 'aloha' && (
        <div className="bg-noc-card border border-noc-border rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-noc-border pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Pure ALOHA vs Slotted ALOHA Channel Capacity</h3>
              <p className="text-xs text-noc-muted">Throughput comparison S = G·e^(-2G) (Pure) vs S = G·e^(-G) (Slotted)</p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
              C sources: c-programs/aloha.c & slotted_aloha.c
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={alohaCurves}>
                <XAxis dataKey="g" stroke="#64748B" fontSize={11} label={{ value: 'Offered Channel Load (G)', position: 'insideBottom', offset: -5, fill: '#94A3B8' }} />
                <YAxis stroke="#64748B" fontSize={11} label={{ value: 'Throughput (S)', angle: -90, position: 'insideLeft', fill: '#94A3B8' }} />
                <Tooltip contentStyle={{ backgroundColor: '#090D16', borderColor: '#1E293B', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
                <Line type="monotone" dataKey="pureAlohaThroughput" name="Pure ALOHA (Max 18.4% at G=0.5)" stroke="#F59E0B" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="slottedAlohaThroughput" name="Slotted ALOHA (Max 36.8% at G=1.0)" stroke="#06B6D4" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-noc-bg p-4 rounded-xl border border-amber-800/40 space-y-1">
              <span className="text-amber-400 font-bold">Pure ALOHA Vulnerable Time = 2T</span>
              <p className="text-slate-300">
                Frames can arrive at any arbitrary moment. Any overlapping transmission within a 2-packet window causes total collision. Max throughput is 1/(2e) ≈ 18.4%.
              </p>
            </div>
            <div className="bg-noc-bg p-4 rounded-xl border border-cyan-800/40 space-y-1">
              <span className="text-cyan-400 font-bold">Slotted ALOHA Vulnerable Time = T</span>
              <p className="text-slate-300">
                Synchronized clock slots restrict transmission start times to discrete boundaries, halving vulnerable time and doubling maximum throughput to 1/e ≈ 36.8%.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 8/9: CSMA & CSMA/CD */}
      {activeLab === 'csma' && (
        <div className="bg-noc-card border border-noc-border rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-noc-border pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Carrier Sense Multiple Access & Collision Detection</h3>
              <p className="text-xs text-noc-muted">1-Persistent vs Non-Persistent CSMA & IEEE 802.3 Binary Exponential Backoff</p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
              C sources: c-programs/csma.c & csma_cd.c
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="bg-noc-bg border border-noc-border rounded-xl p-5 space-y-3 font-mono">
              <span className="text-cyan-400 font-bold text-sm block">1-Persistent CSMA vs Non-Persistent</span>
              <p className="text-slate-300 leading-relaxed">
                • <strong>1-Persistent</strong>: Station senses channel. If busy, listens continuously until idle, then transmits immediately (p=1). Yields low delay when idle, but high collision probability when multiple waiting stations transmit at the exact same moment.
              </p>
              <p className="text-slate-300 leading-relaxed">
                • <strong>Non-Persistent</strong>: If channel is busy, waits a random backoff interval before sensing again. Significantly decreases collision probability at the expense of channel idle latency.
              </p>
            </div>

            <div className="bg-noc-bg border border-noc-border rounded-xl p-5 space-y-3 font-mono">
              <span className="text-purple-400 font-bold text-sm block">CSMA/CD & Exponential Backoff</span>
              <p className="text-slate-300 leading-relaxed">
                • <strong>Collision Detection (Listen while talk)</strong>: Station detects voltage spike on wire when collision occurs, immediately stops transmission and broadcasts a 32-bit JAM signal.
              </p>
              <p className="text-slate-300 leading-relaxed">
                • <strong>Binary Exponential Backoff</strong>: On attempt <em>k</em> (up to 10), station chooses random slot <em>r</em> in range [0 .. 2^k - 1]. Multiplied by 2·Tau slot time (51.2 μs).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
