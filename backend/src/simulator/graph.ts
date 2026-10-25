import { Device, NetworkLink } from '../types/index.js';

export interface GraphEdge {
  linkId: string;
  targetId: string;
  bandwidthMbps: number;
  latencyMs: number;
  cost: number;
  status: 'active' | 'failed' | 'congested' | 'blocked';
  packetLossRate: number;
}

export class NetworkGraph {
  private devices: Map<string, Device> = new Map();
  private links: Map<string, NetworkLink> = new Map();
  private adjacency: Map<string, GraphEdge[]> = new Map();

  constructor(devices: Device[], links: NetworkLink[]) {
    this.updateGraph(devices, links);
  }

  public updateGraph(devices: Device[], links: NetworkLink[]): void {
    this.devices.clear();
    this.links.clear();
    this.adjacency.clear();

    for (const dev of devices) {
      this.devices.set(dev.id, dev);
      this.adjacency.set(dev.id, []);
    }

    for (const link of links) {
      this.links.set(link.id, link);

      // Determine OSPF metric if not explicitly set
      // Reference bandwidth 100Gbps (100,000 Mbps): Cost = 100,000 / BW(Mbps)
      const calculatedCost = link.cost || Math.max(1, Math.round(10000 / link.bandwidthMbps));

      // Edges are bidirectional for campus LAN/WAN
      this.adjacency.get(link.sourceDeviceId)?.push({
        linkId: link.id,
        targetId: link.targetDeviceId,
        bandwidthMbps: link.bandwidthMbps,
        latencyMs: link.latencyMs,
        cost: calculatedCost,
        status: link.status,
        packetLossRate: link.packetLossRate,
      });

      this.adjacency.get(link.targetDeviceId)?.push({
        linkId: link.id,
        targetId: link.sourceDeviceId,
        bandwidthMbps: link.bandwidthMbps,
        latencyMs: link.latencyMs,
        cost: calculatedCost,
        status: link.status,
        packetLossRate: link.packetLossRate,
      });
    }
  }

  public getDevice(id: string): Device | undefined {
    return this.devices.get(id);
  }

  public getAllDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  public getAllLinks(): NetworkLink[] {
    return Array.from(this.links.values());
  }

  public getNeighbors(deviceId: string, onlyActive = true): GraphEdge[] {
    const dev = this.devices.get(deviceId);
    if (!dev || (onlyActive && dev.status !== 'online')) {
      return [];
    }

    const edges = this.adjacency.get(deviceId) || [];
    if (!onlyActive) return edges;

    return edges.filter(edge => {
      const neighborDev = this.devices.get(edge.targetId);
      return edge.status === 'active' && neighborDev && neighborDev.status === 'online';
    });
  }
}
