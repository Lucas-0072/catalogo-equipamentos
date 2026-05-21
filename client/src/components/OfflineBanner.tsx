import { useEffect, useState } from "react";
import { WifiOff, Wifi, Download, X } from "lucide-react";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showOfflineToast, setShowOfflineToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setShowOfflineToast(true);
      setTimeout(() => setShowOfflineToast(false), 4000);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Captura o evento de instalação do PWA
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Só mostra o banner se ainda não foi instalado
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Detecta se já foi instalado
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setShowInstall(false);
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setShowInstall(false);
    setDeferredPrompt(null);
  };

  const dismissInstall = () => {
    setShowInstall(false);
    localStorage.setItem("pwa-install-dismissed", "1");
  };

  return (
    <>
      {/* Banner de instalação PWA */}
      {showInstall && !installed && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl"
          style={{
            background: "oklch(0.12 0 0)",
            border: "1px solid oklch(0.85 0.18 95 / 0.50)",
            minWidth: "320px",
            maxWidth: "90vw",
          }}
        >
          <Download size={18} style={{ color: "oklch(0.85 0.18 95)", flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "oklch(0.90 0 0)" }}>
              Instalar catálogo offline
            </p>
            <p className="text-xs" style={{ color: "oklch(0.55 0 0)" }}>
              Acesse sem internet, direto do seu dispositivo
            </p>
          </div>
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-colors"
            style={{ background: "oklch(0.85 0.18 95)", color: "oklch(0.08 0 0)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.70 0.18 95)")}
            onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.85 0.18 95)")}
          >
            Instalar
          </button>
          <button
            onClick={dismissInstall}
            className="p-1 rounded-md transition-opacity hover:opacity-60 flex-shrink-0"
            style={{ color: "oklch(0.50 0 0)" }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Indicador de status de conexão — canto superior direito */}
      {isOffline && (
        <div
          className="fixed top-16 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold shadow-lg"
          style={{
            background: "oklch(0.20 0.05 30)",
            border: "1px solid oklch(0.50 0.10 30)",
            color: "oklch(0.90 0.05 30)",
          }}
        >
          <WifiOff size={13} />
          Modo offline — dados em cache
        </div>
      )}

      {/* Toast de reconexão */}
      {!isOffline && showOfflineToast && (
        <div
          className="fixed top-16 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold shadow-lg transition-opacity"
          style={{
            background: "oklch(0.18 0.06 145)",
            border: "1px solid oklch(0.50 0.12 145)",
            color: "oklch(0.88 0.06 145)",
          }}
        >
          <Wifi size={13} />
          Conexão restaurada
        </div>
      )}
    </>
  );
}
