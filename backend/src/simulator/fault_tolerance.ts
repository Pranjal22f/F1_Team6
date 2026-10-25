import { Device, NetworkLink, RoutingProtocol } from '../types/index.js';
import { RoutingEngine, PathResult } from './routing.js';

export interface FailoverEventLog {
  timestamp: string;
  eventType: 'LINK_FAILURE' | 'DEVICE_FAILURE' | 'LINK_RESTORE' | 'DEVICE_RESTORE';
  targetId: string;
  targetName: string;
  message: string;
  protocol: RoutingProtocol;
  convergenceTimeMs: number;
  alternatePathAvailable: boolean;
  affectedPathsCount: number;
  packetLossRate: number;
}

export interface FaultToleranceTestResult {
  scenarioName: string;
  protocol: RoutingProtocol;
  failedElement: { id: string; name: string; type: 'link' | 'device' };
  preFailurePath: PathResult;
  duringFailurePath: PathResult;
  postRecoveryPath: PathResult;
  convergenceTimeMs: number;
  packetsSent: number;
  packetsDelivered: number;
  packetsLost: number;
  packetLossPercentage: number;
  isResilient: boolean;
  explanation: string;
  eventLogs: FailoverEventLog[];
}

export class FaultToleranceLab {
  private routingEngine: RoutingEngine;

  constructor(devices: Device[], links: NetworkLink[]) {
    this.routingEngine = new RoutingEngine(devices, links);
  }

  /**
   * Run a controlled failure and recovery experiment between two endpoints
   */
  public runFailureExperiment(
    devices: Device[],
    links: NetworkLink[],
    sourceId: string,
    destId: string,
    linkIdToFail: string,
    protocol: RoutingProtocol = 'OSPF'
  ): FaultToleranceTestResult {
    // 1. Baseline Pre-Failure
    this.routingEngine.updateTopology(devices, links);
    const prePath = this.routingEngine.findPath(sourceId, destId, protocol);

    // 2. Inject Failure
    const failedLink = links.find(l => l.id === linkIdToFail);
    if (!failedLink) {
      throw new Error(`Link ${linkIdToFail} not found`);
    }

    const modifiedLinks = links.map(l =>
      l.id === linkIdToFail ? { ...l, status: 'failed' as const } : l
    );

    this.routingEngine.updateTopology(devices, modifiedLinks);
    const duringPath = this.routingEngine.findPath(sourceId, destId, protocol);

    // Simulated convergence time based on protocol mechanics
    let convergenceTimeMs = 0;
    if (duringPath.reachable) {
      if (protocol === 'OSPF') {
        // OSPF Link-State flooding: Fast hello + LSA flood + Dijkstra SPF calculation
        convergenceTimeMs = Math.round(30 + Math.random() * 25); // ~30-55ms
      } else if (protocol === 'RIP') {
        // RIP Distance-Vector: Triggered update or next periodic update interval
        convergenceTimeMs = Math.round(2400 + Math.random() * 1200); // ~2.4-3.6s
      } else {
        convergenceTimeMs = Infinity; // Static routing does not failover automatically
      }
    } else {
      convergenceTimeMs = 0;
    }

    // Packet loss calculation during convergence window
    const packetsSent = 100;
    let packetsLost = 0;

    if (!duringPath.reachable) {
      packetsLost = 100; // 100% loss if no alternate route exists
    } else {
      // During convergence window, in-flight packets along the dead link are lost
      if (protocol === 'OSPF') {
        packetsLost = Math.max(1, Math.round((convergenceTimeMs / 1000) * 15)); // ~1-2 packets
      } else if (protocol === 'RIP') {
        packetsLost = Math.min(60, Math.round((convergenceTimeMs / 1000) * 15)); // ~35-50 packets
      } else {
        packetsLost = 100;
      }
    }

    const packetsDelivered = packetsSent - packetsLost;
    const packetLossPercentage = Number(((packetsLost / packetsSent) * 100).toFixed(1));

    // 3. Post-Recovery
    this.routingEngine.updateTopology(devices, links);
    const postRecoveryPath = this.routingEngine.findPath(sourceId, destId, protocol);

    const logs: FailoverEventLog[] = [
      {
        timestamp: new Date().toISOString(),
        eventType: 'LINK_FAILURE',
        targetId: failedLink.id,
        targetName: `${failedLink.sourceDeviceId} <--> ${failedLink.targetDeviceId}`,
        message: `Physical link ${failedLink.id} severed or administratively disabled.`,
        protocol,
        convergenceTimeMs,
        alternatePathAvailable: duringPath.reachable,
        affectedPathsCount: duringPath.reachable ? 1 : 0,
        packetLossRate: packetLossPercentage / 100,
      },
    ];

    if (duringPath.reachable) {
      logs.push({
        timestamp: new Date(Date.now() + convergenceTimeMs).toISOString(),
        eventType: 'LINK_RESTORE',
        targetId: failedLink.id,
        targetName: 'Alternate Route Activated',
        message: `Topology re-converged via alternate path [${duringPath.path.join(' -> ')}].`,
        protocol,
        convergenceTimeMs,
        alternatePathAvailable: true,
        affectedPathsCount: 0,
        packetLossRate: 0,
      });
    }

    let explanation = '';
    if (duringPath.reachable) {
      explanation = `Redundancy preserved connectivity. When link ${failedLink.id} failed, ${protocol} detected the link down state and recalculated the forwarding path through ${duringPath.path.join(' -> ')}. Convergence completed in ${convergenceTimeMs}ms with only ${packetLossPercentage}% transient loss.`;
    } else {
      explanation = `Single point of failure detected. No alternate path exists between source and destination when link ${failedLink.id} is down. Packet loss was 100%. Redundant backup links are strongly recommended.`;
    }

    return {
      scenarioName: `Fault Recovery: ${failedLink.id} under ${protocol}`,
      protocol,
      failedElement: { id: failedLink.id, name: failedLink.id, type: 'link' },
      preFailurePath: prePath,
      duringFailurePath: duringPath,
      postRecoveryPath,
      convergenceTimeMs,
      packetsSent,
      packetsDelivered,
      packetsLost,
      packetLossPercentage,
      isResilient: duringPath.reachable,
      explanation,
      eventLogs: logs,
    };
  }
}
