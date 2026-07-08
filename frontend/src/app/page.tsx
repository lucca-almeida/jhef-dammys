'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (getStoredToken()) {
      router.replace('/dashboard');
      return;
    }

    router.replace('/login');
  }, [router]);

  return null;
}
