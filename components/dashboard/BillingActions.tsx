"use client";

import { useState } from "react";

export function BillingActions({ hasActiveSubscription }: { hasActiveSubscription: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go(path: string) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(path, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Une erreur est survenue.");
        setPending(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Erreur réseau, réessayez.");
      setPending(false);
    }
  }

  return (
    <div>
      {hasActiveSubscription ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => go("/api/stripe/portal")}
          className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {pending ? "Redirection..." : "Gérer ma facturation"}
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => go("/api/stripe/checkout")}
          className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {pending ? "Redirection..." : "Activer la facturation"}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
