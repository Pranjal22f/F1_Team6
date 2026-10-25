import React, { useState, useEffect } from 'react';
import { GitFork, ArrowRight, CheckCircle2, Shield, Network, Activity, Cpu } from 'lucide-react';
import { Device, RouterRoutingTable, RoutingProtocol } from '../types';
import { api } from '../services/api';

export const RoutingSimulatorPage: React.FC = () => {
  const [protocol, setProtocol] = useState<RoutingProtocol>('OSPF');
  const [tables, setTables] = useState<RouterRoutingTable[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  // Path Finder State
  const [sourceId, setSourceId] = useState('router-r1');
  const [destId, setDestId] = useState('pc-cse-1');
  const [pathResult, setPathResult] = useState<any>(null);
  const [calculatingPath, setCalculatingPath] = useState(false);

  useEffect(() => {
    loadData();
  }, [protocol]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tableData, topoData] = await Promise.all([
        api.getRoutingTables(protocol),
        api.getTopology(),
      ]);
      setTables(tableData);
      setDevices(topoData.devices);
    } catch (err) {
      console.error('Failed to load routing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComputePath = async () => {
    setCalculatingPath(true);
    try {
      const res = await api.findRoutePath(sourceId, destId, protocol);
      setPathResult(res);
    } catch (err: any) {
      alert(`Path lookup failed: ${err.message}`);
    } finally {
      setCalculatingPath(false);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header & Protocol Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <GitFork className="w-5 h-5 text-cyan-400" />
            <span>Campus Dynamic Routing Simulator</span>
          </h2>
          <p className="text-xs text-noc-muted mt-1">
            Compare Link-State (OSPF Dijkstra) with Distance-Vector (RIP Bellman-Ford) routing behavior
          </p>
        </div>

        {/* Protocol Selector Tabs */}
        <div className="flex bg-noc-card border border-noc-border rounded-xl p-1 self-start">
          {(['OSPF', 'RIP', 'STATIC'] as RoutingProtocol[]).map((p) => (
            <button
              key={p}
              onClick={() => setProtocol(p)}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                protocol === p
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-noc-muted hover:text-white'
              }`}
            >
              {p === 'OSPF' ? 'OSPF (Link-State)' : p === 'RIP' ? 'RIP (Distance-Vector)' : 'Static Routes'}
            </button>
          ))}
        </div>
      </div>

      {/* Protocol Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-noc-card border border-noc-border rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-noc-muted block">Selected Protocol</span>
          <span className="text-lg font-bold text-cyan-400 font-mono mt-1 block">
            {protocol === 'OSPF' ? 'OSPFv2 (Dijkstra SPF)' : protocol === 'RIP' ? 'RIPv2 (Bellman-Ford)' : 'Static Forwarding'}
          </span>
          <span className="text-xs text-noc-muted mt-1 block">
            {protocol === 'OSPF' ? 'Metric: Cumulative Cost (10^8/BW)' : protocol === 'RIP' ? 'Metric: Hop Count (Max 15)' : 'Metric: Administrative Distance 1'}
          </span>
        </div>

        <div className="bg-noc-card border border-noc-border rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-noc-muted block">Convergence Latency</span>
          <span className="text-lg font-bold text-emerald-400 font-mono mt-1 block">
            {protocol === 'OSPF' ? '~35 - 50 ms' : protocol === 'RIP' ? '~2.4 - 3.6 s' : 'Manual / None'}
          </span>
          <span className="text-xs text-noc-muted mt-1 block">
            {protocol === 'OSPF' ? 'Triggered LSA flooding' : protocol === 'RIP' ? 'Periodic 30s timers + holddown' : 'Static tables do not failover'}
          </span>
        </div>

        <div className="bg-noc-card border border-noc-border rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-noc-muted block">Loop Prevention Mechanism</span>
          <span className="text-lg font-bold text-purple-400 font-mono mt-1 block">
            {protocol === 'OSPF' ? 'SPF Tree Calculation' : protocol === 'RIP' ? 'Split Horizon + Poison Reverse' : 'Strict Hierarchy'}
          </span>
          <span className="text-xs text-noc-muted mt-1 block">
            {protocol === 'OSPF' ? 'Guaranteed loop-free topology' : protocol === 'RIP' ? 'Prevents count-to-infinity' : 'Static loop risk if misconfigured'}
          </span>
        </div>
      </div>

      {/* Interactive Path Finder */}
      <div className="bg-noc-card border border-noc-border rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center space-x-2 border-b border-noc-border pb-3">
          <Network className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Interactive End-to-End Route Path Finder</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-mono text-noc-muted block mb-1.5">Origin Node</label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.ipAddress || 'L2'})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-noc-muted block mb-1.5">Destination Node</label>
            <select
              value={destId}
              onChange={(e) => setDestId(e.target.value)}
              className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.ipAddress || 'L2'})</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleComputePath}
              disabled={calculatingPath}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
            >
              <Cpu className="w-4 h-4" />
              <span>Compute Shortest Route</span>
            </button>
          </div>
        </div>

        {/* Path Finder Result Visualizer */}
        {pathResult && (
          <div className="bg-noc-bg border border-noc-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-400 font-bold">
                Computed Path [{pathResult.protocol}]:
              </span>
              <span className="text-emerald-400">
                Metric Cost: {pathResult.totalCost} | Hops: {pathResult.totalHops} | Latency: {pathResult.totalLatencyMs}ms
              </span>
            </div>

            {pathResult.reachable ? (
              <div className="flex items-center flex-wrap gap-2 pt-1">
                {pathResult.path.map((nodeId: string, idx: number) => {
                  const dev = devices.find((d) => d.id === nodeId);
                  const isLast = idx === pathResult.path.length - 1;
                  return (
                    <div key={nodeId} className="flex items-center space-x-2">
                      <div className="bg-noc-card border border-cyan-500/40 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-white">
                        {dev?.name || nodeId}
                      </div>
                      {!isLast && <ArrowRight className="w-3.5 h-3.5 text-noc-muted shrink-0" />}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-400 rounded-lg text-xs font-mono">
                {pathResult.unreachableReason || 'Destination unreachable along current topology links.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Router Routing Tables Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-noc-muted">
          Active Forwarding Information Bases (FIB) per Router
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tables.map((t) => (
            <div key={t.routerId} className="bg-noc-card border border-noc-border rounded-xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-noc-border pb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <h4 className="text-sm font-bold text-white font-mono">{t.routerName}</h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-semibold">
                  Protocol: {t.protocol}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-noc-bg text-noc-muted">
                    <tr>
                      <th className="p-2">Destination Subnet</th>
                      <th className="p-2">Next Hop IP</th>
                      <th className="p-2">Interface</th>
                      <th className="p-2">Cost/Metric</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-noc-border/60">
                    {t.routes.map((r, i) => (
                      <tr key={i} className="hover:bg-noc-bg/50">
                        <td className="p-2 text-cyan-400 font-semibold">{r.destination}</td>
                        <td className="p-2 text-slate-300">{r.nextHop}</td>
                        <td className="p-2 text-purple-300">{r.interfaceName}</td>
                        <td className="p-2 text-emerald-400 font-bold">{r.metric}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
