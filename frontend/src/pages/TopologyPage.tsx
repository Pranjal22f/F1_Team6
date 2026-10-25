import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Plus, 
  RefreshCw, 
  Layers, 
  ShieldCheck, 
  Info,
  Send
} from 'lucide-react';
import { CustomDeviceNode } from '../components/topology/CustomDeviceNode';
import { NodeInspectorDrawer } from '../components/topology/NodeInspectorDrawer';
import { Device, NetworkLink, PacketTraceResult, PacketTraceStep } from '../types';
import { api } from '../services/api';

const nodeTypes = {
  customDevice: CustomDeviceNode,
};

export const TopologyPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [links, setLinks] = useState<NetworkLink[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);

  // Packet Tracer State
  const [traceSourceId, setTraceSourceId] = useState<string>('laptop-student-1');
  const [traceDestId, setTraceDestId] = useState<string>('srv-web');
  const [traceProtocol, setTraceProtocol] = useState<string>('TCP');
  const [tracePort, setTracePort] = useState<number>(80);
  const [isTracing, setIsTracing] = useState(false);
  const [traceResult, setTraceResult] = useState<PacketTraceResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Fetch topology from backend
  const loadTopology = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getTopology();
      setDevices(data.devices);
      setLinks(data.links);
      buildReactFlowElements(data.devices, data.links);
    } catch (err) {
      console.error('Failed to load topology:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopology();
  }, [loadTopology]);

  // Convert Device & Link models into React Flow Nodes and Edges
  const buildReactFlowElements = (devs: Device[], lnks: NetworkLink[], activeHopId?: string) => {
    const flowNodes: Node[] = devs.map((dev) => ({
      id: dev.id,
      type: 'customDevice',
      position: dev.position || { x: 200, y: 200 },
      data: {
        id: dev.id,
        name: dev.name,
        type: dev.type,
        ipAddress: dev.ipAddress,
        status: dev.status,
        vlanId: dev.vlanId,
        isSelected: dev.id === activeHopId || dev.id === selectedDevice?.id,
      },
    }));

    const flowEdges: Edge[] = lnks.map((lnk) => {
      const isFailed = lnk.status === 'failed';
      const isRedundant = lnk.isRedundant;
      return {
        id: lnk.id,
        source: lnk.sourceDeviceId,
        target: lnk.targetDeviceId,
        animated: lnk.status === 'active' && !isFailed,
        style: {
          stroke: isFailed ? '#EF4444' : isRedundant ? '#A855F7' : '#06B6D4',
          strokeWidth: isRedundant ? 2 : 2.5,
          strokeDasharray: isFailed ? '5,5' : undefined,
        },
        label: isFailed ? 'LINK DOWN' : `${lnk.bandwidthMbps >= 1000 ? `${lnk.bandwidthMbps / 1000}G` : `${lnk.bandwidthMbps}M`}`,
        labelStyle: { fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' },
        labelBgStyle: { fill: '#090D16', fillOpacity: 0.8 },
      };
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    const dev = devices.find((d) => d.id === node.id);
    if (dev) {
      setSelectedDevice(dev);
      buildReactFlowElements(devices, links, dev.id);
    }
  };

  const handleUpdateDevice = async (updated: Device) => {
    try {
      await api.saveDevice(updated);
      setSelectedDevice(updated);
      loadTopology();
    } catch (err) {
      console.error('Update device failed:', err);
    }
  };

  const handleDeleteDevice = async (id: string) => {
    try {
      await api.deleteDevice(id);
      setSelectedDevice(null);
      loadTopology();
    } catch (err) {
      console.error('Delete device failed:', err);
    }
  };

  // Run Packet Trace
  const handleStartTrace = async () => {
    try {
      setIsTracing(true);
      const res = await api.tracePacket({
        sourceDeviceId: traceSourceId,
        destDeviceId: traceDestId,
        protocol: traceProtocol,
        destPort: tracePort,
      });
      setTraceResult(res);
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } catch (err: any) {
      alert(`Packet trace error: ${err.message}`);
    } finally {
      setIsTracing(false);
    }
  };

  // Playback timer for packet tracer
  useEffect(() => {
    let interval: any;
    if (isPlaying && traceResult && traceResult.steps.length > 0) {
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < traceResult.steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 1400);
    }
    return () => clearInterval(interval);
  }, [isPlaying, traceResult]);

  // Highlight active hop node on canvas
  useEffect(() => {
    if (traceResult && traceResult.steps[currentStepIndex]) {
      const activeStep = traceResult.steps[currentStepIndex];
      buildReactFlowElements(devices, links, activeStep.deviceId);
    }
  }, [currentStepIndex, traceResult]);

  return (
    <div className="flex h-[calc(100vh-4rem)] relative overflow-hidden bg-noc-bg select-none">
      {/* Main Flow Canvas */}
      <div className="flex-1 flex flex-col relative h-full">
        {/* Top Floating Control Bar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Packet Flow Tracer Box */}
          <div className="bg-noc-card/90 backdrop-blur-md border border-noc-border rounded-xl p-3 shadow-2xl flex items-center space-x-3 pointer-events-auto">
            <span className="text-xs font-mono font-bold text-cyan-400 flex items-center space-x-1">
              <Send className="w-3.5 h-3.5" />
              <span>Packet Tracer:</span>
            </span>

            {/* Source */}
            <select
              value={traceSourceId}
              onChange={(e) => setTraceSourceId(e.target.value)}
              className="bg-noc-bg border border-noc-border rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  Src: {d.name}
                </option>
              ))}
            </select>

            <span className="text-noc-muted">➔</span>

            {/* Destination */}
            <select
              value={traceDestId}
              onChange={(e) => setTraceDestId(e.target.value)}
              className="bg-noc-bg border border-noc-border rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  Dst: {d.name}
                </option>
              ))}
            </select>

            {/* Protocol */}
            <select
              value={traceProtocol}
              onChange={(e) => setTraceProtocol(e.target.value)}
              className="bg-noc-bg border border-noc-border rounded-lg px-2 py-1 text-xs font-mono text-cyan-400 focus:outline-none"
            >
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
            </select>

            {/* Port */}
            <input
              type="number"
              value={tracePort}
              onChange={(e) => setTracePort(Number(e.target.value))}
              className="w-16 bg-noc-bg border border-noc-border rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none"
              placeholder="Port"
            />

            {/* Trigger Button */}
            <button
              onClick={handleStartTrace}
              disabled={isTracing}
              className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all flex items-center space-x-1"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Trace Flow</span>
            </button>
          </div>

          {/* Canvas Legend */}
          <div className="bg-noc-card/90 backdrop-blur-md border border-noc-border rounded-xl px-4 py-2 shadow-2xl flex items-center space-x-4 text-xs font-mono pointer-events-auto">
            <span className="flex items-center space-x-1.5 text-cyan-400">
              <span className="w-2.5 h-1 bg-cyan-400 rounded"></span>
              <span>10G Core</span>
            </span>
            <span className="flex items-center space-x-1.5 text-purple-400">
              <span className="w-2.5 h-1 bg-purple-400 rounded"></span>
              <span>Backup Link</span>
            </span>
            <span className="flex items-center space-x-1.5 text-rose-400">
              <span className="w-2.5 h-1 bg-rose-400 rounded border-dashed"></span>
              <span>Severed</span>
            </span>
          </div>
        </div>

        {/* Step-by-Step Playback Overlay Bar (Bottom) */}
        {traceResult && (
          <div className="absolute bottom-6 left-6 right-6 z-20 bg-noc-card/95 backdrop-blur-lg border border-cyan-500/50 rounded-2xl p-4 shadow-2xl flex items-center justify-between">
            {/* Step Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md transition-all"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setCurrentStepIndex((p) => Math.min(traceResult.steps.length - 1, p + 1))}
                className="p-2 rounded-xl bg-noc-bg border border-noc-border text-white hover:bg-noc-hover"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setCurrentStepIndex(0);
                  setIsPlaying(false);
                }}
                className="p-2 rounded-xl bg-noc-bg border border-noc-border text-white hover:bg-noc-hover"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-cyan-400 pl-2">
                Step {currentStepIndex + 1} of {traceResult.steps.length}
              </span>
            </div>

            {/* Current Step Description */}
            {traceResult.steps[currentStepIndex] && (
              <div className="flex-1 mx-6 truncate">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white font-mono">
                    [{traceResult.steps[currentStepIndex].deviceName}]
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      traceResult.steps[currentStepIndex].status === 'delivered'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : traceResult.steps[currentStepIndex].status === 'dropped'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                    }`}
                  >
                    {traceResult.steps[currentStepIndex].actionTaken}
                  </span>
                </div>
                <p className="text-xs text-slate-300 truncate mt-0.5">
                  {traceResult.steps[currentStepIndex].decisionDetail}
                </p>
              </div>
            )}

            {/* Result Verdict Badge */}
            <div className="shrink-0 text-right">
              <span
                className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg border ${
                  traceResult.success
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                    : 'bg-rose-950/60 text-rose-400 border-rose-800'
                }`}
              >
                {traceResult.success ? 'PACKET DELIVERED' : 'PACKET DROPPED'}
              </span>
              <div className="text-[10px] font-mono text-noc-muted mt-1">
                Total Hops: {traceResult.totalHops} | Latency: {traceResult.totalLatencyMs}ms
              </div>
            </div>
          </div>
        )}

        {/* React Flow Render */}
        <div className="flex-1 w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2.0}
            className="bg-noc-bg"
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#1E293B" />
            <Controls className="!bg-noc-card !border !border-noc-border !rounded-xl !shadow-xl [&>button]:!bg-noc-card [&>button]:!border-noc-border [&>button]:!text-white [&>button:hover]:!bg-noc-hover" />
            <MiniMap
              nodeColor={(n: any) => {
                if (n.data?.status !== 'online') return '#EF4444';
                if (n.data?.type === 'router') return '#3B82F6';
                if (n.data?.type === 'server') return '#EC4899';
                return '#06B6D4';
              }}
              className="!bg-noc-card/90 !border !border-noc-border !rounded-xl !shadow-xl"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Node Inspector Drawer */}
      {selectedDevice && (
        <NodeInspectorDrawer
          device={selectedDevice}
          onClose={() => {
            setSelectedDevice(null);
            buildReactFlowElements(devices, links);
          }}
          onUpdateDevice={handleUpdateDevice}
          onDeleteDevice={handleDeleteDevice}
        />
      )}
    </div>
  );
};
