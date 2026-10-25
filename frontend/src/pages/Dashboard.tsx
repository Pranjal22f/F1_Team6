import React, { useEffect, useState } from 'react';
import { 
  Server, 
  Activity, 
  Wifi, 
  ShieldAlert, 
  Gauge, 
  Layers, 
  AlertTriangle, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { DashboardStats } from '../types';
import { api } from '../services/api';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mock telemetry time series for NOC chart
  const timeSeriesData = [
    { time: '11:00', throughput: 380, latency: 4.2 },
    { time: '11:05', throughput: 420, latency: 4.5 },
    { time: '11:10', throughput: 610, latency: 5.8 },
    { time: '11:15', throughput: 590, latency: 5.1 },
    { time: '11:20', throughput: 740, latency: 6.4 },
    { time: '11:25', throughput: 820, latency: 7.2 },
    { time: '11:30', throughput: 680, latency: 5.3 },
  ];

  const deptTraffic = [
    { name: 'CSE', traffic: 340, fill: '#3B82F6' },
    { name: 'ECE', traffic: 220, fill: '#8B5CF6' },
    { name: 'Students', traffic: 580, fill: '#F59E0B' },
    { name: 'Faculty', traffic: 190, fill: '#10B981' },
    { name: 'Admin', traffic: 120, fill: '#EF4444' },
    { name: 'Library', traffic: 160, fill: '#06B6D4' },
  ];

  const protocolData = [
    { name: 'HTTPS (Web)', value: 45, color: '#06B6D4' },
    { name: 'DNS Queries', value: 15, color: '#3B82F6' },
    { name: 'FTP Transfers', value: 20, color: '#8B5CF6' },
    { name: 'VoIP (SIP)', value: 12, color: '#10B981' },
    { name: 'Management', value: 8, color: '#F59E0B' },
  ];

  if (loading && !stats) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-noc-muted">
        <Activity className="w-6 h-6 animate-spin text-cyan-400 mr-3" />
        <span>Loading Campus Telemetry...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Campus Availability"
          value={`${stats?.availabilityPercentage ?? 100}%`}
          subtitle={`${stats?.activeDevices ?? 15}/${stats?.totalDevices ?? 15} Devices Active`}
          icon={Activity}
          trend="+0.2%"
          color="emerald"
        />
        <MetricCard
          title="Active Throughput"
          value={`${stats?.simulatedThroughputMbps ?? 450} Mbps`}
          subtitle="Core 10G Trunk Capacity"
          icon={Gauge}
          trend="Nominal"
          color="cyan"
        />
        <MetricCard
          title="Average Latency"
          value={`${stats?.averageDelayMs ?? 3.8} ms`}
          subtitle="Intra-campus round trip"
          icon={Wifi}
          trend="-0.4ms"
          color="blue"
        />
        <MetricCard
          title="Security Incidents"
          value={stats?.securityAlertsCount ?? 0}
          subtitle="Denied ACL packets blocked"
          icon={ShieldAlert}
          trend="Filtered"
          color="rose"
        />
      </div>

      {/* Main Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bandwidth & Latency Trend */}
        <div className="lg:col-span-2 bg-noc-card border border-noc-border rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Campus Bandwidth & Latency Telemetry</h3>
              <p className="text-xs text-noc-muted">Simulated aggregate traffic across core routers</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="flex items-center text-cyan-400">
                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full mr-1.5"></span> Throughput (Mbps)
              </span>
              <span className="flex items-center text-blue-400">
                <span className="w-2.5 h-2.5 bg-blue-400 rounded-full mr-1.5"></span> Latency (ms)
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090D16', borderColor: '#1E293B', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="throughput" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#throughputGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Protocol Mix Donut */}
        <div className="bg-noc-card border border-noc-border rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Protocol Distribution</h3>
            <p className="text-xs text-noc-muted mb-4">Layer 4/7 application traffic breakdown</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={protocolData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                  >
                    {protocolData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090D16', borderColor: '#1E293B', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-noc-border text-xs">
            {protocolData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center text-noc-muted">
                  <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-mono text-white font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row: Department Breakdown & Event Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Bandwidth Consumption */}
        <div className="lg:col-span-2 bg-noc-card border border-noc-border rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Department Bandwidth Allocation</h3>
              <p className="text-xs text-noc-muted">VLAN-segregated peak consumption (Mbps)</p>
            </div>
            <span className="text-xs font-mono text-cyan-400">Total: 1,630 Mbps</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptTraffic}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090D16', borderColor: '#1E293B', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="traffic" radius={[4, 4, 0, 0]}>
                  {deptTraffic.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Events Feed */}
        <div className="bg-noc-card border border-noc-border rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">NOC Operational Feed</h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
              Auto-sync
            </span>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-56 pr-1">
            {stats?.recentEvents?.map((evt) => (
              <div key={evt.id} className="p-2.5 rounded-lg bg-noc-bg border border-noc-border/70 text-xs">
                <div className="flex items-center justify-between text-[10px] text-noc-muted mb-1">
                  <span className="font-mono text-cyan-400 font-semibold">{evt.type}</span>
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {evt.time}
                  </span>
                </div>
                <p className="text-slate-200 leading-snug">{evt.msg}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
