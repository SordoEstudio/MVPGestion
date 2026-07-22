'use client';

import { ErrorFallback } from '@/components/ErrorFallback';

export default function ComprasError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} />;
}
