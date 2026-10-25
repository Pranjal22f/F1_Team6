import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  Router as RouterIcon, 
  Network, 
  Server, 
  Monitor, 
  Wifi, 
  Globe, 
  ShieldCheck, 
  Cpu 
} from 'lucide-react';
import { DeviceType, DeviceStatus } from '../../types';

interface CustomDeviceNodeData {
  id: string;
  name: string;
  type: DeviceType;
  ipAddress?: string;
  status: DeviceStatus;
  vlanId?: number;
  isSelected?: boolean;
}

export const CustomDeviceNode: React.FC<{ data: CustomDeviceNodeData }> = ({ data }) => {
  const getIcon = () => {
    switch (data.type) {
      case 'router': return RouterIcon;
      case 'core_switch': return Network;
      case 'switch': return Network;
      case 'server': return Server;
      case 'access_point': return Wifi;
      case 'isp': return Globe;
      case 'firewall': return ShieldCheck;
      default: return Monitor;
    }
  };

  const Icon = getIcon();

  const getBorderColor = () => {
    if (data.status !== 'online') return 'border-rose-500 bg-rose-950/30';
    switch (data.type) {
      case 'router': return 'border-blue-500/80 bg-blue-950/40 shadow-blue-500/10';
      case 'core_switch': return 'border-purple-500/80 bg-purple-950/40 shadow-purple-500/10';
      case 'switch': return 'border-cyan-500/60 bg-cyan-950/30 shadow-cyan-500/10';
      case 'server': return 'border-pink-500/80 bg-pink-950/40 shadow-pink-500/10';
      case 'isp': return 'border-emerald-500/80 bg-emerald-950/40 shadow-emerald-500/10';
      case 'access_point': return 'border-amber-500/80 bg-amber-950/40 shadow-amber-500/10';
      default: return 'border-slate-700 bg-noc-card';
    }
  };

  const getBadgeColor = () => {
    switch (data.type) {
      case 'router': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'server': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'isp': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div
      className={`px-3 py-2.5 rounded-xl border-2 shadow-xl min-w-[150px] transition-all cursor-pointer backdrop-blur-md ${getBorderColor()} ${
        data.isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-noc-bg scale-105' : 'hover:scale-102'
      }`}
    >
      {/* React Flow Connection Handles */}
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-cyan-400" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-cyan-400" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2 !h-2 !bg-cyan-400" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2 !h-2 !bg-cyan-400" />

      <div className="flex items-center space-x-2.5">
        <div className={`p-2 rounded-lg border ${getBadgeColor()}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="overflow-hidden">
          <div className="text-xs font-bold text-white truncate max-w-[110px]">
            {data.name}
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            {data.ipAddress || 'Layer 2'}
          </div>
        </div>
      </div>

      {/* Footer Tags */}
      <div className="mt-2 pt-1.5 border-t border-noc-border/50 flex items-center justify-between text-[9px] font-mono">
        <span className="text-noc-muted uppercase">{data.type.replace('_', ' ')}</span>
        {data.vlanId && (
          <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-semibold">
            VLAN {data.vlanId}
          </span>
        )}
        <span className={`w-1.5 h-1.5 rounded-full ${data.status === 'online' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
      </div>
    </div>
  );
};
