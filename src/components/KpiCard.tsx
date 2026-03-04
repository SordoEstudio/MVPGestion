'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

export type KpiCardSeverity = 'normal' | 'warning' | 'danger';

export interface KpiCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: number;
  severity?: KpiCardSeverity;
  className?: string;
}

const severityStyles: Record<KpiCardSeverity, string> = {
  normal: 'border-gray-200 bg-white',
  warning: 'border-amber-200 bg-amber-50/50',
  danger: 'border-red-200 bg-red-50/50',
};

export function KpiCard({ title, value, subtitle, trend, severity = 'normal', className = '' }: KpiCardProps) {
  const borderBg = severityStyles[severity];
  const trendUp = trend != null && trend > 0;
  const trendDown = trend != null && trend < 0;

  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${borderBg} ${className}`}>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{title}</p>
      <p className="mt-1 text-2xl font-black text-gray-900 tabular-nums">
        {typeof value === 'number' ? value.toLocaleString('es-AR') : value}
      </p>
      {(subtitle != null || trend != null) && (
        <div className="mt-1 flex items-center gap-2 text-sm">
          {subtitle != null && <span className="text-gray-600">{subtitle}</span>}
          {trend != null && (
            <span
              className={`inline-flex items-center gap-0.5 font-semibold ${
                trendUp ? 'text-emerald-600' : trendDown ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              {trendUp && <TrendingUp className="w-4 h-4" />}
              {trendDown && <TrendingDown className="w-4 h-4" />}
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
