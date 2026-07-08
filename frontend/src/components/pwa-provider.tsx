'use client';

import { useEffect } from 'react';

export function PwaProvider() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register('/sw.js')
      .catch((error) => console.error('Falha ao registrar o PWA', error));
  }, []);

  return null;
}
