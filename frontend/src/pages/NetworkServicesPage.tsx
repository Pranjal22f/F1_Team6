import React, { useState, useEffect } from 'react';
import { Server, Globe, HardDrive, FileText, ArrowRight, CheckCircle2, Play, RefreshCw, Key } from 'lucide-react';
import { ServiceResult, NatEntry } from '../types';
import { api } from '../services/api';

export const NetworkServicesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DHCP' | 'DNS' | 'HTTP' | 'FTP' | 'NAT'>('DHCP');
  const [serviceOutput, setServiceOutput] = useState<ServiceResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Form Inputs
  const [dhcpMac, setDhcpMac] = useState('AA:BB:CC:55:01:05');
  const [dhcpVlan, setDhcpVlan] = useState(50);

  const [dnsDomain, setDnsDomain] = useState('portal.campus.edu');
  const [dnsClientIp, setDnsClientIp] = useState('10.50.0.105');

  const [httpPath, setHttpPath] = useState('/');
  const [httpClientIp, setHttpClientIp] = useState('10.50.0.105');

  const [ftpFilename, setFtpFilename] = useState('cs301_lecture_notes.pdf');

  const [natPrivateIp, setNatPrivateIp] = useState('10.50.0.105');
  const [natPrivatePort, setNatPrivatePort] = useState(52140);
  const [natTable, setNatTable] = useState<NatEntry[]>([]);

  useEffect(() => {
    if (activeTab === 'NAT') {
      loadNatTable();
    }
  }, [activeTab]);

  const loadNatTable = async () => {
    try {
      const data = await api.getNatTable();
      setNatTable(data);
    } catch (err) {
      console.error('Failed to load NAT table:', err);
    }
  };

  const handleRunService = async () => {
    setLoading(true);
    setServiceOutput(null);
    try {
      let res: ServiceResult;
      switch (activeTab) {
        case 'DHCP':
          res = await api.simulateDhcp(dhcpMac, dhcpVlan);
          break;
        case 'DNS':
          res = await api.simulateDns(dnsDomain, dnsClientIp);
          break;
        case 'HTTP':
          res = await api.simulateHttp(httpPath, httpClientIp);
          break;
        case 'FTP':
          res = await api.simulateFtp(ftpFilename, '10.10.0.50');
          break;
        case 'NAT':
          res = await api.simulateNat({
            privateIp: natPrivateIp,
            privatePort: natPrivatePort,
            destIp: '142.250.190.46',
            destPort: 443,
          });
          loadNatTable();
          break;
      }
      setServiceOutput(res);
    } catch (err: any) {
      alert(`Service simulation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center space-x-2.5">
          <Server className="w-5 h-5 text-pink-400" />
          <span>Campus Network Services & Application Layer Simulator</span>
        </h2>
        <p className="text-xs text-noc-muted mt-1">
          Simulate educational request/response dialogues for DHCP, DNS, HTTP, FTP, and NAT/PAT
        </p>
      </div>

      {/* Service Selector Tabs */}
      <div className="flex bg-noc-card border border-noc-border rounded-xl p-1 self-start space-x-1 max-w-fit">
        {(['DHCP', 'DNS', 'HTTP', 'FTP', 'NAT'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setServiceOutput(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === tab
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-noc-muted hover:text-white'
            }`}
          >
            {tab === 'DHCP' && 'DHCP (DORA)'}
            {tab === 'DNS' && 'DNS (UDP 53)'}
            {tab === 'HTTP' && 'HTTP (TCP 80)'}
            {tab === 'FTP' && 'FTP (Active/Passive)'}
            {tab === 'NAT' && 'NAT/PAT Overload'}
          </button>
        ))}
      </div>

      {/* Active Service Interaction Console */}
      <div className="bg-noc-card border border-noc-border rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-noc-border pb-3">
          <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
            <span>Protocol Console: {activeTab}</span>
          </h3>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
            Educational State Machine
          </span>
        </div>

        {/* Input Controls Based on Active Tab */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeTab === 'DHCP' && (
            <>
              <div>
                <label className="text-xs font-mono text-noc-muted block mb-1">Client Hardware MAC</label>
                <input
                  type="text"
                  value={dhcpMac}
                  onChange={(e) => setDhcpMac(e.target.value)}
                  className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-noc-muted block mb-1">Target VLAN Subnet</label>
                <select
                  value={dhcpVlan}
                  onChange={(e) => setDhcpVlan(Number(e.target.value))}
                  className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-xs font-mono text-cyan-400 focus:outline-none"
                >
                  <option value={10}>VLAN 10 (CSE - 10.10.0.0/24)</option>
                  <option value={20}>VLAN 20 (ECE - 10.20.0.0/24)</option>
                  <option value={50}>VLAN 50 (Students - 10.50.0.0/24)</option>
                  <option value={60}>VLAN 60 (Library - 10.60.0.0/24)</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'DNS' && (
            <>
              <div>
                <label className="text-xs font-mono text-noc-muted block mb-1">Fully Qualified Domain (FQDN)</label>
                <select
                  value={dnsDomain}
                  onChange={(e) => setDnsDomain(e.target.value)}
                  className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                >
                  <option value="portal.campus.edu">portal.campus.edu</option>
                  <option value="lms.campus.edu">lms.campus.edu</option>
                  <option value="mail.campus.edu">mail.campus.edu</option>
                  <option value="ftp.campus.edu">ftp.campus.edu</option>
                  <option value="google.com">google.com (External)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono text-noc-muted block mb-1">Client IP Requesting</label>
                <input
                  type="text"
                  value={dnsClientIp}
                  onChange={(e) => setDnsClientIp(e.target.value)}
                  className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                />
              </div>
            </>
          )}

          {activeTab === 'HTTP' && (
            <>
              <div>
                <label className="text-xs font-mono text-noc-muted block mb-1">Request Path</label>
                <input
                  type="text"
                  value={httpPath}
                  onChange={(e) => setHttpPath(e.target.value)}
                  className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                  placeholder="/"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-noc-muted block mb-1">Source Host</label>
                <input
                  type="text"
                  value={httpClientIp}
                  onChange={(e) => setHttpClientIp(e.target.value)}
                  className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                />
              </div>
            </>
          )}

          {activeTab === 'FTP' && (
            <div className="md:col-span-2">
              <label className="text-xs font-mono text-noc-muted block mb-1">File Resource to Retrieve</label>
              <input
                type="text"
                value={ftpFilename}
                onChange={(e) => setFtpFilename(e.target.value)}
                className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
              />
            </div>
          )}

          {activeTab === 'NAT' && (
            <>
              <div>
                <label className="text-xs font-mono text-noc-muted block mb-1">Private Client IP</label>
                <input
                  type="text"
                  value={natPrivateIp}
                  onChange={(e) => setNatPrivateIp(e.target.value)}
                  className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-noc-muted block mb-1">Ephemeral Source Port</label>
                <input
                  type="number"
                  value={natPrivatePort}
                  onChange={(e) => setNatPrivatePort(Number(e.target.value))}
                  className="w-full bg-noc-bg border border-noc-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                />
              </div>
            </>
          )}

          <div className="flex items-end">
            <button
              onClick={handleRunService}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
            >
              <Play className="w-4 h-4" />
              <span>{loading ? 'Executing Protocol...' : `Initiate ${activeTab} Request`}</span>
            </button>
          </div>
        </div>

        {/* Protocol Logs & Response Output */}
        {serviceOutput && (
          <div className="space-y-4 pt-3 border-t border-noc-border">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 font-bold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Transaction Complete (RTT: {serviceOutput.roundTripTimeMs} ms)</span>
              </span>
              <span className="text-noc-muted">Server: {serviceOutput.serverDeviceId || 'Data Center'}</span>
            </div>

            {/* Protocol Steps Handshake Log */}
            <div className="bg-noc-bg border border-noc-border rounded-xl p-4 font-mono text-xs space-y-1.5">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-2">
                Wire Protocol Handshake Exchange (RFC Dialogue)
              </span>
              {serviceOutput.protocolLogs.map((log, i) => (
                <div key={i} className="text-slate-300">
                  {log}
                </div>
              ))}
            </div>

            {/* Formatted Response Data Payload */}
            <div className="bg-noc-bg border border-noc-border rounded-xl p-4 font-mono text-xs">
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block mb-2">
                Structured Server Response Payload
              </span>
              <pre className="text-slate-200 overflow-x-auto">
                {JSON.stringify(serviceOutput.responseDetails, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Live NAT Table View (When on NAT tab) */}
      {activeTab === 'NAT' && (
        <div className="bg-noc-card border border-noc-border rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-noc-muted">
              Edge Router R1 Port Address Translation (PAT) Overload Table
            </h3>
            <button
              onClick={loadNatTable}
              className="text-xs text-cyan-400 flex items-center space-x-1 hover:underline font-mono"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Table</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-noc-bg text-noc-muted border-b border-noc-border">
                <tr>
                  <th className="p-3">Protocol</th>
                  <th className="p-3">Inside Local (Private Socket)</th>
                  <th className="p-3">Inside Global (Public PAT Socket)</th>
                  <th className="p-3">Outside Global (Destination)</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-noc-border/60">
                {natTable.length > 0 ? (
                  natTable.map((e) => (
                    <tr key={e.id} className="hover:bg-noc-bg/50">
                      <td className="p-3 text-purple-400 font-bold">{e.protocol}</td>
                      <td className="p-3 text-cyan-400">{e.privateIp}:{e.privatePort}</td>
                      <td className="p-3 text-emerald-400 font-bold">{e.publicIp}:{e.publicPort}</td>
                      <td className="p-3 text-slate-300">{e.destIp}:{e.destPort}</td>
                      <td className="p-3 text-noc-muted">{e.createdAt.slice(11, 19)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-noc-muted italic">
                      No active NAT translation entries. Trigger an outbound request above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
