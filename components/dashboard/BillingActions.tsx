"use client";

import { useState, useActionState } from "react";
import {
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  type BillingMutationState,
} from "@/lib/actions/billing";

const initialState: BillingMutationState = {};

function ManageBillingButton() {
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
      <button
        type="button"
        disabled={pending}
        onClick={() => go("/api/stripe/portal")}
        className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "Redirection..." : "Gérer ma facturation"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function ActivateBillingButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
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
      <button
        type="button"
        disabled={pending}
        onClick={go}
        className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "Redirection..." : "Activer la facturation"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function ConfirmActionButton({
  action,
  label,
  pendingLabel,
  confirmText,
  className,
}: {
  action: (prev: BillingMutationState, formData: FormData) => Promise<BillingMutationState>;
  label: string;
  pendingLabel: string;
  confirmText: string;
  className: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className={className}>
        {label}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <p className="text-sm text-gray-700">{confirmText}</p>
      <div className="mt-3 flex gap-2">
        <form action={formAction}>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {pending ? pendingLabel : "Confirmer"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Annuler
        </button>
      </div>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </div>
  );
}

export function BillingActions({
  subscriptionStatus,
  pauseEndsAt,
  isOwner,
}: {
  subscriptionStatus: string;
  pauseEndsAt: string | null;
  isOwner: boolean;
}) {
  if (subscriptionStatus === "paused") {
    return (
      <div className="space-y-3">
        {pauseEndsAt && (
          <p className="text-sm text-gray-600">
            En pause jusqu&apos;au {new Date(pauseEndsAt).toLocaleDateString("fr-FR")} (reprise automatique).
          </p>
        )}
        {isOwner && (
          <ConfirmActionButton
            key="resume"
            action={resumeSubscription}
            label="Reprendre mon abonnement"
            pendingLabel="Reprise..."
            confirmText="Le prélèvement reprendra immédiatement."
            className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
          />
        )}
      </div>
    );
  }

  if (subscriptionStatus === "active") {
    return (
      <div className="flex flex-wrap gap-3">
        <ManageBillingButton />
        {isOwner && (
          <ConfirmActionButton
            key="pause"
            action={pauseSubscription}
            label="Mettre en pause"
            pendingLabel="Mise en pause..."
            confirmText="Plus de prélèvement, vos données (QR codes, clients, points, historique) sont conservées. Vos clients ne pourront plus scanner pendant la pause. Reprise possible à tout moment, ou automatique après 3 mois."
            className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          />
        )}
        {isOwner && (
          <ConfirmActionButton
            key="cancel"
            action={cancelSubscription}
            label="Arrêter mon abonnement"
            pendingLabel="Arrêt..."
            confirmText="Votre abonnement sera résilié immédiatement."
            className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          />
        )}
      </div>
    );
  }

  return <ActivateBillingButton />;
}
