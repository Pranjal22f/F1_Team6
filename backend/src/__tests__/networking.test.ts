import { describe, it, expect, beforeEach } from 'vitest';
import { calculateSubnet, calculateVlsm, isIpInSubnet, formatIpv6Subnet } from '../simulator/addressing.js';
import { NetworkGraph } from '../simulator/graph.js';
import { RoutingEngine } from '../simulator/routing.js';
import { FaultToleranceLab } from '../simulator/fault_tolerance.js';
import { ACLEngine } from '../simulator/acl.js';
import { QoSEngine } from '../simulator/qos.js';
import { NetworkServicesSimulator } from '../simulator/services.js';
import { ProtocolSimulationEngine } from '../simulator/protocols.js';
import { INITIAL_DEVICES, INITIAL_LINKS, INITIAL_ACL_RULES } from '../database/seed.js';

describe('1. Addressing and Subnetting Engine', () => {
  it('correctly calculates /24 subnet boundaries for VLAN 10', () => {
    const res = calculateSubnet('10.10.0.50', 24);
    expect(res.networkAddress).toBe('10.10.0.0');
    expect(res.broadcastAddress).toBe('10.10.0.255');
    expect(res.subnetMask).toBe('255.255.255.0');
    expect(res.firstUsableHost).toBe('10.10.0.1');
    expect(res.lastUsableHost).toBe('10.10.0.254');
    expect(res.usableHosts).toBe(254);
    expect(res.isPrivate).toBe(true);
    expect(res.ipClass).toBe('A');
  });

  it('correctly calculates point-to-point /30 inter-router links', () => {
    const res = calculateSubnet('10.0.12.1', 30);
    expect(res.networkAddress).toBe('10.0.12.0');
    expect(res.broadcastAddress).toBe('10.0.12.3');
    expect(res.subnetMask).toBe('255.255.255.252');
    expect(res.usableHosts).toBe(2);
  });

  it('correctly partitions IP space using VLSM', () => {
    const departments = [
      { name: 'Students', requiredHosts: 120 },
      { name: 'CSE', requiredHosts: 60 },
      { name: 'ECE', requiredHosts: 28 },
      { name: 'Point-to-Point WAN', requiredHosts: 2 },
    ];
    const allocations = calculateVlsm('192.168.1.0/24', departments);
    expect(allocations.length).toBe(4);
    expect(allocations[0].name).toBe('Students');
    expect(allocations[0].prefixLength).toBe(25); // 128 block
    expect(allocations[1].name).toBe('CSE');
    expect(allocations[1].prefixLength).toBe(26); // 64 block
    expect(allocations[2].name).toBe('ECE');
    expect(allocations[2].prefixLength).toBe(27); // 32 block
    expect(allocations[3].name).toBe('Point-to-Point WAN');
    expect(allocations[3].prefixLength).toBe(30); // 4 block
  });

  it('identifies if IP address is inside CIDR subnet', () => {
    expect(isIpInSubnet('10.10.0.50', '10.10.0.0/24')).toBe(true);
    expect(isIpInSubnet('10.20.0.50', '10.10.0.0/24')).toBe(false);
    expect(isIpInSubnet('192.168.5.1', 'ANY')).toBe(true);
  });

  it('formats IPv6 subnets correctly', () => {
    const v6Subnet = formatIpv6Subnet('2001:db8:acad::/48', 10);
    expect(v6Subnet).toBe('2001:db8:acad:a::/64');
  });
});

describe('2. Routing Engine (OSPF Dijkstra vs RIP)', () => {
  let engine: RoutingEngine;

  beforeEach(() => {
    engine = new RoutingEngine(INITIAL_DEVICES, INITIAL_LINKS);
  });

  it('finds optimal OSPF shortest path from Edge Router R1 to Server Farm', () => {
    const res = engine.findPath('router-r1', 'srv-web', 'OSPF');
    expect(res.reachable).toBe(true);
    // Expected path: R1 -> R2 -> SW-Server -> Srv-Web
    expect(res.path).toContain('router-r1');
    expect(res.path).toContain('router-r2');
    expect(res.path).toContain('srv-web');
    expect(res.totalCost).toBeGreaterThan(0);
  });

  it('calculates RIP hop counts correctly', () => {
    const res = engine.findPath('router-r1', 'srv-web', 'RIP');
    expect(res.reachable).toBe(true);
    expect(res.totalHops).toBe(res.path.length - 1);
  });

  it('generates non-empty routing table for Core Router R2', () => {
    const table = engine.generateRoutingTable('router-r2', 'OSPF');
    expect(table.routerId).toBe('router-r2');
    expect(table.routes.length).toBeGreaterThan(0);
  });
});

