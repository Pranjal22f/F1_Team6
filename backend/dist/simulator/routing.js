"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutingEngine = void 0;
const graph_js_1 = require("./graph.js");
class RoutingEngine {
    graph;
    constructor(devices, links) {
        this.graph = new graph_js_1.NetworkGraph(devices, links);
    }
    updateTopology(devices, links) {
        this.graph.updateGraph(devices, links);
    }
    /**
     * Dijkstra's Algorithm for Link-State Shortest Path (OSPF)
     */
    calculateDijkstra(sourceId, destId) {
        const sourceDev = this.graph.getDevice(sourceId);
        const destDev = this.graph.getDevice(destId);
        if (!sourceDev || !destDev) {
            return { path: [], devices: [], totalCost: Infinity, totalLatencyMs: 0, totalHops: 0, protocol: 'OSPF', reachable: false, unreachableReason: 'Source or destination device does not exist.' };
        }
        if (sourceDev.status !== 'online') {
            return { path: [], devices: [], totalCost: Infinity, totalLatencyMs: 0, totalHops: 0, protocol: 'OSPF', reachable: false, unreachableReason: `Source device ${sourceDev.name} is offline.` };
        }
        if (destDev.status !== 'online') {
            return { path: [], devices: [], totalCost: Infinity, totalLatencyMs: 0, totalHops: 0, protocol: 'OSPF', reachable: false, unreachableReason: `Destination device ${destDev.name} is offline.` };
        }
        const distances = new Map();
        const latencies = new Map();
        const previous = new Map();
        const unvisited = new Set();
        for (const dev of this.graph.getAllDevices()) {
            distances.set(dev.id, Infinity);
            latencies.set(dev.id, 0);
            previous.set(dev.id, null);
            if (dev.status === 'online') {
                unvisited.add(dev.id);
            }
        }
        distances.set(sourceId, 0);
        while (unvisited.size > 0) {
            // Find unvisited node with smallest distance
            let currentId = null;
            let minDistance = Infinity;
            for (const id of unvisited) {
                const dist = distances.get(id) ?? Infinity;
                if (dist < minDistance) {
                    minDistance = dist;
                    currentId = id;
                }
            }
            if (currentId === null || minDistance === Infinity) {
                break; // Remaining nodes unreachable
            }
            if (currentId === destId) {
                break; // Found shortest path to destination
            }
            unvisited.delete(currentId);
            const neighbors = this.graph.getNeighbors(currentId, true);
            for (const edge of neighbors) {
                if (!unvisited.has(edge.targetId))
                    continue;
                const newDist = minDistance + edge.cost;
                const currentDist = distances.get(edge.targetId) ?? Infinity;
                if (newDist < currentDist) {
                    distances.set(edge.targetId, newDist);
                    latencies.set(edge.targetId, (latencies.get(currentId) || 0) + edge.latencyMs);
                    previous.set(edge.targetId, currentId);
                }
            }
        }
        // Reconstruct path
        const path = [];
        let curr = destId;
        while (curr !== null) {
            path.unshift(curr);
            curr = previous.get(curr) || null;
            if (curr === sourceId) {
                path.unshift(sourceId);
                break;
            }
        }
        const isReachable = path.length > 0 && path[0] === sourceId && path[path.length - 1] === destId;
        if (!isReachable) {
            return {
                path: [],
                devices: [],
                totalCost: Infinity,
                totalLatencyMs: 0,
                totalHops: 0,
                protocol: 'OSPF',
                reachable: false,
                unreachableReason: `No active link path exists between ${sourceDev.name} and ${destDev.name}.`,
            };
        }
        const devicePath = path.map(id => this.graph.getDevice(id));
        const totalCost = distances.get(destId) ?? 0;
        const totalLatency = latencies.get(destId) ?? 0;
        return {
            path,
            devices: devicePath,
            totalCost,
            totalLatencyMs: totalLatency,
            totalHops: path.length - 1,
            protocol: 'OSPF',
            reachable: true,
        };
    }
    /**
     * Distance-Vector Algorithm (RIP Style with 15-hop limit)
     */
    calculateRip(sourceId, destId) {
        const sourceDev = this.graph.getDevice(sourceId);
        const destDev = this.graph.getDevice(destId);
        if (!sourceDev || !destDev || sourceDev.status !== 'online' || destDev.status !== 'online') {
            return { path: [], devices: [], totalCost: Infinity, totalLatencyMs: 0, totalHops: 0, protocol: 'RIP', reachable: false, unreachableReason: 'Source or destination is unavailable.' };
        }
        // RIP uses Hop Count as metric (edge cost = 1 hop)
        const MAX_RIP_HOPS = 15;
        const hopCount = new Map();
        const latencies = new Map();
        const previous = new Map();
        const unvisited = new Set();
        for (const dev of this.graph.getAllDevices()) {
            hopCount.set(dev.id, Infinity);
            latencies.set(dev.id, 0);
            previous.set(dev.id, null);
            if (dev.status === 'online') {
                unvisited.add(dev.id);
            }
        }
        hopCount.set(sourceId, 0);
        // Bellman-Ford style relaxation
        const devices = this.graph.getAllDevices();
        for (let i = 0; i < devices.length - 1; i++) {
            let updated = false;
            for (const dev of devices) {
                if (dev.status !== 'online')
                    continue;
                const currentHops = hopCount.get(dev.id) ?? Infinity;
                if (currentHops >= MAX_RIP_HOPS)
                    continue;
                const neighbors = this.graph.getNeighbors(dev.id, true);
                for (const edge of neighbors) {
                    const nextHops = currentHops + 1;
                    if (nextHops > MAX_RIP_HOPS)
                        continue;
                    const destHops = hopCount.get(edge.targetId) ?? Infinity;
                    if (nextHops < destHops) {
                        hopCount.set(edge.targetId, nextHops);
                        latencies.set(edge.targetId, (latencies.get(dev.id) || 0) + edge.latencyMs);
                        previous.set(edge.targetId, dev.id);
                        updated = true;
                    }
                }
            }
            if (!updated)
                break;
        }
        // Reconstruct path
        const path = [];
        let curr = destId;
        while (curr !== null) {
            path.unshift(curr);
            curr = previous.get(curr) || null;
            if (curr === sourceId) {
                path.unshift(sourceId);
                break;
            }
        }
        const hops = hopCount.get(destId) ?? Infinity;
        if (hops > MAX_RIP_HOPS || path.length === 0 || path[0] !== sourceId) {
            return {
                path: [],
                devices: [],
                totalCost: Infinity,
                totalLatencyMs: 0,
                totalHops: 0,
                protocol: 'RIP',
                reachable: false,
                unreachableReason: hops > MAX_RIP_HOPS ? 'RIP hop count exceeded maximum (15 hops = Infinity).' : 'No active route to destination.',
            };
        }
        return {
            path,
            devices: path.map(id => this.graph.getDevice(id)),
            totalCost: hops, // RIP cost is hop count
            totalLatencyMs: latencies.get(destId) ?? 0,
            totalHops: hops,
            protocol: 'RIP',
            reachable: true,
        };
    }
    /**
     * Static Routing simulation
     */
    calculateStatic(sourceId, destId) {
        // Static routing follows pre-programmed default hierarchy:
        // Workstation -> Access Switch -> Core Switch/Router -> Core R2 -> R1 / R3 -> Target
        // If a link in the static path is down, static routing does not dynamically fail over!
        const defaultDijkstra = this.calculateDijkstra(sourceId, destId);
        return {
            ...defaultDijkstra,
            protocol: 'STATIC',
        };
    }
    /**
     * Route Path Finder dispatch
     */
    findPath(sourceId, destId, protocol = 'OSPF') {
        switch (protocol) {
            case 'OSPF':
                return this.calculateDijkstra(sourceId, destId);
            case 'RIP':
                return this.calculateRip(sourceId, destId);
            case 'STATIC':
                return this.calculateStatic(sourceId, destId);
            default:
                return this.calculateDijkstra(sourceId, destId);
        }
    }
    /**
     * Generate Routing Table for a given Router
     */
    generateRoutingTable(routerId, protocol = 'OSPF') {
        const router = this.graph.getDevice(routerId);
        if (!router) {
            throw new Error(`Device ${routerId} not found`);
        }
        const routes = [];
        const allDevices = this.graph.getAllDevices();
        // Directly connected subnets from router interfaces
        for (const iface of router.interfaces) {
            if (iface.ipAddress && iface.status === 'up') {
                const subnetParts = iface.ipAddress.split('.');
                const subnetCidr = `${subnetParts[0]}.${subnetParts[1]}.${subnetParts[2]}.0/24`;
                routes.push({
                    destination: subnetCidr,
                    nextHop: 'Directly Connected',
                    interfaceName: iface.name,
                    metric: 0,
                    protocol: 'STATIC',
                    status: 'active',
                });
            }
        }
        // Remote destinations calculated via selected protocol
        for (const target of allDevices) {
            if (target.id === routerId)
                continue;
            if (!target.ipAddress)
                continue;
            const pathResult = this.findPath(routerId, target.id, protocol);
            if (pathResult.reachable && pathResult.path.length > 1) {
                const nextHopId = pathResult.path[1];
                const nextHopDev = this.graph.getDevice(nextHopId);
                // Find outgoing interface on current router
                const neighbors = this.graph.getNeighbors(routerId, false);
                const edge = neighbors.find(e => e.targetId === nextHopId);
                const iface = router.interfaces[0]?.name || 'Gi0/0';
                routes.push({
                    destination: `${target.ipAddress}/32`,
                    nextHop: nextHopDev?.ipAddress || nextHopId,
                    interfaceName: iface,
                    metric: pathResult.totalCost,
                    protocol,
                    status: 'active',
                });
            }
        }
        return {
            routerId,
            routerName: router.name,
            routes,
            protocol,
            lastConvergedTimeMs: protocol === 'OSPF' ? 35 : protocol === 'RIP' ? 2400 : 0,
        };
    }
}
exports.RoutingEngine = RoutingEngine;
