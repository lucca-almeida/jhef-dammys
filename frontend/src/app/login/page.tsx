'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getStoredToken, saveAuthSession, type AuthUser } from '@/lib/auth';

type LoginResponse = {
  token: string;
  user: AuthUser;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (getStoredToken()) {
      router.replace('/dashboard');
    }

    const installed =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    setIsStandalone(installed);
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      const session = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      });

      saveAuthSession(session);
      router.replace('/dashboard');
    } catch {
      setError('Email ou senha invalidos.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f7efe7_0%,#efe4d9_48%,#eadccf_100%)] px-4 py-[calc(20px+env(safe-area-inset-top))] pb-[calc(20px+env(safe-area-inset-bottom))] text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] max-w-5xl items-center justify-center">
        <div className="grid w-full max-w-4xl gap-6 rounded-[32px] border border-border bg-panel p-6 shadow-[0_24px_80px_rgba(78,52,37,0.12)] lg:grid-cols-[1fr_0.9fr] lg:p-8">
          <section className="rounded-[28px] bg-[#2f241f] p-6 text-[#f7ede6]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d8b6a5]">
              JhefDammys
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">
              Painel interno do negocio
            </h1>
            <p className="mt-4 text-sm leading-7 text-[#d7c5bb]">
              Entre com seu acesso para acompanhar agenda, orcamentos, custos,
              financeiro e tudo que importa no dia a dia.
            </p>

            <div className="mt-8 space-y-3">
              {[ 
                'Visual rapido da agenda e dos eventos ativos.',
                'Orcamentos mais praticos e com custo estimado.',
                'Financeiro e custos protegidos so para quem administra.',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-3 text-sm leading-6 text-[#f7ede6]"
                >
                  {item}
                </div>
              ))}
            </div>

            {!isStandalone ? (
              <div className="mt-5 rounded-[20px] border border-white/10 bg-[#4a362e] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f1c7b2]">
                  Dica para celular
                </p>
                <p className="mt-2 text-sm leading-6 text-[#f7ede6]">
                  Se quiser deixar mais pratico para ele usar no dia a dia,
                  depois da primeira abertura voce pode adicionar este sistema na
                  tela inicial do aparelho.
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-[20px] border border-white/10 bg-[#4a362e] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f1c7b2]">
                  Modo app ativo
                </p>
                <p className="mt-2 text-sm leading-6 text-[#f7ede6]">
                  Este acesso ja esta abrindo com cara de aplicativo.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-border bg-white px-5 py-6 lg:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Acesso seguro
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Entrar no sistema
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Use o e-mail e a senha configurados para o administrador.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block rounded-[22px] border border-border bg-panel px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Email
                </p>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                />
              </label>

              <label className="block rounded-[22px] border border-border bg-panel px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Senha
                </p>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full border-0 bg-transparent text-sm text-foreground outline-none"
                />
              </label>

              {error ? (
                <div className="rounded-[20px] border border-[#e4b7a0] bg-[#fff1e8] px-4 py-3 text-sm text-[#8a4c30]">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-[22px] border border-accent bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </button>

              <p className="text-center text-xs leading-5 text-muted">
                Este acesso e interno e foi pensado para uso do proprio negocio.
              </p>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