describe('3. Fault Tolerance and Recovery Lab', () => {
  it('automatically reroutes traffic via R3 when primary core link R1-R2 fails', () => {
    const lab = new FaultToleranceLab(INITIAL_DEVICES, INITIAL_LINKS);
    // Test route from R1 to PC-CSE-1
    const result = lab.runFailureExperiment(
      INITIAL_DEVICES,
      INITIAL_LINKS,
      'router-r1',
      'pc-cse-1',
      'link-r1-r2',
      'OSPF'
    );

    expect(result.isResilient).toBe(true);
    expect(result.preFailurePath.reachable).toBe(true);
    // Pre-failure path directly uses R1 -> R2
    expect(result.preFailurePath.path[1]).toBe('router-r2');

    // Post-failure path must failover through secondary router R3!
    expect(result.duringFailurePath.reachable).toBe(true);
    expect(result.duringFailurePath.path).toContain('router-r3');
    expect(result.convergenceTimeMs).toBeGreaterThan(0);
    expect(result.packetLossPercentage).toBeLessThan(10);
  });

  it('handles isolated nodes gracefully when no alternate path exists', () => {
    const lab = new FaultToleranceLab(INITIAL_DEVICES, INITIAL_LINKS);
    // Failing access link to PC-CSE-1
    const result = lab.runFailureExperiment(
      INITIAL_DEVICES,
      INITIAL_LINKS,
      'router-r1',
      'pc-cse-1',
      'link-swcse-pccse1',
      'OSPF'
    );
    expect(result.duringFailurePath.reachable).toBe(false);
    expect(result.packetLossPercentage).toBe(100);
  });
});

describe('4. Security & ACL Inspection Engine', () => {
  let acl: ACLEngine;

  beforeEach(() => {
    acl = new ACLEngine(INITIAL_ACL_RULES);
  });

  it('blocks Student network (VLAN 50) access to Administration network (VLAN 30)', () => {
    const result = acl.evaluatePacket({
      sourceIp: '10.50.0.105',
      destIp: '10.30.0.25',
      protocol: 'TCP',
      destPort: 80,
    });
    expect(result.action).toBe('DENY');
    expect(result.matchedRule?.id).toBe('acl-20');
  });

  it('blocks IoT devices (VLAN 80) access to Administration network (VLAN 30)', () => {
    const result = acl.evaluatePacket({
      sourceIp: '10.80.0.15',
      destIp: '10.30.0.25',
      protocol: 'TCP',
      destPort: 80,
    });
    expect(result.action).toBe('DENY');
    expect(result.matchedRule?.id).toBe('acl-10');
  });

  it('permits Student network web access (port 80) to Campus Web Server (10.70.0.12)', () => {
    const result = acl.evaluatePacket({
      sourceIp: '10.50.0.105',
      destIp: '10.70.0.12',
      protocol: 'TCP',
      destPort: 80,
    });
    expect(result.action).toBe('ALLOW');
    expect(result.matchedRule?.id).toBe('acl-30');
  });

  it('restricts SSH (port 22) to Network Management VLAN 99 only', () => {
    // Student attempting SSH to Router -> DENY
    const res1 = acl.evaluatePacket({
      sourceIp: '10.50.0.105',
      destIp: '10.0.12.2',
      protocol: 'TCP',
      destPort: 22,
    });
    expect(res1.action).toBe('DENY');

    // Admin NOC terminal attempting SSH to Router -> ALLOW
    const res2 = acl.evaluatePacket({
      sourceIp: '10.99.0.10',
      destIp: '10.0.12.2',
      protocol: 'TCP',
      destPort: 22,
    });
    expect(res2.action).toBe('ALLOW');
  });
});

describe('5. Network Services Simulator', () => {
  let sim: NetworkServicesSimulator;

  beforeEach(() => {
    sim = new NetworkServicesSimulator();
  });

  it('allocates IP address via DHCP DORA cycle', () => {
    const res = sim.simulateDhcp('AA:BB:CC:11:22:33', 50);
    expect(res.success).toBe(true);
    expect(res.responseDetails.assignedIp).toMatch(/^10\.50\.0\.\d+$/);
    expect(res.responseDetails.defaultGateway).toBe('10.50.0.1');
  });

  it('resolves internal campus domain via DNS', () => {
    const res = sim.simulateDns('portal.campus.edu', '10.50.0.105');
    expect(res.success).toBe(true);
    expect(res.responseDetails.ipAddress).toBe('10.70.0.12');
  });

  it('creates PAT translation entry for outbound connection', () => {
    const res = sim.simulateNat('10.50.0.105', 54321, '142.250.190.46', 443);
    expect(res.success).toBe(true);
    expect(res.responseDetails.publicSocket).toMatch(/^203\.0\.113\.2:\d+$/);
  });
});

