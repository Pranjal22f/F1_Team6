import React, { useState } from 'react';
import { X, Play, CheckCircle2, AlertTriangle, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';
import { api } from '../services/api';
import { PageId } from './Sidebar';

interface GuidedDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PageId) => void;
}

export const GuidedDemoModal: React.FC<GuidedDemoModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [activeScenario, setActiveScenario] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [scenarioOutput, setScenarioOutput] = useState<any>(null);

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 1,
      title: 'Scenario 1: Normal Campus Web Traffic (Student -> LMS)',
      description: 'Trace an HTTP GET request from Student Wi-Fi (VLAN 50) to Campus Web Server (10.70.0.12). Verifies 802.1Q tagging, routing, and ACL permit.',
      targetPage: 'topology' as PageId,
      action: async () => {
        return await api.tracePacket({
          sourceDeviceId: 'laptop-student-1',
          destDeviceId: 'srv-web',
          protocol: 'TCP',
          destPort: 80,
          packetSizeBytes: 1024,
          routingProtocol: 'OSPF',
        });
      },
    },
    {
      id: 2,
      title: 'Scenario 2: Security Policy Enforcement (Student -> Admin Denied)',
      description: 'Demonstrates first-match ACL Rule #20: Student Wi-Fi attempts to connect to Admin PC (10.30.0.25). Dropped by Edge/Core firewall.',
      targetPage: 'security' as PageId,
      action: async () => {
        return await api.inspectPacket('10.50.0.105', '10.30.0.25', 'TCP', 80);
      },
    },
    {
      id: 3,
      title: 'Scenario 3: Redundant Core Failover (R1-R2 severed -> Failover to R3)',
      description: 'Cuts primary link between Edge Router R1 and Core Router R2. OSPF recalculates shortest path via secondary router R3 within ~40ms.',
      targetPage: 'fault-tolerance' as PageId,
      action: async () => {
        return await api.simulateFault('router-r1', 'pc-cse-1', 'link-r1-r2', 'OSPF');
      },
    },
    {
      id: 4,
      title: 'Scenario 4: Congestion Bottleneck & QoS Priority Queueing',
      description: 'Simulates heavy over-subscription (135 Mbps on 100 Mbps link). Strict Priority Queueing ensures 0% loss for VoIP vs 40%+ for Bulk FTP.',
      targetPage: 'qos' as PageId,
      action: async () => {
        return await api.simulateTraffic({
          sourceDeviceId: 'pc-cse-1',
          destDeviceId: 'srv-web',
          trafficClass: 'HIGH',
          packetRatePps: 8000,
          packetSizeBytes: 1024,
          protocol: 'UDP',
          durationSeconds: 1,
          useQoS: true,
        });
      },
    },
    {
      id: 5,
      title: 'Scenario 5: Data Link Error Detection & Correction (Hamming 7,4)',
      description: 'Encodes 4-bit data "1011", injects a 1-bit channel error at position 3, computes syndrome S=011 (3), and restores original codeword.',
      targetPage: 'protocols' as PageId,
      action: async () => {
        return await api.simulateHamming('1011', 3);
      },
    },
  ];

  const handleRun = async (sc: typeof scenarios[0]) => {
    setActiveScenario(sc.id);
    setIsRunning(true);
    setScenarioOutput(null);
    try {
      const res = await sc.action();
      setScenarioOutput(res);
    } catch (err: any) {
      setScenarioOutput({ error: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-noc-card border border-noc-border rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-noc-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Play className="w-5 h-5 text-cyan-400" />
              <span>Guided Campus Demonstration Scenarios</span>
            </h3>
            <p className="text-xs text-noc-muted">
              One-click live test cases for faculty presentation & viva voce defense
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-noc-muted hover:text-white hover:bg-noc-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {scenarios.map((sc) => {
            const isSelected = activeScenario === sc.id;
            return (
              <div
                key={sc.id}
                className={`p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-950/20 shadow-md'
                    : 'border-noc-border bg-noc-bg hover:border-noc-borderLight'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {sc.title}
                    </h4>
                    <p className="text-xs text-noc-muted mt-1 leading-relaxed">
                      {sc.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4 shrink-0">
                    <button
                      onClick={() => handleRun(sc)}
                      disabled={isRunning && isSelected}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all flex items-center space-x-1"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isRunning && isSelected ? 'Running...' : 'Run Scenario'}</span>
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onNavigate(sc.targetPage);
                      }}
                      title="Open Dedicated Lab Page"
                      className="p-1.5 rounded-lg border border-noc-border text-noc-muted hover:text-cyan-400 hover:bg-noc-hover text-xs transition-all"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Scenario Output Box */}
                {isSelected && scenarioOutput && (
                  <div className="mt-4 pt-3 border-t border-noc-border/60">
                    <div className="text-[11px] font-mono text-cyan-400 mb-1 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Live Simulation Result:</span>
                    </div>
                    <pre className="p-3 bg-noc-bg/80 border border-noc-border rounded-lg text-xs font-mono text-slate-300 overflow-x-auto max-h-48">
                      {JSON.stringify(scenarioOutput, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-noc-border bg-noc-bg/50 flex items-center justify-between text-xs text-noc-muted">
          <span>Tip: Navigate to individual tabs to tweak parameters interactively</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-noc-hover text-white text-xs font-medium hover:bg-noc-border transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
