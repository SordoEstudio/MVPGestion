'use client';

export interface BarraProgresoTopeProps {
  percentage: number;
  className?: string;
  showLabel?: boolean;
}

export function BarraProgresoTope({ percentage, className = '', showLabel = true }: BarraProgresoTopeProps) {
  const pct = Math.min(100, Math.max(0, percentage));
  const color =
    pct >= 85
      ? 'bg-red-500'
      : pct >= 70
        ? 'bg-amber-500'
        : 'bg-emerald-500';

  return (
    <div className={className}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-0.5 text-xs font-bold text-gray-600 tabular-nums">{pct.toFixed(1)}%</p>
      )}
    </div>
  );
}
