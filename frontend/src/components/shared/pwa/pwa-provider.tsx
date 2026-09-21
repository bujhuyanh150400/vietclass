"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallPromptResult = "accepted" | "dismissed" | "unavailable";

export type PwaInstallState = {
  isInstalled: boolean;
  hasNativePrompt: boolean;
  requestInstall: () => Promise<InstallPromptResult>;
};

const PwaInstallContext = createContext<PwaInstallState | null>(null);

/**
 * Registers the public offline shell after hydration without touching API or
 * application data requests.
 */
function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker.register("/sw.js").catch(() => undefined);
}

/**
 * Reports whether the browser is currently displaying the app as an installed
 * standalone window, including Safari's iOS standalone signal.
 */
function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Provides Service Worker registration and browser-controlled install prompt
 * state to the shell without persisting identity or application data.
 */
export function PwaProvider({ children }: { children: ReactNode }) {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasNativePrompt, setHasNativePrompt] = useState(false);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");

    /** Updates the install state when browser display mode changes. */
    function updateStandaloneState(): void {
      setIsInstalled(isStandaloneDisplay());
    }

    /** Stores the browser's deferred prompt until a user selects the CTA. */
    function handleBeforeInstallPrompt(event: Event): void {
      const promptEvent = event as BeforeInstallPromptEvent;

      event.preventDefault();
      deferredPrompt.current = promptEvent;
      setHasNativePrompt(true);
    }

    /** Removes the install CTA after the browser confirms an installation. */
    function handleAppInstalled(): void {
      deferredPrompt.current = null;
      setHasNativePrompt(false);
      setIsInstalled(true);
    }

    updateStandaloneState();
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    standaloneQuery.addEventListener("change", updateStandaloneState);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      standaloneQuery.removeEventListener("change", updateStandaloneState);
    };
  }, []);

  const requestInstall = useCallback(
    /** Requests the deferred native prompt once from the account-menu click. */
    async (): Promise<InstallPromptResult> => {
      const promptEvent = deferredPrompt.current;

      if (promptEvent === null) {
        return "unavailable";
      }

      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;

        return outcome;
      } catch {
        return "dismissed";
      } finally {
        deferredPrompt.current = null;
        setHasNativePrompt(false);
      }
    },
    [],
  );

  const value: PwaInstallState = {
    isInstalled,
    hasNativePrompt,
    requestInstall,
  };

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

/** Reads the current browser install affordance from the nearest PWA provider. */
export function usePwaInstall(): PwaInstallState {
  const context = useContext(PwaInstallContext);

  if (context === null) {
    throw new Error("usePwaInstall phải được dùng bên trong <PwaProvider>.");
  }

  return context;
}
