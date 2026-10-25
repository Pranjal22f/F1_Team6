import React, { useState, useEffect } from 'react';
import { Layers, Calculator, ShieldCheck, AlertCircle, CheckCircle2, Binary, Hash } from 'lucide-react';
import { VLAN, SubnetDetails, VlsmAllocation } from '../types';
import { api } from '../services/api';

export const VlanAddressingPage: React.FC = () => {
  const [vlans, setVlans] = useState<VLAN[]>([]);
  const [loading, setLoading] = useState(true);

  // Subnet Calculator State
  const [calcIp, setCalcIp] = useState('10.10.0.50');
  const [calcPrefix, setCalcPrefix] = useState(24);
  const [calcResult, setCalcResult] = useState<SubnetDetails | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  // VLSM Planner State
  const [parentCidr, setParentCidr] = useState('192.168.1.0/24');
  const [departmentsInput, setDepartmentsInput] = useState([
    { name: 'Student Dorms (Wi-Fi)', requiredHosts: 120 },
    { name: 'CSE Computer Labs', requiredHosts: 60 },
    { name: 'ECE Hardware Lab', requiredHosts: 28 },
    { name: 'Administrative Staff', requiredHosts: 14 },
    { name: 'Point-to-Point WAN', requiredHosts: 2 },
  ]);
  const [vlsmResults, setVlsmResults] = useState<VlsmAllocation[]>([]);

  useEffect(() => {
    loadVlans();
    handleRunCalculator();
  }, []);

  const loadVlans = async () => {
    try {
      const data = await api.getVlans();
      setVlans(data);
    } catch (err) {
      console.error('Failed to load VLANs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCalculator = async () => {
    setCalcError(null);
    try {
      const res = await api.calculateSubnet(calcIp, calcPrefix);
      setCalcResult(res);
    } catch (err: any) {
      setCalcError(err.message);
    }
  };

  const handleRunVlsm = async () => {
    try {
      const res = await api.calculateVlsm(parentCidr, departmentsInput);
      setVlsmResults(res);
    } catch (err: any) {
      alert(`VLSM error: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>Campus VLAN Architecture & Addressing Plan</span>
          </h2>
          <p className="text-xs text-noc-muted mt-1">
            IEEE 802.1Q broadcast domain segmentation, dual-stack IPv4/IPv6, and VLSM subnets
          </p>
        </div>
      </div>

      {/* VLAN Cards Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-noc-muted">
          Active University VLAN Segments (9 Configured Domains)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vlans.map((v) => (
            <div
              key={v.id}
              className="bg-noc-card border border-noc-border rounded-xl p-4 shadow-lg hover:border-noc-borderLight transition-all relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 w-1.5 h-full"
                style={{ backgroundColor: v.color }}
              />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-noc-bg border border-noc-border text-white">
                  VLAN {v.id}
                </span>
                <span className="text-[11px] font-mono text-cyan-400 font-semibold truncate max-w-[150px]">
                  {v.name}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">{v.department}</h4>
              <div className="space-y-1.5 text-xs font-mono bg-noc-bg p-2.5 rounded-lg border border-noc-border/80">
                <div className="flex justify-between">
                  <span className="text-noc-muted">IPv4 Subnet:</span>
                  <span className="text-emerald-400 font-bold">{v.ipv4Subnet}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-noc-muted">Gateway:</span>
                  <span className="text-slate-300">{v.ipv4Gateway}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-noc-muted">IPv6 Subnet:</span>
                  <span className="text-purple-400 truncate max-w-[140px]">{v.ipv6Subnet}</span>
                </div>
              </div>
              <p className="text-[11px] text-noc-muted mt-2 leading-relaxed">
                {v.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time IP Subnet Calculator */}
      <div className="bg-noc-card border border-noc-border rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center space-x-2 border-b border-noc-border pb-3">
          <Calculator className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Interactive IPv4 Subnet Calculator</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-mono text-noc-muted block mb-1.5">
              IP Address
            </label>
            <input
              type="text"
              value={calcIp}
              onChange={(e) => setCalcIp(e.target.value)}
              className="w-full bg-noc-bg border border-noc-border rounded-xl px-3.5 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
              placeholder="e.g. 10.10.0.50"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-noc-muted block mb-1.5">
              CIDR Prefix Length (/{calcPrefix})
            </label>
            <input
              type="range"
              min="1"
              max="32"
              value={calcPrefix}
              onChange={(e) => setCalcPrefix(Number(e.target.value))}
              className="w-full h-2 bg-noc-bg rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-noc-muted mt-1">
              <span>/8 (WAN)</span>
              <span>/24 (LAN)</span>
              <span>/30 (P2P)</span>
              <span>/32 (Host)</span>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunCalculator}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
            >
              <Calculator className="w-4 h-4" />
              <span>Calculate Subnet Details</span>
            </button>
          </div>
        </div>

        {calcError && (
          <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-400 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{calcError}</span>
          </div>
        )}

        {calcResult && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="bg-noc-bg border border-noc-border rounded-xl p-3.5 font-mono text-xs">
              <span className="text-noc-muted text-[10px] block">Network Address</span>
              <span className="text-emerald-400 font-bold text-sm">{calcResult.networkAddress}</span>
            </div>
            <div className="bg-noc-bg border border-noc-border rounded-xl p-3.5 font-mono text-xs">
              <span className="text-noc-muted text-[10px] block">Broadcast Address</span>
              <span className="text-cyan-400 font-bold text-sm">{calcResult.broadcastAddress}</span>
            </div>
            <div className="bg-noc-bg border border-noc-border rounded-xl p-3.5 font-mono text-xs">
              <span className="text-noc-muted text-[10px] block">Subnet Mask</span>
              <span className="text-white font-bold text-sm">{calcResult.subnetMask}</span>
            </div>
            <div className="bg-noc-bg border border-noc-border rounded-xl p-3.5 font-mono text-xs">
              <span className="text-noc-muted text-[10px] block">Usable Host Capacity</span>
              <span className="text-purple-400 font-bold text-sm">{calcResult.usableHosts.toLocaleString()} hosts</span>
            </div>

            <div className="lg:col-span-2 bg-noc-bg border border-noc-border rounded-xl p-3.5 font-mono text-xs">
              <span className="text-noc-muted text-[10px] block">Usable Host Range</span>
              <span className="text-slate-200 font-bold">
                {calcResult.firstUsableHost} — {calcResult.lastUsableHost}
              </span>
            </div>
            <div className="lg:col-span-2 bg-noc-bg border border-noc-border rounded-xl p-3.5 font-mono text-xs">
              <span className="text-noc-muted text-[10px] block">Binary Subnet Mask</span>
              <span className="text-cyan-300 font-bold text-[11px] truncate block">
                {calcResult.subnetMaskBinary}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* VLSM Hierarchical Allocation Tool */}
      <div className="bg-noc-card border border-noc-border rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-noc-border pb-3">
          <div className="flex items-center space-x-2">
            <Hash className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">VLSM Hierarchical Address Planner</h3>
          </div>
          <button
            onClick={handleRunVlsm}
            className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all"
          >
            Compute VLSM Allocations
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <label className="text-xs font-mono text-noc-muted">Parent IPv4 Block:</label>
          <input
            type="text"
            value={parentCidr}
            onChange={(e) => setParentCidr(e.target.value)}
            className="bg-noc-bg border border-noc-border rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
          />
        </div>

        {vlsmResults.length > 0 && (
          <div className="bg-noc-bg border border-noc-border rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-noc-card border-b border-noc-border text-noc-muted">
                <tr>
                  <th className="p-3">Department Name</th>
                  <th className="p-3">Required Hosts</th>
                  <th className="p-3">Allocated Size</th>
                  <th className="p-3">Prefix</th>
                  <th className="p-3">Subnet Address</th>
                  <th className="p-3">Usable Range</th>
                  <th className="p-3">Broadcast</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-noc-border/60">
                {vlsmResults.map((v, i) => (
                  <tr key={i} className="hover:bg-noc-card/50">
                    <td className="p-3 text-white font-semibold">{v.name}</td>
                    <td className="p-3 text-amber-400">{v.requiredHosts}</td>
                    <td className="p-3 text-emerald-400">{v.allocatedHosts}</td>
                    <td className="p-3 text-cyan-400 font-bold">/{v.prefixLength}</td>
                    <td className="p-3 text-slate-300">{v.networkAddress}</td>
                    <td className="p-3 text-cyan-300">{v.usableHostRange}</td>
                    <td className="p-3 text-slate-400">{v.broadcastAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