describe('6. QoS and Traffic Congestion Engine', () => {
  it('protects High Priority voice traffic under congestion using Strict Priority Queueing', () => {
    const qos = new QoSEngine();
    const result = qos.simulateTraffic(
      {
        sourceDeviceId: 'pc-cse-1',
        destDeviceId: 'srv-web',
        trafficClass: 'HIGH',
        packetRatePps: 8000,
        packetSizeBytes: 1024,
        protocol: 'UDP',
        durationSeconds: 1,
        useQoS: true,
      },
      10, // Bottleneck link 10 Mbps
      30  // Low queue capacity to force drops
    );

    expect(result.withQos.classBreakdown.high.lossRate).toBeLessThanOrEqual(result.withoutQos.classBreakdown.high.lossRate);
    expect(result.withQos.throughputBps).toBeGreaterThan(0);
    expect(result.withQos.averageDelayMs).toBeGreaterThanOrEqual(0);
  });
});

describe('7. Protocol Simulation Lab (Error Control & ARQ)', () => {
  const engine = new ProtocolSimulationEngine();

  it('correctly generates Hamming (7,4) code and fixes single-bit error', () => {
    // Encode '1011'
    const resultNoErr = engine.runHamming74('1011', 0);
    expect(resultNoErr.syndromeDecimal).toBe(0);
    expect(resultNoErr.errorDetected).toBe(false);

    // Corrupt bit at position 3
    const resultWithErr = engine.runHamming74('1011', 3);
    expect(resultWithErr.errorDetected).toBe(true);
    expect(resultWithErr.syndromeDecimal).toBe(3);
    // Corrected codeword must match original pristine codeword
    expect(resultWithErr.correctedCodeword).toBe(resultNoErr.encodedCodeword);
    expect(resultWithErr.correctedDataBits).toBe('1011');
  });

  it('computes CRC remainder and detects channel bit flips', () => {
    const crc = engine.runCrc('11010011101100', '1011');
    expect(crc.transmittedCodeword.startsWith('11010011101100')).toBe(true);
    expect(crc.errorDetected).toBe(false); // Pristine transmission

    // Corrupted transmission
    const crcCorrupt = engine.runCrc('11010011101100', '1011', 4);
    expect(crcCorrupt.errorDetected).toBe(true);
  });

  it('calculates 16-bit Internet Checksum and verifies integrity', () => {
    const words = ['4500', '003c', '1c46', '4000', '4006'];
    const res = engine.runChecksum(words, false);
    expect(res.verificationPassed).toBe(true);

    const resTampered = engine.runChecksum(words, true);
    expect(resTampered.verificationPassed).toBe(false);
  });

  it('simulates Go-Back-N and Selective Repeat ARQ protocols', () => {
    const gbn = engine.runArqSimulation('Go-Back-N', 6, 3, 2);
    expect(gbn.protocol).toBe('Go-Back-N');
    expect(gbn.totalTransmissions).toBeGreaterThan(6);

    const sr = engine.runArqSimulation('Selective Repeat', 6, 3, 2);
    expect(sr.protocol).toBe('Selective Repeat');
    // Selective Repeat should have fewer retransmissions than Go-Back-N for the same single dropped frame
    expect(sr.retransmissions).toBeLessThan(gbn.retransmissions);
  });

  it('computes theoretical ALOHA throughput curves correctly', () => {
    const curves = engine.getAlohaThroughputCurves();
    expect(curves.length).toBeGreaterThan(10);
    // Check peak points: Pure ALOHA peaks around G=0.5 (~0.184), Slotted peaks around G=1.0 (~0.368)
    const at05 = curves.find(c => Math.abs(c.g - 0.5) < 0.01);
    expect(at05?.pureAlohaThroughput).toBeCloseTo(0.184, 2);

    const at10 = curves.find(c => Math.abs(c.g - 1.0) < 0.01);
    expect(at10?.slottedAlohaThroughput).toBeCloseTo(0.368, 2);
  });
});
