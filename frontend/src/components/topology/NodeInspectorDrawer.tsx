import React, { useState, useEffect } from 'react';
import { X, Network, Power, Server, Shield, Hash, Activity } from 'lucide-react';
import { Device, RouteEntry } from '../../types';
import { api } from '../../services/api';

interface NodeInspectorDrawerProps {
  device: Device | null;
  onClose: () => void;
  onUpdateDevice: (updated: Device) => void;
  onDeleteDevice: (id: string) => void;
}

export const NodeInspectorDrawer: React.FC<NodeInspectorDrawerProps> = ({
  device,
  onClose,
  onUpdateDevice,
  onDeleteDevice,
}) => {
  const [routes, setRoutes] = useState<RouteEntry[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  useEffect(() => {
    if (device && (device.type === 'router' || device.type === 'core_switch')) {
      setLoadingRoutes(true);
      api.getRoutingTables('OSPF')
        .then((tables) => {
          const match = tables.find((t) => t.routerId === device.id);
          setRoutes(match?.routes || []);
        })
        .catch(() => setRoutes([]))
        .finally(() => setLoadingRoutes(false));
    } else {
      setRoutes([]);
    }
  }, [device]);

  if (!device) return null;

  const togglePower = () => {
    const newStatus: Device['status'] = device.status === 'online' ? 'offline' : 'online';
    const updated: Device = { ...device, status: newStatus };
    onUpdateDevice(updated);
  };

  return (
    <div className="w-80 bg-noc-card border-l border-noc-border h-full flex flex-col shadow-2xl z-30 select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-noc-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Network className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white truncate max-w-[190px]">
            {device.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-noc-muted hover:text-white hover:bg-noc-hover"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Device Status Bar */}
        <div className="flex items-center justify-between p-3 bg-noc-bg border border-noc-border rounded-xl">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                device.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="font-semibold text-white capitalize">
              {device.status}
            </span>
          </div>
          <button
            onClick={togglePower}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              device.status === 'online'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{device.status === 'online' ? 'Simulate Failure' : 'Power On'}</span>
          </button>
        </div>

        {/* Specifications */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-mono uppercase tracking-wider text-noc-muted font-bold">
            Hardware Profile
          </h4>
          <div className="bg-noc-bg border border-noc-border rounded-xl p-3 space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-noc-muted">Device Type:</span>
              <span className="text-white capitalize">{device.type.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-noc-muted">Role:</span>
              <span className="text-cyan-400 text-right truncate max-w-[150px]">{device.role}</span>
            </div>
            {device.ipAddress && (
              <div className="flex justify-between">
                <span className="text-noc-muted">IP Address:</span>
                <span className="text-emerald-400">{device.ipAddress}</span>
              </div>
            )}
            {device.macAddress && (
              <div className="flex justify-between">
                <span className="text-noc-muted">MAC Address:</span>
                <span className="text-slate-300">{device.macAddress}</span>
              </div>
            )}
            {device.vlanId && (
              <div className="flex justify-between">
                <span className="text-noc-muted">Assigned VLAN:</span>
                <span className="text-purple-400 font-bold">VLAN {device.vlanId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Interfaces List */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-mono uppercase tracking-wider text-noc-muted font-bold">
            Network Interfaces ({device.interfaces?.length || 0})
          </h4>
          <div className="space-y-1.5">
            {device.interfaces?.map((iface) => (
              <div
                key={iface.id}
                className="p-2.5 bg-noc-bg border border-noc-border rounded-lg flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-white">{iface.name}</div>
                  <div className="text-[10px] font-mono text-noc-muted">
                    {iface.ipAddress || 'Switched Port'}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    iface.status === 'up'
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800'
                      : 'bg-rose-950/40 text-rose-400 border-rose-800'
                  }`}
                >
                  {iface.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Routing Table Preview (for Routers) */}
        {(device.type === 'router' || device.type === 'core_switch') && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-noc-muted font-bold">
              OSPF Forwarding Table
            </h4>
            {loadingRoutes ? (
              <p className="text-noc-muted italic">Computing Dijkstra table...</p>
            ) : routes.length > 0 ? (
              <div className="bg-noc-bg border border-noc-border rounded-lg overflow-hidden">
                <table className="w-full text-left text-[10px] font-mono">
                  <thead className="bg-noc-card border-b border-noc-border text-noc-muted">
                    <tr>
                      <th className="p-1.5">Prefix</th>
                      <th className="p-1.5">Next Hop</th>
                      <th className="p-1.5">Metric</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-noc-border/60">
                    {routes.slice(0, 6).map((r, i) => (
                      <tr key={i} className="hover:bg-noc-card/50">
                        <td className="p-1.5 text-cyan-400">{r.destination}</td>
                        <td className="p-1.5 text-slate-300">{r.nextHop}</td>
                        <td className="p-1.5 text-emerald-400">{r.metric}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-noc-muted italic">No active routes converged.</p>
            )}
          </div>
        )}

        {/* Delete Device */}
        <div className="pt-4 border-t border-noc-border">
          <button
            onClick={() => {
              if (confirm(`Delete node ${device.name} from topology?`)) {
                onDeleteDevice(device.id);
              }
            }}
            className="w-full py-2 px-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-400 hover:bg-rose-900/40 text-xs font-semibold transition-colors"
          >
            Remove Node from Canvas
          </button>
        </div>
      </div>
    </div>
  );
};
