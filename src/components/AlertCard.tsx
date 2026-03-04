'use client';

import Link from 'next/link';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type AlertSeverity = 'info' | 'warning' | 'danger';

export interface AlertCardProps {
  message: string;
  severity?: AlertSeverity;
  href?: string;
  linkLabel?: string;
  className?: string;
}

const severityConfig: Record<AlertSeverity, { icon: React.ReactNode; className: string }> = {
  info: {
    icon: <Info className="w-5 h-5 shrink-0" />,
    className: 'border-blue-200 bg-blue-50/80 text-blue-900',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
    className: 'border-amber-200 bg-amber-50/80 text-amber-900',
  },
  danger: {
    icon: <AlertCircle className="w-5 h-5 shrink-0" />,
    className: 'border-red-200 bg-red-50/80 text-red-900',
  },
};

export function AlertCard({
  message,
  severity = 'warning',
  href,
  linkLabel = 'Ver',
  className = '',
}: AlertCardProps) {
  const { icon, className: severityClass } = severityConfig[severity];

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 ${severityClass} ${className}`}
    >
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{message}</p>
        {href != null && (
          <Link
            href={href}
            className="mt-2 inline-block text-sm font-bold underline hover:no-underline"
          >
            {linkLabel} →
          </Link>
        )}
      </div>
    </div>
  );
}
