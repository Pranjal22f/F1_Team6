"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketTracer = void 0;
const routing_js_1 = require("./routing.js");
const acl_js_1 = require("./acl.js");
class PacketTracer {
    routingEngine;
    aclEngine;
    constructor(devices, links, aclRules) {
        this.routingEngine = new routing_js_1.RoutingEngine(devices, links);
        this.aclEngine = new acl_js_1.ACLEngine(aclRules);
    }
    tracePacket(devices, links, req) {
        this.routingEngine.updateTopology(devices, links);
        const sourceDev = devices.find(d => d.id === req.sourceDeviceId);
        const destDev = devices.find(d => d.id === req.destDeviceId);
        if (!sourceDev || !destDev) {
            throw new Error('Source or destination device not found');
        }
        const pathResult = this.routingEngine.findPath(req.sourceDeviceId, req.destDeviceId, req.routingProtocol || 'OSPF');
        const steps = [];
        const sourceIp = sourceDev.ipAddress || '10.0.0.100';
        const destIp = destDev.ipAddress || '10.70.0.12';
        // Step 1: Source Host Origin
        steps.push({
            stepNumber: 1,
            deviceId: sourceDev.id,
            deviceName: sourceDev.name,
            deviceType: sourceDev.type,
            outInterface: sourceDev.interfaces[0]?.name || 'eth0',
            actionTaken: 'Packet Created at Source',
            decisionDetail: `Host generated ${req.protocol} packet [${sourceIp} -> ${destIp}]. Local ARP/Gateway lookup initiated for VLAN ${sourceDev.vlanId ?? 'Default'}.`,
            status: 'forwarded',
        });
        if (!pathResult.reachable) {
            steps.push({
                stepNumber: 2,
                deviceId: sourceDev.id,
                deviceName: sourceDev.name,
                deviceType: sourceDev.type,
                actionTaken: 'Destination Unreachable',
                decisionDetail: pathResult.unreachableReason || 'No valid active route exists to target host.',
                status: 'dropped',
            });
            return {
                sourceDevice: sourceDev,
                destDevice: destDev,
                protocol: req.protocol,
                success: false,
                totalHops: 0,
                totalLatencyMs: 0,
                failureReason: pathResult.unreachableReason || 'Destination host unreachable (Route not found or link severed).',
                steps,
                pathDeviceIds: [sourceDev.id],
            };
        }
        // Traverse the path through intermediate routers/switches
        let currentHopIndex = 0;
        let packetBlocked = false;
        let blockReason = '';
        const traversedIds = [sourceDev.id];
        for (let i = 1; i < pathResult.path.length; i++) {
            const devId = pathResult.path[i];
            const prevDevId = pathResult.path[i - 1];
            const dev = devices.find(d => d.id === devId);
            traversedIds.push(devId);
            currentHopIndex++;
            // Check connecting link status
            const connectingLink = links.find(l => (l.sourceDeviceId === prevDevId && l.targetDeviceId === devId) ||
                (l.sourceDeviceId === devId && l.targetDeviceId === prevDevId));
            if (connectingLink && connectingLink.status === 'failed') {
                steps.push({
                    stepNumber: currentHopIndex + 1,
                    deviceId: dev.id,
                    deviceName: dev.name,
                    deviceType: dev.type,
                    actionTaken: 'Link Down - Packet Dropped',
                    decisionDetail: `Interface connecting ${prevDevId} to ${dev.name} is down/disconnected. Transmission halted.`,
                    status: 'dropped',
                });
                packetBlocked = true;
                blockReason = `Connecting link ${connectingLink.id} is down.`;
                break;
            }
            // If device is a Router, evaluate Firewall ACL
            if (dev.type === 'router' || dev.type === 'firewall') {
                const aclResult = this.aclEngine.evaluatePacket({
                    sourceIp,
                    destIp,
                    protocol: req.protocol,
                    sourcePort: 49152,
                    destPort: req.destPort ?? (req.protocol === 'TCP' ? 80 : 53),
                });
                if (aclResult.action === 'DENY') {
                    steps.push({
                        stepNumber: currentHopIndex + 1,
                        deviceId: dev.id,
                        deviceName: dev.name,
                        deviceType: dev.type,
                        inInterface: dev.interfaces[0]?.name || 'Gi0/1',
                        actionTaken: 'Firewall ACL Denied',
                        decisionDetail: `Security Policy Violation: ${aclResult.reason}`,
                        aclResult: {
                            ruleId: aclResult.matchedRule?.id || 'IMPLICIT_DENY',
                            action: 'DENY',
                            reason: aclResult.reason,
                        },
                        status: 'dropped',
                    });
                    packetBlocked = true;
                    blockReason = `Blocked by ACL Rule on ${dev.name}: ${aclResult.reason}`;
                    break;
                }
                else {
                    steps.push({
                        stepNumber: currentHopIndex + 1,
                        deviceId: dev.id,
                        deviceName: dev.name,
                        deviceType: dev.type,
                        inInterface: dev.interfaces[0]?.name || 'Gi0/1',
                        outInterface: dev.interfaces[1]?.name || 'Gi0/2',
                        actionTaken: 'Forwarding Decision & ACL Passed',
                        decisionDetail: `ACL Permitted [Rule #${aclResult.matchedRule?.priority}]. Router looked up FIB: Next hop ${pathResult.path[i + 1] ?? 'Local Delivery'} via metric ${pathResult.totalCost}.`,
                        aclResult: {
                            ruleId: aclResult.matchedRule?.id || 'PERMIT',
                            action: 'ALLOW',
                            reason: aclResult.reason,
                        },
                        status: 'forwarded',
                    });
                    continue;
                }
            }
            // Access or Distribution Switch
            if (i < pathResult.path.length - 1) {
                steps.push({
                    stepNumber: currentHopIndex + 1,
                    deviceId: dev.id,
                    deviceName: dev.name,
                    deviceType: dev.type,
                    inInterface: 'Port-In',
                    outInterface: 'Port-Out',
                    actionTaken: 'Layer 2 Frame Switching',
                    decisionDetail: `Switch inspected MAC destination table. Frame switched to outgoing VLAN trunk port.`,
                    status: 'forwarded',
                });
            }
        }
        // Final Destination Host/Server
        if (!packetBlocked) {
            steps.push({
                stepNumber: steps.length + 1,
                deviceId: destDev.id,
                deviceName: destDev.name,
                deviceType: destDev.type,
                inInterface: destDev.interfaces[0]?.name || 'eth0',
                actionTaken: 'Packet Successfully Delivered',
                decisionDetail: `Destination node ${destDev.name} received packet on IP ${destIp}. Upper layer socket handler dispatched.`,
                status: 'delivered',
            });
        }
        return {
            sourceDevice: sourceDev,
            destDevice: destDev,
            protocol: req.protocol,
            success: !packetBlocked,
            totalHops: traversedIds.length - 1,
            totalLatencyMs: pathResult.totalLatencyMs,
            failureReason: packetBlocked ? blockReason : undefined,
            steps,
            pathDeviceIds: traversedIds,
        };
    }
}
exports.PacketTracer = PacketTracer;
