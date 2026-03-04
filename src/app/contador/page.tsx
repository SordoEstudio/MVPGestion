'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContadorRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/accountant');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-600">Redirigiendo...</p>
    </div>
  );
}
