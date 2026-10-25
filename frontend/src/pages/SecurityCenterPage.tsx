import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Plus, Trash2, CheckCircle2, XCircle, Search, ToggleLeft, ToggleRight, ArrowDown } from 'lucide-react';
import { ACLRule, TransportProtocol, ACLAction } from '../types';
import { api } from '../services/api';

export const SecurityCenterPage: React.FC = () => {
  const [rules, setRules] = useState<ACLRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Packet Inspection Tester State
  const [inspectSrc, setInspectSrc] = useState('10.50.0.105');
  const [inspectDst, setInspectDst] = useState('10.30.0.25');
  const [inspectProto, setInspectProto] = useState<TransportProtocol>('TCP');
  const [inspectPort, setInspectPort] = useState(80);
  const [inspectResult, setInspectResult] = useState<any>(null);
  const [inspecting, setInspecting] = useState(false);

  // New Rule Form Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPriority, setNewPriority] = useState(55);
  const [newDesc, setNewDesc] = useState('');
  const [newSrc, setNewSrc] = useState('10.50.0.0/24');
  const [newDst, setNewDst] = useState('10.70.0.12/32');
  const [newProto, setNewProto] = useState<TransportProtocol>('TCP');
  const [newPort, setNewPort] = useState('80');
  const [newAction, setNewAction] = useState<ACLAction>('ALLOW');

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await api.getAclRules();
      setRules(data);
    } catch (err) {
      console.error('Failed to load ACL rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async (rule: ACLRule) => {
    const updated = { ...rule, enabled: !rule.enabled };
    try {
      await api.saveAclRule(updated);
      loadRules();
    } catch (err) {
      console.error('Toggle rule failed:', err);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (confirm('Delete this firewall ACL rule?')) {
      try {
        await api.deleteAclRule(id);
        loadRules();
      } catch (err) {
        console.error('Delete rule failed:', err);
      }
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const rule: ACLRule = {
      id: `acl-${Date.now()}`,
      priority: Number(newPriority),
      description: newDesc,
      sourceSubnet: newSrc,
      destSubnet: newDst,
      protocol: newProto,
      destPort: newPort || 'ANY',
      action: newAction,
      enabled: true,
      hitCount: 0,
    };
    try {
      await api.saveAclRule(rule);
      setShowAddModal(false);
      loadRules();
    } catch (err: any) {
      alert(`Save rule failed: ${err.message}`);
    }
  };

  const handleInspectPacket = async () => {
    setInspecting(true);
    try {
      const res = await api.inspectPacket(inspectSrc, inspectDst, inspectProto, inspectPort);
      setInspectResult(res);
      loadRules(); // Refresh hit count
    } catch (err: any) {
      alert(`Inspection failed: ${err.message}`);
    } finally {
      setInspecting(false);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span>Network Security Center & Access Control Lists</span>
          </h2>
          <p className="text-xs text-noc-muted mt-1">
            First-match sequential rule evaluation, campus segmentation & interactive packet inspection
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom ACL Rule</span>
        </button>
      </div>

      {/* Live Packet Inspection Tester */}
      <div className="bg-noc-card border border-noc-border rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center space-x-2 border-b border-noc-border pb-3">
          <Search className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-white">Interactive Live Packet Inspection Tester</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] font-mono text-noc-muted block mb-1">Source IP Address</label>
            <input
              type="text"
              value={inspectSrc}
              onChange={(e) => setInspectSrc(e.target.value)}
              className="w-full bg-noc-bg border border-noc-border rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
              placeholder="e.g. 10.50.0.105"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-noc-muted block mb-1">Destination IP Address</label>
            <input
              type="text"
              value={inspectDst}
              onChange={(e) => setInspectDst(e.target.value)}
              className="w-full bg-noc-bg border border-noc-border rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
              placeholder="e.g. 10.30.0.25"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-noc-muted block mb-1">Layer 4 Protocol</label>
            <select
              value={inspectProto}
              onChange={(e) => setInspectProto(e.target.value as TransportProtocol)}
              className="w-full bg-noc-bg border border-noc-border rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-400 focus:outline-none"
            >
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
              <option value="ANY">ANY</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono text-noc-muted block mb-1">Dest Port</label>
            <input
              type="number"
              value={inspectPort}
              onChange={(e) => setInspectPort(Number(e.target.value))}
              className="w-full bg-noc-bg border border-noc-border rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
              placeholder="80, 22, 53"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleInspectPacket}
              disabled={inspecting}
              className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Inspect Packet</span>
            </button>
          </div>
        </div>

        {/* Inspection Result Box */}
        {inspectResult && (
          <div className="p-4 bg-noc-bg border border-noc-border rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {inspectResult.action === 'ALLOW' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
                <span className={`text-sm font-bold font-mono ${inspectResult.action === 'ALLOW' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  POLICY VERDICT: {inspectResult.action}ED
                </span>
              </div>
              <span className="text-xs font-mono text-noc-muted">
                {inspectResult.matchedRule ? `Rule #${inspectResult.matchedRule.priority} Matched` : 'Implicit Deny'}
              </span>
            </div>

            <p className="text-xs text-slate-300 font-mono bg-noc-card p-3 rounded-lg border border-noc-border/60">
              {inspectResult.reason}
            </p>
          </div>
        )}
      </div>

      {/* ACL Rules Table */}
      <div className="bg-noc-card border border-noc-border rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-noc-muted">
            Ordered ACL Rule Chain (First-Match Sequential Evaluation)
          </h3>
          <span className="text-xs font-mono text-cyan-400">Total Rules: {rules.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-noc-bg text-noc-muted border-b border-noc-border">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Description</th>
                <th className="p-3">Source Subnet</th>
                <th className="p-3">Dest Subnet</th>
                <th className="p-3">Protocol</th>
                <th className="p-3">Port</th>
                <th className="p-3">Action</th>
                <th className="p-3">Hits</th>
                <th className="p-3">State</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-noc-border/60">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-noc-bg/40 transition-colors">
                  <td className="p-3 text-cyan-400 font-bold">#{rule.priority}</td>
                  <td className="p-3 text-white max-w-[220px] truncate">{rule.description}</td>
                  <td className="p-3 text-slate-300">{rule.sourceSubnet}</td>
                  <td className="p-3 text-slate-300">{rule.destSubnet}</td>
                  <td className="p-3 text-purple-300">{rule.protocol}</td>
                  <td className="p-3 text-amber-300">{rule.destPort || 'ANY'}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rule.action === 'ALLOW'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {rule.action}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">{rule.hitCount}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleRule(rule)}
                      className="text-noc-muted hover:text-white"
                      title={rule.enabled ? 'Disable Rule' : 'Enable Rule'}
                    >
                      {rule.enabled ? (
                        <ToggleRight className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-600" />
                      )}
                    </button>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-noc-muted hover:text-rose-400 transition-colors"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-noc-card border border-noc-border rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Add Custom Firewall ACL Rule</h3>
            <form onSubmit={handleCreateRule} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-noc-muted block mb-1">Priority (Order)</label>
                <input
                  type="number"
                  value={newPriority}
                  onChange={(e) => setNewPriority(Number(e.target.value))}
                  className="w-full bg-noc-bg border border-noc-border rounded-lg p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-noc-muted block mb-1">Description</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-noc-bg border border-noc-border rounded-lg p-2 text-white"
                  placeholder="e.g. Allow Student access to Mail"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-noc-muted block mb-1">Source Subnet</label>
                  <input
                    type="text"
                    value={newSrc}
                    onChange={(e) => setNewSrc(e.target.value)}
                    className="w-full bg-noc-bg border border-noc-border rounded-lg p-2 text-white"
                    placeholder="10.50.0.0/24 or ANY"
                    required
                  />
                </div>
                <div>
                  <label className="text-noc-muted block mb-1">Dest Subnet</label>
                  <input
                    type="text"
                    value={newDst}
                    onChange={(e) => setNewDst(e.target.value)}
                    className="w-full bg-noc-bg border border-noc-border rounded-lg p-2 text-white"
                    placeholder="10.70.0.14/32 or ANY"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-noc-muted block mb-1">Protocol</label>
                  <select
                    value={newProto}
                    onChange={(e) => setNewProto(e.target.value as TransportProtocol)}
                    className="w-full bg-noc-bg border border-noc-border rounded-lg p-2 text-white"
                  >
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                    <option value="ICMP">ICMP</option>
                    <option value="ANY">ANY</option>
                  </select>
                </div>
                <div>
                  <label className="text-noc-muted block mb-1">Dest Port</label>
                  <input
                    type="text"
                    value={newPort}
                    onChange={(e) => setNewPort(e.target.value)}
                    className="w-full bg-noc-bg border border-noc-border rounded-lg p-2 text-white"
                    placeholder="80, 22, ANY"
                  />
                </div>
                <div>
                  <label className="text-noc-muted block mb-1">Action</label>
                  <select
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value as ACLAction)}
                    className="w-full bg-noc-bg border border-noc-border rounded-lg p-2 text-white"
                  >
                    <option value="ALLOW">ALLOW</option>
                    <option value="DENY">DENY</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-noc-hover text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
