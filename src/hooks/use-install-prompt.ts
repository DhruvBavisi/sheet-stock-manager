import { useEffect, useState } from "react";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent;
      if (!promptEvent || typeof promptEvent.prompt !== "function") return;

      // Let the browser handle the default install flow unless we intentionally show a custom prompt.
      setDeferred(promptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferred || typeof deferred.prompt !== "function") return false;

    try {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      return true;
    } catch {
      setDeferred(null);
      return false;
    }
  };

  return { canInstall: !!deferred, installed, promptInstall };
}
