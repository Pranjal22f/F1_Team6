import React, { useState } from 'react';
import { Gauge, Activity, AlertTriangle, CheckCircle2, Sliders, Play, BarChart2 } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { api } from '../services/api';

export const TrafficQoSPage: React.FC = () => {
  const [packetRate, setPacketRate] = useState(8000); // PPS
  const [duration, setDuration] = useState(2);        // seconds
  const [packetSize, setPacketSize] = useState(1024); // bytes
  const [bottleneckBw, setBottleneckBw] = useState(50); // Mbps bottleneck link
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResults, setSimResults] = useState<any>(null);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimResults(null);
    try {
      const res = await api.simulateTraffic({
        sourceDeviceId: 'pc-cse-1',
        destDeviceId: 'srv-web',
        trafficClass: 'HIGH',
        packetRatePps: packetRate,
        packetSizeBytes: packetSize,
        protocol: 'UDP',
        durationSeconds: duration,
        useQoS: true,
      });
      setSimResults(res);
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const chartLossData = simResults ? [
    {
      class: 'Voice / Video (High)',
      'Without QoS': simResults.withoutQos.classBreakdown.high.lossRate,
      'With QoS (Priority Queue)': simResults.withQos.classBreakdown.high.lossRate,
    },
    {
      class: 'Academic Web (Medium)',
      'Without QoS': simResults.withoutQos.classBreakdown.medium.lossRate,
      'With QoS (Priority Queue)': simResults.withQos.classBreakdown.medium.lossRate,
    },
    {
      class: 'Bulk Backup (Low)',
      'Without QoS': simResults.withoutQos.classBreakdown.low.lossRate,
      'With QoS (Priority Queue)': simResults.withQos.classBreakdown.low.lossRate,
    },
  ] : [];

  const chartDelayData = simResults ? [
    {
      class: 'Voice (High)',
      'Without QoS (ms)': simResults.withoutQos.classBreakdown.high.delayMs,
      'With QoS (ms)': simResults.withQos.classBreakdown.high.delayMs,
    },
    {
      class: 'Web (Medium)',
      'Without QoS (ms)': simResults.withoutQos.classBreakdown.medium.delayMs,
      'With QoS (ms)': simResults.withQos.classBreakdown.medium.delayMs,
    },
    {
      class: 'Bulk (Low)',
      'Without QoS (ms)': simResults.withoutQos.classBreakdown.low.delayMs,
      'With QoS (ms)': simResults.withQos.classBreakdown.low.delayMs,
    },
  ] : [];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center space-x-2.5">
          <Gauge className="w-5 h-5 text-cyan-400" />
          <span>Campus Traffic Congestion & QoS Performance Analyzer</span>
        </h2>
        <p className="text-xs text-noc-muted mt-1">
          Evaluate Strict Priority Queueing (PQ) vs FIFO Tail-Drop under synthetic bottleneck oversubscription
        </p>
      </div>

      {/* Traffic Generator Controls Card */}
      <div className="bg-noc-card border border-noc-border rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center space-x-2 border-b border-noc-border pb-3">
          <Sliders className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">Offered Traffic Load & Link Bottleneck Parameters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-mono text-noc-muted block mb-1.5">
              Traffic Rate: {packetRate.toLocaleString()} PPS
            </label>
            <input
              type="range"
              min="2000"
              max="20000"
              step="1000"
              value={packetRate}
              onChange={(e) => setPacketRate(Number(e.target.value))}
              className="w-full h-2 bg-noc-bg rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-[10px] font-mono text-noc-muted mt-1 block">
              Offered Load: ~{((packetRate * packetSize * 8) / 1_000_000).toFixed(1)} Mbps
            </span>
          </div>

          <div>
            <label className="text-xs font-mono text-noc-muted block mb-1.5">
              Packet Payload: {packetSize} Bytes
            </label>
            <select
              value={packetSize}
              onChange={(e) => setPacketSize(Number(e.target.value))}
              className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
            >
              <option value="512">512 Bytes (Small / Voice)</option>
              <option value="1024">1024 Bytes (Standard MTU)</option>
              <option value="1500">1500 Bytes (Max Ethernet MTU)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-noc-muted block mb-1.5">
              Simulation Duration: {duration} sec
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-2 bg-noc-bg rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-[10px] font-mono text-noc-muted mt-1 block">
              Sample Duration
            </span>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
            >
              <Play className="w-4 h-4" />
              <span>{isSimulating ? 'Injecting Traffic...' : 'Generate Traffic Flow'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comparative Simulation Results */}
      {simResults && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* High-level Summary Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Without QoS Box */}
            <div className="bg-noc-card border border-rose-800/40 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-noc-border pb-2.5">
                <span className="text-sm font-bold text-rose-400 font-mono">
                  Standard FIFO (Best Effort / No QoS)
                </span>
                <span className="text-[10px] font-mono bg-rose-950 text-rose-400 px-2 py-0.5 rounded border border-rose-800">
                  Tail-Drop Active
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs text-center">
                <div className="bg-noc-bg p-2.5 rounded-lg border border-noc-border">
                  <span className="text-[10px] text-noc-muted block">Delivered</span>
                  <span className="text-white font-bold">{simResults.withoutQos.deliveredPackets} pkts</span>
                </div>
                <div className="bg-noc-bg p-2.5 rounded-lg border border-noc-border">
                  <span className="text-[10px] text-noc-muted block">Loss Rate</span>
                  <span className="text-rose-400 font-bold">{simResults.withoutQos.packetLossPercentage}%</span>
                </div>
                <div className="bg-noc-bg p-2.5 rounded-lg border border-noc-border">
                  <span className="text-[10px] text-noc-muted block">Avg Delay</span>
                  <span className="text-amber-400 font-bold">{simResults.withoutQos.averageDelayMs} ms</span>
                </div>
              </div>
            </div>

            {/* With QoS Box */}
            <div className="bg-noc-card border border-cyan-800/50 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-noc-border pb-2.5">
                <span className="text-sm font-bold text-cyan-400 font-mono">
                  Strict Priority Queueing (QoS Enabled)
                </span>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800">
                  High Class Protected
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs text-center">
                <div className="bg-noc-bg p-2.5 rounded-lg border border-noc-border">
                  <span className="text-[10px] text-noc-muted block">Delivered</span>
                  <span className="text-white font-bold">{simResults.withQos.deliveredPackets} pkts</span>
                </div>
                <div className="bg-noc-bg p-2.5 rounded-lg border border-noc-border">
                  <span className="text-[10px] text-noc-muted block">Voice Loss</span>
                  <span className="text-emerald-400 font-bold">{simResults.withQos.classBreakdown.high.lossRate}%</span>
                </div>
                <div className="bg-noc-bg p-2.5 rounded-lg border border-noc-border">
                  <span className="text-[10px] text-noc-muted block">Voice Delay</span>
                  <span className="text-cyan-400 font-bold">{simResults.withQos.classBreakdown.high.delayMs} ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recharts Bar Charts for Loss & Delay */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Packet Loss Comparison Bar Chart */}
            <div className="bg-noc-card border border-noc-border rounded-xl p-5 shadow-lg">
              <h4 className="text-sm font-bold text-white mb-1">Packet Loss Rate by Traffic Class (%)</h4>
              <p className="text-xs text-noc-muted mb-4">Lower is better. Notice Voice loss drops to 0% with QoS.</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartLossData}>
                    <XAxis dataKey="class" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={11} unit="%" />
                    <Tooltip contentStyle={{ backgroundColor: '#090D16', borderColor: '#1E293B', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Without QoS" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="With QoS (Priority Queue)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Delay Comparison Bar Chart */}
            <div className="bg-noc-card border border-noc-border rounded-xl p-5 shadow-lg">
              <h4 className="text-sm font-bold text-white mb-1">Queueing Delay by Traffic Class (ms)</h4>
              <p className="text-xs text-noc-muted mb-4">Voice latency is minimized by preemptive Priority Queueing.</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDelayData}>
                    <XAxis dataKey="class" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={11} unit="ms" />
                    <Tooltip contentStyle={{ backgroundColor: '#090D16', borderColor: '#1E293B', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Without QoS (ms)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="With QoS (ms)" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
