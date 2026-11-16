const installButton = document.getElementById("install-app-btn");
const offlineBanner = document.getElementById("offline-banner");
const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone;
let installPrompt = null;

function updateConnectionStatus() {
  const language = document.documentElement.lang === "en" ? "en" : "bn";
  offlineBanner.textContent = navigator.onLine
    ? (language === "en" ? "Back online. Your records will sync when available." : "ইন্টারনেট সংযোগ ফিরে এসেছে। সংযোগ থাকলে আপনার হিসাব সিঙ্ক হবে।")
    : (language === "en" ? "You are offline. Saved app pages are available; live data needs internet." : "আপনি অফলাইনে আছেন। অ্যাপের সংরক্ষিত পৃষ্ঠা দেখা যাবে, লাইভ ডেটার জন্য ইন্টারনেট লাগবে।");
  offlineBanner.hidden = navigator.onLine;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js", { scope: "./" })
    .catch(error => console.error("Service worker registration failed:", error));
}

if (!isStandalone) installButton.hidden = false;

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  installPrompt = event;
  if (!isStandalone) installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
  if (!installPrompt) {
    const language = document.documentElement.lang === "en" ? "en" : "bn";
    const instructions = isIos
      ? (language === "en"
        ? "To install, tap Share in Safari, then choose Add to Home Screen."
        : "ইনস্টল করতে Safari-তে Share চাপুন, তারপর Add to Home Screen নির্বাচন করুন।")
      : (language === "en"
        ? "Open your browser menu and choose Install app or Add to Home Screen."
        : "ব্রাউজারের মেনু খুলে Install app অথবা Add to Home Screen নির্বাচন করুন।");
    alert(instructions);
    return;
  }

  await installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.hidden = true;
});

window.addEventListener("appinstalled", () => {
  installPrompt = null;
  installButton.hidden = true;
});

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);
updateConnectionStatus();
