import React, { useState } from 'react';
import { HelpCircle, RefreshCw, BookOpen, Code, Database, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import { api } from '../services/api';

export const SettingsDocsPage: React.FC = () => {
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleReset = async () => {
    if (confirm('Are you sure you want to restore the initial demo campus network topology, VLANs, and ACL rules? All custom modifications will be reverted.')) {
      setResetting(true);
      setResetMessage(null);
      try {
        const res = await api.resetTopology();
        setResetMessage(res.message);
      } catch (err: any) {
        alert(`Reset failed: ${err.message}`);
      } finally {
        setResetting(false);
      }
    }
  };

  const handleExportBackup = async () => {
    try {
      const topo = await api.getTopology();
      const blob = new Blob([JSON.stringify(topo, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Smart_Campus_Network_State_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center space-x-2.5">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <span>System Documentation, REST API Reference & Settings</span>
        </h2>
        <p className="text-xs text-noc-muted mt-1">
          Architectural documentation, university network specifications, viva voce study notes, and configuration persistence controls
        </p>
      </div>

      {/* Network Design Architecture Reference */}
      <div className="bg-noc-card border border-noc-border rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center space-x-2 border-b border-noc-border pb-3">
          <Database className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-white">Campus Core Architecture & High-Availability Design</h3>
        </div>

        <div className="space-y-4 text-xs font-mono text-slate-300 leading-relaxed">
          <p>
            The university network is modeled after standard Cisco 3-tier enterprise hierarchical architecture:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-noc-bg p-4 rounded-xl border border-noc-border space-y-2">
              <span className="text-cyan-400 font-bold block text-sm">1. Core Layer (Mesh Backbone)</span>
              <p className="text-noc-muted">
                Routers R1, R2, and R3 form a redundant triangle with high-speed 10 Gbps interconnects. R1 serves as the border gateway with NAT/PAT translation to ISP (203.0.113.1). OSPF dynamically selects paths with sub-50ms convergence.
              </p>
            </div>

            <div className="bg-noc-bg p-4 rounded-xl border border-noc-border space-y-2">
              <span className="text-purple-400 font-bold block text-sm">2. Distribution Layer</span>
              <p className="text-noc-muted">
                Layer-3 distribution switches (SW-Core, SW-Academic, SW-Server) aggregate departmental traffic, enforce 802.1Q inter-VLAN routing, and apply strict first-match firewall ACL policies.
              </p>
            </div>

            <div className="bg-noc-bg p-4 rounded-xl border border-noc-border space-y-2">
              <span className="text-emerald-400 font-bold block text-sm">3. Access Layer & Edge</span>
              <p className="text-noc-muted">
                Layer-2 switches and dual-band Wi-Fi APs connect end-user terminals across 9 segregated VLANs: CSE, ECE, Administration, Faculty, Student Wi-Fi, Library, Server Farm, IoT Sensors, and Out-of-band Management.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* REST API Endpoints Overview */}
      <div className="bg-noc-card border border-noc-border rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 border-b border-noc-border pb-3">
          <Code className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Backend REST API Reference</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-noc-bg text-noc-muted border-b border-noc-border">
              <tr>
                <th className="p-3">Method</th>
                <th className="p-3">Endpoint Path</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Input / Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-noc-border/60">
              <tr>
                <td className="p-2.5 text-cyan-400 font-bold">GET</td>
                <td className="p-2.5 text-white">/api/stats/dashboard</td>
                <td className="p-2.5 text-slate-300">Retrieve real-time telemetry metrics and NOC alerts</td>
                <td className="p-2.5 text-noc-muted">—</td>
              </tr>
              <tr>
                <td className="p-2.5 text-cyan-400 font-bold">GET</td>
                <td className="p-2.5 text-white">/api/topology</td>
                <td className="p-2.5 text-slate-300">Fetch active nodes, links, and VLANs from SQLite</td>
                <td className="p-2.5 text-noc-muted">—</td>
              </tr>
              <tr>
                <td className="p-2.5 text-purple-400 font-bold">POST</td>
                <td className="p-2.5 text-white">/api/routing/path</td>
                <td className="p-2.5 text-slate-300">Compute Dijkstra or Bellman-Ford shortest route</td>
                <td className="p-2.5 text-noc-muted">{"{ sourceId, destId, protocol }"}</td>
              </tr>
              <tr>
                <td className="p-2.5 text-purple-400 font-bold">POST</td>
                <td className="p-2.5 text-white">/api/fault/simulate</td>
                <td className="p-2.5 text-slate-300">Simulate link failure, calculate convergence & loss</td>
                <td className="p-2.5 text-noc-muted">{"{ sourceId, destId, linkIdToFail, protocol }"}</td>
              </tr>
              <tr>
                <td className="p-2.5 text-purple-400 font-bold">POST</td>
                <td className="p-2.5 text-white">/api/security/inspect</td>
                <td className="p-2.5 text-slate-300">Execute first-match packet evaluation against ACLs</td>
                <td className="p-2.5 text-noc-muted">{"{ sourceIp, destIp, protocol, destPort }"}</td>
              </tr>
              <tr>
                <td className="p-2.5 text-purple-400 font-bold">POST</td>
                <td className="p-2.5 text-white">/api/traffic/simulate</td>
                <td className="p-2.5 text-slate-300">Simulate Priority Queueing QoS vs FIFO congestion</td>
                <td className="p-2.5 text-noc-muted">{"{ packetRatePps, packetSizeBytes, useQoS }"}</td>
              </tr>
              <tr>
                <td className="p-2.5 text-purple-400 font-bold">POST</td>
                <td className="p-2.5 text-white">/api/packet-trace</td>
                <td className="p-2.5 text-slate-300">Generate multi-hop step-by-step packet trace animation</td>
                <td className="p-2.5 text-noc-muted">{"{ sourceDeviceId, destDeviceId, protocol }"}</td>
              </tr>
              <tr>
                <td className="p-2.5 text-cyan-400 font-bold">GET</td>
                <td className="p-2.5 text-white">/api/experiments</td>
                <td className="p-2.5 text-slate-300">Retrieve all 5 laboratory experiment reports & viva</td>
                <td className="p-2.5 text-noc-muted">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Network Persistence & Reset Section */}
      <div className="bg-noc-card border border-noc-border rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 border-b border-noc-border pb-3">
          <RefreshCw className="w-5 h-5 text-rose-400" />
          <h3 className="text-base font-bold text-white">State Management & Reset to Demo</h3>
        </div>

        <p className="text-xs text-noc-muted leading-relaxed">
          The SQLite database automatically persists all device additions, link status changes, and ACL rules to disk. Use the controls below to download a full JSON backup of your campus network or reset the environment to the factory default demo state.
        </p>

        {resetMessage && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-400 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{resetMessage}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleExportBackup}
            className="px-4 py-2 rounded-xl bg-noc-bg border border-noc-border hover:bg-noc-hover text-white font-mono text-xs shadow-md transition-all flex items-center space-x-2"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download Full Network State (JSON)</span>
          </button>

          <button
            onClick={handleReset}
            disabled={resetting}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold shadow-md transition-all flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Restoring...' : 'Reset to Default Campus Demo Network'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
