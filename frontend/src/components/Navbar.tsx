import React, { useState, useEffect } from 'react';
import { RefreshCw, PlayCircle, ShieldCheck, Activity, Wifi } from 'lucide-react';
import { PageId } from './Sidebar';
import { api } from '../services/api';

interface NavbarProps {
  activePage: PageId;
  onOpenDemo: () => void;
  onRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onOpenDemo,
  onRefresh,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const pageTitles: Record<PageId, { title: string; subtitle: string }> = {
    dashboard: { title: 'Network Operations Center Overview', subtitle: 'Real-time telemetry, bandwidth utilization & security alerts' },
    topology: { title: 'Interactive Campus Network Topology', subtitle: 'Dynamic React Flow node graph, interfaces & live packet tracing' },
    vlans: { title: 'VLAN & IP Addressing Architecture', subtitle: '802.1Q segmentation, VLSM planning & subnet calculator' },
    routing: { title: 'Dynamic Routing Simulator', subtitle: 'OSPF link-state Dijkstra vs RIP distance-vector comparison' },
    'fault-tolerance': { title: 'Fault Tolerance & Recovery Lab', subtitle: 'R1-R2-R3 redundant triangle, link cut simulations & convergence timers' },
    security: { title: 'Network Security Center & Firewalls', subtitle: 'First-match Access Control Lists (ACLs) & packet inspection tester' },
    qos: { title: 'Traffic, Congestion & QoS Analyzer', subtitle: 'Strict Priority Queueing vs FIFO tail-drop performance evaluation' },
    services: { title: 'Campus Network Services Simulator', subtitle: 'DHCP DORA, DNS zone query, HTTP, FTP & NAT/PAT translation' },
    protocols: { title: 'Data Link Protocol Simulation Lab', subtitle: 'Hamming (7,4), CRC, Checksum, Go-Back-N, Selective Repeat & ALOHA' },
    reports: { title: 'Laboratory Experiment Reports & Viva', subtitle: '5 comprehensive lab writeups with aim, theory, observations & viva Q&A' },
    docs: { title: 'System Documentation & Reference', subtitle: 'Complete architectural specifications, API endpoints & viva guide' },
  };

  const current = pageTitles[activePage] || { title: 'Smart Campus Network', subtitle: 'NOC Simulator' };

  const handleResetDemo = async () => {
    if (confirm('Are you sure you want to reset the campus network topology and configurations back to default demo state?')) {
      setIsResetting(true);
      try {
        await api.resetTopology();
        onRefresh();
      } catch (err: any) {
        alert(`Reset failed: ${err.message}`);
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <header className="h-16 bg-noc-card border-b border-noc-border px-6 flex items-center justify-between shrink-0">
      {/* Page Title & Breadcrumb */}
      <div>
        <h2 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
          <span>{current.title}</span>
        </h2>
        <p className="text-[11px] text-noc-muted">
          {current.subtitle}
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Network Status Badges */}
        <div className="hidden lg:flex items-center space-x-3 bg-noc-bg border border-noc-border px-3 py-1.5 rounded-lg text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <Activity className="w-3.5 h-3.5" />
            <span>Health 100%</span>
          </div>
          <span className="text-noc-border">|</span>
          <div className="flex items-center space-x-1.5 text-cyan-400">
            <Wifi className="w-3.5 h-3.5" />
            <span>OSPF Ready</span>
          </div>
          <span className="text-noc-border">|</span>
          <div className="flex items-center space-x-1.5 text-purple-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ACL Active</span>
          </div>
        </div>

        {/* System Time */}
        <div className="text-xs font-mono text-noc-muted bg-noc-bg border border-noc-border px-2.5 py-1.5 rounded-lg">
          {timeStr || '12:00:00'}
        </div>

        {/* Guided Demo Button */}
        <button
          onClick={onOpenDemo}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all font-sans"
        >
          <PlayCircle className="w-3.5 h-3.5" />
          <span>Demo Scenarios</span>
        </button>

        {/* Reset Demo Button */}
        <button
          onClick={handleResetDemo}
          disabled={isResetting}
          title="Reset to Demo Network"
          className="p-2 rounded-lg text-noc-muted hover:text-white bg-noc-bg border border-noc-border hover:bg-noc-hover transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
