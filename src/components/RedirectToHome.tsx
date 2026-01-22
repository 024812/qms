'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function RedirectToHome() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
      <div className="flex items-center justify-center p-8">
          <p>Redirecting...</p>
      </div>
  );
}
