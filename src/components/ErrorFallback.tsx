'use client';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export function ErrorFallback({ error, reset }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Algo salió mal</h2>
        <p className="text-sm text-gray-600">
          {error.message || 'Error inesperado. Intentá de nuevo.'}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
