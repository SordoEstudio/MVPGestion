'use client';

import { AlertTriangle } from 'lucide-react';

export type RiesgoNivel = 'alto' | 'medio' | 'bajo';

export function getRiesgoFromPercentage(percentage: number): RiesgoNivel {
  if (percentage >= 90) return 'alto';
  if (percentage >= 80) return 'medio';
  return 'bajo';
}

export interface BadgeRiesgoProps {
  percentage: number;
  className?: string;
}

const styles: Record<RiesgoNivel, { label: string; className: string }> = {
  alto: { label: 'Alto', className: 'bg-red-100 text-red-700' },
  medio: { label: 'Medio', className: 'bg-amber-100 text-amber-700' },
  bajo: { label: 'Bajo', className: 'bg-emerald-100 text-emerald-700' },
};

export function BadgeRiesgo({ percentage, className = '' }: BadgeRiesgoProps) {
  const nivel = getRiesgoFromPercentage(percentage);
  const { label, className: levelClass } = styles[nivel];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${levelClass} ${className}`}
    >
      {nivel === 'alto' && <AlertTriangle className="w-3.5 h-3.5" />}
      {label}
    </span>
  );
}
