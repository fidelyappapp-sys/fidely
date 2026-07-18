"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "checking" | "subscribed" | "denied" | "unsupported" | "loading";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushOptIn({ publicId, vapidPublicKey }: { publicId: string; vapidPublicKey: string }) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;

    async function detect() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        if (!cancelled) setStatus(subscription ? "subscribed" : "idle");
      } catch {
        if (!cancelled) setStatus("idle");
      }
    }

    void detect();
    return () => {
      cancelled = true;
    };
  }, []);

  async function subscribe() {
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId, subscription: subscription.toJSON() }),
      });

      setStatus(res.ok ? "subscribed" : "denied");
    } catch {
      setStatus("denied");
    }
  }

  if (status === "unsupported" || status === "checking") return null;

  if (status === "subscribed") {
    return <p className="mt-3 text-center text-xs text-gray-500">🔔 Notifications activées</p>;
  }

  return (
    <button
      type="button"
      onClick={subscribe}
      disabled={status === "loading"}
      className="mt-3 w-full rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
    >
      {status === "loading"
        ? "Activation..."
        : status === "denied"
          ? "Notifications bloquées par le navigateur"
          : "🔔 Activer les notifications"}
    </button>
  );
}
