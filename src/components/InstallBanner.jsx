// src/components/InstallBanner.jsx
// "Install KukuMart" prompt.
//  • Android/desktop Chrome: captures the browser's install event and shows a button.
//  • iPhone/iPad Safari: no install event exists, so we show "Share → Add to Home Screen".
//  • Hidden when already installed, and after "Not now" for 14 days.

import { useEffect, useState } from "react";

const DISMISS_KEY = "kukumart-install-dismissed";
const DISMISS_DAYS = 14;

function recentlyDismissed() {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY));
    return !!t && Date.now() - t < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIosSafari() {
  const ua = window.navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua);
  const otherBrowser = /crios|fxios|edgios/i.test(ua);
  return ios && !otherBrowser;
}

export default function InstallBanner() {
  const [promptEvent, setPromptEvent] = useState(null); // Android / desktop Chrome
  const [showIos, setShowIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const onBeforeInstall = (e) => {
      e.preventDefault();            // stop Chrome's default mini-bar; we show our own
      setPromptEvent(e);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    let timer;
    if (isIosSafari()) {
      timer = setTimeout(() => { setShowIos(true); setVisible(true); }, 4000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* private mode */ }
  }

  async function install() {
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    setPromptEvent(null);
    setVisible(false);
    if (outcome === "dismissed") dismiss();
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install KukuMart"
      className="fixed z-40 left-4 right-4 bottom-24 sm:bottom-6 sm:right-auto sm:w-96
                 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 flex items-start gap-3"
    >
      <img src="/icon-192.png" alt="" className="w-12 h-12 rounded-xl shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 leading-tight">Install KukuMart</p>
        {showIos ? (
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Tap the <strong>Share</strong> button, then <strong>Add to Home Screen</strong> to order faster.
          </p>
        ) : (
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Get fresh chicken one tap away — add KukuMart to your home screen.
          </p>
        )}

        <div className="flex items-center gap-2 mt-3">
          {!showIos && (
            <button
              onClick={install}
              className="px-4 py-2 rounded-xl bg-[#C8290A] hover:bg-[#a82008] text-white text-xs font-bold transition-colors"
            >
              Install app
            </button>
          )}
          <button
            onClick={dismiss}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
          >
            {showIos ? "Got it" : "Not now"}
          </button>
        </div>
      </div>

      <button
        onClick={dismiss}
        aria-label="Close"
        className="text-gray-300 hover:text-gray-500 text-lg leading-none -mt-1"
      >
        ×
      </button>
    </div>
  );
}
