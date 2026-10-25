import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, RotateCcw, ArrowRight, Activity, Zap } from 'lucide-react';
import { NetworkLink, RoutingProtocol } from '../types';
import { api } from '../services/api';

export const FaultTolerancePage: React.FC = () => {
  const [links, setLinks] = useState<NetworkLink[]>([]);
  const [selectedLinkToFail, setSelectedLinkToFail] = useState('link-r1-r2');
  const [protocol, setProtocol] = useState<RoutingProtocol>('OSPF');
  const [testResult, setTestResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const topo = await api.getTopology();
      setLinks(topo.links);
    } catch (err) {
      console.error('Failed to load links:', err);
    }
  };

  const handleRunFaultSimulation = async () => {
    setIsRunning(true);
    setTestResult(null);
    try {
      const res = await api.simulateFault('router-r1', 'pc-cse-1', selectedLinkToFail, protocol);
      setTestResult(res);
    } catch (err: any) {
      alert(`Fault simulation error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center space-x-2.5">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          <span>Fault Tolerance & Redundant Failover Lab</span>
        </h2>
        <p className="text-xs text-noc-muted mt-1">
          Measure convergence time, alternate path failover, and packet loss resilience in redundant mesh topologies
        </p>
      </div>

      {/* Redundant Triangle Scenario Card */}
      <div className="bg-noc-card border border-noc-border rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-noc-border pb-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Demonstration Topology: Core Triangle Redundancy (R1 ── R2 ── R3)
            </h3>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-semibold px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-800">
            Triangular Dual-Homing
          </span>
        </div>

        <p className="text-xs text-noc-muted leading-relaxed">
          The campus core implements a resilient mesh topology: Edge Router R1 connects directly to Core Router R2 (Cost: 5) and Core Router R3 (Cost: 12). R2 and R3 are interconnected via a high-speed trunk (Cost: 5). If primary link R1-R2 is severed, OSPF link-state flooding detects the link loss and activates the secondary path via R3 within milliseconds.
        </p>

        {/* Experiment Setup Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="text-xs font-mono text-noc-muted block mb-1.5">
              Select Link to Sever / Fail
            </label>
            <select
              value={selectedLinkToFail}
              onChange={(e) => setSelectedLinkToFail(e.target.value)}
              className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-rose-500"
            >
              {links.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.id} ({l.sourceDeviceId} ↔ {l.targetDeviceId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-noc-muted block mb-1.5">
              Routing Protocol Tested
            </label>
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value as RoutingProtocol)}
              className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-xs font-mono text-cyan-400 focus:outline-none"
            >
              <option value="OSPF">OSPF Link-State (Dijkstra)</option>
              <option value="RIP">RIP Distance-Vector (Bellman-Ford)</option>
              <option value="STATIC">Static Routes (No Dynamic Failover)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunFaultSimulation}
              disabled={isRunning}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{isRunning ? 'Measuring Convergence...' : 'Sever Link & Run Failover'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Failover Test Results Box */}
      {testResult && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-noc-card border border-noc-border rounded-xl p-4">
              <span className="text-[10px] font-mono uppercase text-noc-muted block">Resilience Status</span>
              <span className={`text-lg font-bold font-mono mt-1 block ${testResult.isResilient ? 'text-emerald-400' : 'text-rose-400'}`}>
                {testResult.isResilient ? 'PASS: Alternate Route Active' : 'FAIL: Complete Outage'}
              </span>
            </div>

            <div className="bg-noc-card border border-noc-border rounded-xl p-4">
              <span className="text-[10px] font-mono uppercase text-noc-muted block">Convergence Duration</span>
              <span className="text-lg font-bold text-cyan-400 font-mono mt-1 block">
                {testResult.convergenceTimeMs === Infinity ? 'Infinity' : `${testResult.convergenceTimeMs} ms`}
              </span>
            </div>

            <div className="bg-noc-card border border-noc-border rounded-xl p-4">
              <span className="text-[10px] font-mono uppercase text-noc-muted block">Transient Packet Loss</span>
              <span className={`text-lg font-bold font-mono mt-1 block ${testResult.packetLossPercentage < 5 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {testResult.packetLossPercentage}%
              </span>
            </div>

            <div className="bg-noc-card border border-noc-border rounded-xl p-4">
              <span className="text-[10px] font-mono uppercase text-noc-muted block">Delivered / Sent</span>
              <span className="text-lg font-bold text-white font-mono mt-1 block">
                {testResult.packetsDelivered} / {testResult.packetsSent} pkts
              </span>
            </div>
          </div>

          {/* Before vs After Path Comparison */}
          <div className="bg-noc-card border border-noc-border rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-noc-muted">
              Forwarding Path Transition: Pre-Failure vs Failover
            </h3>

            <div className="space-y-3">
              {/* Baseline Path */}
              <div className="p-3 bg-noc-bg border border-emerald-800/40 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>1. Baseline Steady-State Route (Cost: {testResult.preFailurePath.totalCost}):</span>
                  </span>
                  <span className="text-noc-muted">Status: Optimal</span>
                </div>
                <div className="flex items-center flex-wrap gap-2 text-xs font-mono text-white">
                  {testResult.preFailurePath.path.map((n: string, i: number) => (
                    <span key={i} className="flex items-center space-x-1">
                      <span className="px-2 py-0.5 rounded bg-noc-card border border-noc-border">{n}</span>
                      {i < testResult.preFailurePath.path.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-noc-muted" />}
                    </span>
                  ))}
                </div>
              </div>

              {/* During Failure Path */}
              <div className={`p-3 bg-noc-bg border rounded-xl space-y-1.5 ${testResult.duringFailurePath.reachable ? 'border-cyan-800/50' : 'border-rose-800/60'}`}>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className={`font-bold flex items-center space-x-1.5 ${testResult.duringFailurePath.reachable ? 'text-cyan-400' : 'text-rose-400'}`}>
                    <AlertTriangle className="w-4 h-4" />
                    <span>2. Dynamic Failover Route (Cost: {testResult.duringFailurePath.totalCost}):</span>
                  </span>
                  <span className={testResult.duringFailurePath.reachable ? 'text-cyan-400' : 'text-rose-400'}>
                    {testResult.duringFailurePath.reachable ? 'Rerouted through Redundant Mesh' : 'Dead End / Disconnected'}
                  </span>
                </div>
                {testResult.duringFailurePath.reachable ? (
                  <div className="flex items-center flex-wrap gap-2 text-xs font-mono text-white">
                    {testResult.duringFailurePath.path.map((n: string, i: number) => (
                      <span key={i} className="flex items-center space-x-1">
                        <span className="px-2 py-0.5 rounded bg-noc-card border border-cyan-500/40 text-cyan-300 font-bold">{n}</span>
                        {i < testResult.duringFailurePath.path.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-noc-muted" />}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-rose-400">
                    No alternate path exists. Network isolated.
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-300 pt-2 border-t border-noc-border/60">
              <strong className="text-cyan-400 font-mono">Engineering Observation: </strong>
              {testResult.explanation}
            </p>
          </div>

          {/* Event Logs */}
          <div className="bg-noc-card border border-noc-border rounded-2xl p-6 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-noc-muted">
              Convergence Event Stream
            </h3>
            <div className="space-y-2">
              {testResult.eventLogs?.map((log: any, idx: number) => (
                <div key={idx} className="p-3 bg-noc-bg border border-noc-border rounded-lg text-xs font-mono flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-rose-400 font-bold">[{log.eventType}]</span>
                    <span className="text-white">{log.message}</span>
                  </div>
                  <span className="text-noc-muted">{log.timestamp.slice(11, 19)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
