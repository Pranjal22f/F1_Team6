"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACLEngine = void 0;
const addressing_js_1 = require("./addressing.js");
class ACLEngine {
    rules = [];
    constructor(rules) {
        this.setRules(rules);
    }
    setRules(rules) {
        // Sort rules ascending by priority (1 is highest priority)
        this.rules = [...rules].sort((a, b) => a.priority - b.priority);
    }
    getRules() {
        return this.rules;
    }
    matchPort(rulePort, packetPort) {
        if (!rulePort || rulePort.toUpperCase() === 'ANY')
            return true;
        if (packetPort === undefined)
            return false;
        // Check port range: e.g. "1024-65535"
        if (rulePort.includes('-')) {
            const [startStr, endStr] = rulePort.split('-');
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);
            return packetPort >= start && packetPort <= end;
        }
        // Exact port match: e.g. "80"
        const parsed = parseInt(rulePort, 10);
        return !isNaN(parsed) && parsed === packetPort;
    }
    matchProtocol(ruleProto, packetProto) {
        if (ruleProto === 'ANY')
            return true;
        return ruleProto.toUpperCase() === packetProto.toUpperCase();
    }
    /**
     * First-match Packet Inspection Algorithm
     */
    evaluatePacket(packet, updateHits = true) {
        const steps = [];
        for (const rule of this.rules) {
            if (!rule.enabled) {
                steps.push({
                    ruleId: rule.id,
                    priority: rule.priority,
                    description: rule.description,
                    matched: false,
                    mismatchReason: 'Rule is disabled administratively',
                });
                continue;
            }
            // Check Source IP / Subnet
            if (!(0, addressing_js_1.isIpInSubnet)(packet.sourceIp, rule.sourceSubnet)) {
                steps.push({
                    ruleId: rule.id,
                    priority: rule.priority,
                    description: rule.description,
                    matched: false,
                    mismatchReason: `Source IP ${packet.sourceIp} does not match ${rule.sourceSubnet}`,
                });
                continue;
            }
            // Check Destination IP / Subnet
            if (!(0, addressing_js_1.isIpInSubnet)(packet.destIp, rule.destSubnet)) {
                steps.push({
                    ruleId: rule.id,
                    priority: rule.priority,
                    description: rule.description,
                    matched: false,
                    mismatchReason: `Destination IP ${packet.destIp} does not match ${rule.destSubnet}`,
                });
                continue;
            }
            // Check Protocol
            if (!this.matchProtocol(rule.protocol, packet.protocol)) {
                steps.push({
                    ruleId: rule.id,
                    priority: rule.priority,
                    description: rule.description,
                    matched: false,
                    mismatchReason: `Protocol ${packet.protocol} does not match required ${rule.protocol}`,
                });
                continue;
            }
            // Check Destination Port
            if (!this.matchPort(rule.destPort, packet.destPort)) {
                steps.push({
                    ruleId: rule.id,
                    priority: rule.priority,
                    description: rule.description,
                    matched: false,
                    mismatchReason: `Destination Port ${packet.destPort ?? 'None'} does not match rule port ${rule.destPort}`,
                });
                continue;
            }
            // If we reach here, rule matched!
            if (updateHits) {
                rule.hitCount = (rule.hitCount || 0) + 1;
            }
            steps.push({
                ruleId: rule.id,
                priority: rule.priority,
                description: rule.description,
                matched: true,
                action: rule.action,
            });
            return {
                action: rule.action,
                matchedRule: rule,
                reason: `Matched Rule #${rule.priority} [${rule.id}]: "${rule.description}". Packet is ${rule.action}ED.`,
                evaluationSteps: steps,
            };
        }
        // Default Implicit Fallback if no rules matched
        return {
            action: 'DENY',
            matchedRule: null,
            reason: 'Implicit Deny: Packet did not match any configured ACL rules in the inspection chain.',
            evaluationSteps: steps,
        };
    }
}
exports.ACLEngine = ACLEngine;
