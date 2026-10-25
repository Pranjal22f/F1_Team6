"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QoSEngine = void 0;
class QoSEngine {
    /**
     * Run a discrete time-stepped traffic simulation across a congested bottleneck link
     * comparing Strict Priority Queueing (QoS) vs FIFO / Best Effort (No QoS).
     */
    simulateTraffic(config, linkBandwidthMbps = 100, queueCapacity = 60) {
        const durationMs = config.durationSeconds * 1000;
        const packetSize = config.packetSizeBytes || 1024; // Bytes
        const packetSizeBytes = packetSize;
        const packetBits = packetSizeBytes * 8;
        // Service time per packet on the link: bits / bps * 1000 ms
        const serviceTimeMs = (packetBits / (linkBandwidthMbps * 1_000_000)) * 1000;
        // Generate arrival times for the traffic classes
        // High: Voice (constant periodic rate, ~20% of traffic)
        // Medium: Web transactions (bursty, ~30% of traffic)
        // Low: Bulk file transfer (aggressive stream, ~50% of traffic)
        const totalPps = config.packetRatePps || 12000;
        const offeredBitsPerSec = totalPps * packetBits;
        const offeredLoadMbps = Number((offeredBitsPerSec / 1_000_000).toFixed(2));
        const packets = [];
        const intervalMs = 1000 / totalPps;
        let packetCount = Math.min(2000, Math.floor(totalPps * config.durationSeconds)); // Cap for browser rendering
        for (let i = 0; i < packetCount; i++) {
            const arrivalTimeMs = i * (intervalMs * (packetCount / (totalPps * config.durationSeconds)));
            let tClass = 'LOW';
            const rand = (i % 10);
            if (rand < 2)
                tClass = 'HIGH'; // 20%
            else if (rand < 5)
                tClass = 'MEDIUM'; // 30%
            else
                tClass = 'LOW'; // 50%
            packets.push({
                id: i + 1,
                trafficClass: tClass,
                sizeBytes: packetSizeBytes,
                arrivalTimeMs,
                dropped: false,
            });
        }
        // 1. Run Simulation with Strict Priority Queueing (High -> Medium -> Low)
        const withQos = this.runSimulationRun(packets, serviceTimeMs, queueCapacity, true, config.durationSeconds, linkBandwidthMbps);
        // 2. Run Simulation without QoS (FIFO tail-drop queue)
        const withoutQos = this.runSimulationRun(packets, serviceTimeMs, queueCapacity, false, config.durationSeconds, linkBandwidthMbps);
        return {
            withQos,
            withoutQos,
            packetTraceSummary: {
                totalSimulatedSeconds: config.durationSeconds,
                bottleneckBandwidthMbps: linkBandwidthMbps,
                offeredLoadMbps,
            },
        };
    }
    runSimulationRun(sourcePackets, serviceTimeMs, queueCapacity, useQoS, durationSec, linkBwMbps) {
        // Clone packets
        const packets = sourcePackets.map(p => ({ ...p }));
        let highQueue = [];
        let medQueue = [];
        let lowQueue = [];
        let fifoQueue = [];
        let linkBusyUntilMs = 0;
        let deliveredCount = 0;
        let droppedCount = 0;
        let totalDelaySum = 0;
        const classStats = {
            HIGH: { sent: 0, delivered: 0, dropped: 0, totalDelay: 0 },
            MEDIUM: { sent: 0, delivered: 0, dropped: 0, totalDelay: 0 },
            LOW: { sent: 0, delivered: 0, dropped: 0, totalDelay: 0 },
        };
        for (const pkt of packets) {
            classStats[pkt.trafficClass].sent++;
            if (useQoS) {
                // Enqueue into separate priority queues
                const currentQueueSize = highQueue.length + medQueue.length + lowQueue.length;
                if (currentQueueSize >= queueCapacity) {
                    // If buffer full, drop from lowest priority queue first
                    if (pkt.trafficClass === 'LOW') {
                        pkt.dropped = true;
                        pkt.dropReason = 'Buffer full (Tail-drop low priority)';
                        droppedCount++;
                        classStats[pkt.trafficClass].dropped++;
                        continue;
                    }
                    else if (pkt.trafficClass === 'MEDIUM' && lowQueue.length > 0) {
                        const evicted = lowQueue.pop();
                        evicted.dropped = true;
                        evicted.dropReason = 'Preempted by higher priority traffic';
                        droppedCount++;
                        classStats[evicted.trafficClass].dropped++;
                        medQueue.push(pkt);
                    }
                    else if (pkt.trafficClass === 'HIGH' && (lowQueue.length > 0 || medQueue.length > 0)) {
                        const evicted = lowQueue.length > 0 ? lowQueue.pop() : medQueue.pop();
                        evicted.dropped = true;
                        evicted.dropReason = 'Preempted by voice/video priority';
                        droppedCount++;
                        classStats[evicted.trafficClass].dropped++;
                        highQueue.push(pkt);
                    }
                    else {
                        pkt.dropped = true;
                        droppedCount++;
                        classStats[pkt.trafficClass].dropped++;
                        continue;
                    }
                }
                else {
                    if (pkt.trafficClass === 'HIGH')
                        highQueue.push(pkt);
                    else if (pkt.trafficClass === 'MEDIUM')
                        medQueue.push(pkt);
                    else
                        lowQueue.push(pkt);
                }
                // Process transmission from highest priority non-empty queue
                while (highQueue.length > 0 || medQueue.length > 0 || lowQueue.length > 0) {
                    let nextPkt;
                    if (highQueue.length > 0)
                        nextPkt = highQueue.shift();
                    else if (medQueue.length > 0)
                        nextPkt = medQueue.shift();
                    else
                        nextPkt = lowQueue.shift();
                    if (!nextPkt)
                        break;
                    const startTime = Math.max(linkBusyUntilMs, nextPkt.arrivalTimeMs);
                    const endTime = startTime + serviceTimeMs;
                    linkBusyUntilMs = endTime;
                    nextPkt.serviceStartTimeMs = startTime;
                    nextPkt.departureTimeMs = endTime;
                    const delay = endTime - nextPkt.arrivalTimeMs;
                    nextPkt.delayMs = delay;
                    deliveredCount++;
                    totalDelaySum += delay;
                    classStats[nextPkt.trafficClass].delivered++;
                    classStats[nextPkt.trafficClass].totalDelay += delay;
                    break; // Next arrival
                }
            }
            else {
                // FIFO Best Effort
                if (fifoQueue.length >= queueCapacity) {
                    pkt.dropped = true;
                    pkt.dropReason = 'Queue overflow (Tail-drop)';
                    droppedCount++;
                    classStats[pkt.trafficClass].dropped++;
                }
                else {
                    fifoQueue.push(pkt);
                    const startTime = Math.max(linkBusyUntilMs, pkt.arrivalTimeMs);
                    const endTime = startTime + serviceTimeMs;
                    linkBusyUntilMs = endTime;
                    pkt.serviceStartTimeMs = startTime;
                    pkt.departureTimeMs = endTime;
                    const delay = endTime - pkt.arrivalTimeMs;
                    pkt.delayMs = delay;
                    deliveredCount++;
                    totalDelaySum += delay;
                    classStats[pkt.trafficClass].delivered++;
                    classStats[pkt.trafficClass].totalDelay += delay;
                    fifoQueue.shift();
                }
            }
        }
        const totalSent = packets.length;
        const deliveredBits = deliveredCount * sourcePackets[0]?.sizeBytes * 8 || 0;
        const throughputBps = durationSec > 0 ? deliveredBits / durationSec : 0;
        const averageDelayMs = deliveredCount > 0 ? Number((totalDelaySum / deliveredCount).toFixed(2)) : 0;
        const packetLossPercentage = totalSent > 0 ? Number(((droppedCount / totalSent) * 100).toFixed(2)) : 0;
        const queueUtilization = Number(Math.min(100, ((deliveredCount + droppedCount) / queueCapacity) * 10).toFixed(1));
        const linkUtilization = Number(Math.min(100, (throughputBps / (linkBwMbps * 1_000_000)) * 100).toFixed(1));
        return {
            sentPackets: totalSent,
            deliveredPackets: deliveredCount,
            droppedPackets: droppedCount,
            throughputBps: Math.round(throughputBps),
            averageDelayMs,
            packetLossPercentage,
            queueUtilization,
            linkUtilization,
            classBreakdown: {
                high: {
                    sent: classStats.HIGH.sent,
                    delivered: classStats.HIGH.delivered,
                    dropped: classStats.HIGH.dropped,
                    lossRate: classStats.HIGH.sent > 0 ? Number(((classStats.HIGH.dropped / classStats.HIGH.sent) * 100).toFixed(2)) : 0,
                    delayMs: classStats.HIGH.delivered > 0 ? Number((classStats.HIGH.totalDelay / classStats.HIGH.delivered).toFixed(2)) : 0,
                },
                medium: {
                    sent: classStats.MEDIUM.sent,
                    delivered: classStats.MEDIUM.delivered,
                    dropped: classStats.MEDIUM.dropped,
                    lossRate: classStats.MEDIUM.sent > 0 ? Number(((classStats.MEDIUM.dropped / classStats.MEDIUM.sent) * 100).toFixed(2)) : 0,
                    delayMs: classStats.MEDIUM.delivered > 0 ? Number((classStats.MEDIUM.totalDelay / classStats.MEDIUM.delivered).toFixed(2)) : 0,
                },
                low: {
                    sent: classStats.LOW.sent,
                    delivered: classStats.LOW.delivered,
                    dropped: classStats.LOW.dropped,
                    lossRate: classStats.LOW.sent > 0 ? Number(((classStats.LOW.dropped / classStats.LOW.sent) * 100).toFixed(2)) : 0,
                    delayMs: classStats.LOW.delivered > 0 ? Number((classStats.LOW.totalDelay / classStats.LOW.delivered).toFixed(2)) : 0,
                },
            },
        };
    }
}
exports.QoSEngine = QoSEngine;
