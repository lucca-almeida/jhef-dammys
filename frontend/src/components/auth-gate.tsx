'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  type AuthUser,
} from '@/lib/auth';

type AuthGateProps = {
  children: (auth: { user: AuthUser | null; logout: () => void }) => ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function validateSession() {
      const token = getStoredToken();

      if (!token) {
        clearAuthSession();
        if (pathname !== '/login') {
          router.replace('/login');
        }
        if (isMounted) {
          setIsCheckingAuth(false);
        }
        return;
      }

      try {
        const profile = await api<AuthUser>('/auth/me');

        if (!isMounted) {
          return;
        }

        setUser(profile);

        if (pathname === '/login') {
          router.replace('/dashboard');
        }
      } catch {
        clearAuthSession();
        if (pathname !== '/login') {
          router.replace('/login');
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    }

    void validateSession();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  function logout() {
    clearAuthSession();
    setUser(null);
    router.replace('/login');
  }

  if (isCheckingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f4ece4_0%,#efe4d9_100%)] px-4 text-foreground">
        <div className="rounded-[28px] border border-border bg-panel px-8 py-8 text-center shadow-[0_20px_50px_rgba(102,66,46,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            JhefDammys
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            Validando acesso
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Um instante, estamos conferindo a sessao.
          </p>
        </div>
      </main>
    );
  }

  return <>{children({ user, logout })}</>;
}
