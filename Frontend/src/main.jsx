import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { registerSW } from "virtual:pwa-register";

if (import.meta.env.DEV && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => registrations.forEach((registration) => registration.unregister()))
    .catch(() => {});
}

// Register service worker only in production to avoid stale-cache issues during development.
if (import.meta.env.PROD) {
  registerSW({
    onNeedRefresh() {
      console.log("PWA update available");
    },
    onOfflineReady() {
      console.log("PWA is ready to work offline");
    },
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
