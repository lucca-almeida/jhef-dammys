'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setIsInstalled(true);
      setInstallPrompt(null);
    }

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    if (isStandalone) {
      setIsInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
    }

    setInstallPrompt(null);
  }

  if (isInstalled) {
    return (
      <div className="mt-4 rounded-[18px] border border-white/10 bg-white/6 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8b6a5]">
          App pronto
        </p>
        <p className="mt-2 text-sm leading-6 text-[#f7ede6]">
          O sistema ja esta instalado neste aparelho.
        </p>
      </div>
    );
  }

  if (!installPrompt) {
    return (
      <div className="mt-4 rounded-[18px] border border-white/10 bg-white/6 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8b6a5]">
          Abrir como app
        </p>
        <p className="mt-2 text-sm leading-6 text-[#f7ede6]">
          No celular, voce tambem pode usar pelo menu do navegador e tocar em
          adicionar a tela inicial.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-[18px] border border-white/10 bg-white/6 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8b6a5]">
        Abrir como app
      </p>
      <p className="mt-2 text-sm leading-6 text-[#f7ede6]">
        Instale no aparelho para abrir mais rapido e com cara de aplicativo.
      </p>
      <button
        type="button"
        onClick={() => void handleInstall()}
        className="mt-4 w-full rounded-full border border-white/12 bg-[#f1e1d6] px-4 py-2 text-sm font-medium text-[#402c23] transition hover:bg-[#f5e7dd]"
      >
        Instalar aplicativo
      </button>
    </div>
  );
}
