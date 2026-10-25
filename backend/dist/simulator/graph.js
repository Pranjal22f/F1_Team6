"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkGraph = void 0;
class NetworkGraph {
    devices = new Map();
    links = new Map();
    adjacency = new Map();
    constructor(devices, links) {
        this.updateGraph(devices, links);
    }
    updateGraph(devices, links) {
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
    getDevice(id) {
        return this.devices.get(id);
    }
    getAllDevices() {
        return Array.from(this.devices.values());
    }
    getAllLinks() {
        return Array.from(this.links.values());
    }
    getNeighbors(deviceId, onlyActive = true) {
        const dev = this.devices.get(deviceId);
        if (!dev || (onlyActive && dev.status !== 'online')) {
            return [];
        }
        const edges = this.adjacency.get(deviceId) || [];
        if (!onlyActive)
            return edges;
        return edges.filter(edge => {
            const neighborDev = this.devices.get(edge.targetId);
            return edge.status === 'active' && neighborDev && neighborDev.status === 'online';
        });
    }
}
exports.NetworkGraph = NetworkGraph;
