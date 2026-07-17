"use client";

import { useEffect, useState } from "react";
import { PhoneFrame } from "./PhoneFrame";
import { QrGlyph } from "./QrGlyph";
import { WalletCard } from "./WalletCard";

const steps = [
  {
    title: "Le commerçant crée sa carte",
    description:
      "En 2 minutes, définissez votre programme : points par visite, récompense à débloquer, couleurs de votre marque.",
  },
  {
    title: "Le client scanne son QR code",
    description:
      "En caisse, votre équipe scanne le QR code du client depuis un simple navigateur — aucun matériel à acheter.",
  },
  {
    title: "Les points sont ajoutés",
    description:
      "Le solde de points se met à jour instantanément et se synchronise en direct sur le Wallet du client.",
  },
  {
    title: "Notification reçue",
    description:
      "Le client reçoit une notification sur son téléphone avec son nouveau solde, sans rien avoir à ouvrir.",
  },
];

function StepVisual({ step }: { step: number }) {
  if (step === 0) {
    return (
      <div key={step} className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <WalletCard points={0} className="w-full scale-90 opacity-90" animated={false} />
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-500 shadow">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Création du programme…
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div key={step} className="flex h-full flex-col items-center justify-center gap-5 p-6">
        <div className="relative">
          <span className="animate-pulse-ring absolute inset-0 rounded-2xl bg-indigo-400/60" />
          <QrGlyph className="relative h-32 w-32 shadow-lg" />
        </div>
        <p className="text-xs font-medium text-gray-500">Scan en cours…</p>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div key={step} className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <WalletCard points={140} className="w-full scale-90" />
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          + 10 points ajoutés
        </div>
      </div>
    );
  }

  return (
    <div key={step} className="flex h-full flex-col justify-end gap-3 p-4 pb-10">
      <div className="animate-fade-up rounded-2xl bg-white p-3 shadow-lg ring-1 ring-black/5">
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
            F
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900">Le Café des Arts</p>
            <p className="mt-0.5 text-xs text-gray-600">
              Vous avez 140 points. Plus que 10 points pour votre récompense !
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HowItWorks() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % steps.length);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="comment-ca-marche" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold tracking-wide text-indigo-600 uppercase">
          Comment ça marche
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Du scan à la notification, en quelques secondes
        </h2>
        <p className="mt-4 text-gray-600">
          Tout le parcours — création, scan, points, notification — est automatisé de bout en
          bout par Fidély.
        </p>
      </div>

      <div className="mt-16 grid items-center gap-12 lg:grid-cols-2">
        <ol className="space-y-2">
          {steps.map((step, i) => (
            <li key={step.title}>
              <button
                type="button"
                onClick={() => setActive(i)}
                className={`w-full rounded-2xl border p-5 text-left transition-all duration-300 ${
                  active === i
                    ? "border-indigo-200 bg-indigo-50/60 shadow-sm"
                    : "border-transparent hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                      active === i
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p
                      className={`font-semibold transition-colors ${
                        active === i ? "text-gray-900" : "text-gray-700"
                      }`}
                    >
                      {step.title}
                    </p>
                    {active === i && (
                      <p className="animate-fade-up mt-1.5 text-sm text-gray-600">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ol>

        <div className="flex justify-center">
          <PhoneFrame className="animate-float-y">
            <StepVisual step={active} />
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}
