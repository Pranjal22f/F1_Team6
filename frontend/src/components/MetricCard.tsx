import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendColor?: 'emerald' | 'rose' | 'amber' | 'cyan' | 'blue';
  color?: 'cyan' | 'blue' | 'emerald' | 'amber' | 'rose' | 'purple';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendColor = 'emerald',
  color = 'cyan',
}) => {
  const colorMap = {
    cyan: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/50',
    blue: 'text-blue-400 bg-blue-950/40 border-blue-800/50',
    emerald: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50',
    amber: 'text-amber-400 bg-amber-950/40 border-amber-800/50',
    rose: 'text-rose-400 bg-rose-950/40 border-rose-800/50',
    purple: 'text-purple-400 bg-purple-950/40 border-purple-800/50',
  };

  const trendColorMap = {
    emerald: 'text-emerald-400',
    rose: 'text-rose-400',
    amber: 'text-amber-400',
    cyan: 'text-cyan-400',
    blue: 'text-blue-400',
  };

  return (
    <div className="bg-noc-card border border-noc-border rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-noc-borderLight transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-noc-muted">
          {title}
        </span>
        <div className={`p-2.5 rounded-lg border ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold tracking-tight text-white font-mono">
          {value}
        </span>
        {trend && (
          <span className={`text-xs font-medium font-mono ${trendColorMap[trendColor]}`}>
            {trend}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-noc-muted mt-1.5 flex items-center">
          {subtitle}
        </p>
      )}
    </div>
  );
};
