import React from 'react';
import {
  LayoutDashboard,
  Network,
  Layers,
  GitFork,
  ShieldAlert,
  ShieldCheck,
  Gauge,
  Server,
  Binary,
  FileText,
  HelpCircle,
  PlayCircle,
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'topology'
  | 'vlans'
  | 'routing'
  | 'fault-tolerance'
  | 'security'
  | 'qos'
  | 'services'
  | 'protocols'
  | 'reports'
  | 'docs';

interface SidebarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  onOpenDemo: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  onOpenDemo,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 'Live' },
    { id: 'topology', label: 'Network Topology', icon: Network, badge: 'Interactive' },
    { id: 'vlans', label: 'IP & VLAN Manager', icon: Layers },
    { id: 'routing', label: 'Routing Simulator', icon: GitFork, badge: 'OSPF/RIP' },
    { id: 'fault-tolerance', label: 'Fault Tolerance Lab', icon: ShieldAlert, badge: 'Failover' },
    { id: 'security', label: 'Security Center', icon: ShieldCheck, badge: 'ACL' },
    { id: 'qos', label: 'Traffic & QoS Analyzer', icon: Gauge },
    { id: 'services', label: 'Network Services', icon: Server, badge: 'DHCP/DNS' },
    { id: 'protocols', label: 'Protocol Lab', icon: Binary, badge: '9 Syllabus' },
    { id: 'reports', label: 'Experiment Reports', icon: FileText, badge: 'Lab Viva' },
    { id: 'docs', label: 'Docs & Settings', icon: HelpCircle },
  ];

  return (
    <aside className="w-64 bg-noc-card border-r border-noc-border flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 border-b border-noc-border px-5 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Network className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
            SMART CAMPUS
          </h1>
          <p className="text-[10px] font-mono tracking-widest uppercase text-cyan-400">
            NOC Simulator 2.0
          </p>
        </div>
      </div>

      {/* Quick Launch Demo Banner */}
      <div className="p-3">
        <button
          onClick={onOpenDemo}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 border border-cyan-500/40 rounded-lg text-cyan-300 font-medium text-xs transition-all shadow-sm group"
        >
          <PlayCircle className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span>Launch Guided Demos</span>
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1 py-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id as PageId)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-noc-muted hover:text-white hover:bg-noc-hover'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-cyan-400' : 'text-noc-muted'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-noc-hover text-noc-muted'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-noc-border text-center">
        <div className="flex items-center justify-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-mono text-emerald-400 font-medium">
            Core Engine Online
          </span>
        </div>
        <p className="text-[10px] text-noc-muted mt-1">
          B.Tech Networks Project & Viva
        </p>
      </div>
    </aside>
  );
};
