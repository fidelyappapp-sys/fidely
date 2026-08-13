"use client";

import { usePathname } from "next/navigation";

const STEPS = [
  { href: "/onboarding", label: "Infos" },
  { href: "/onboarding/personnalisation", label: "Personnalisation" },
  { href: "/onboarding/programme", label: "Programme" },
  { href: "/onboarding/notifications", label: "Notifications" },
];

export function OnboardingSteps() {
  const pathname = usePathname();
  const currentIndex = Math.max(
    0,
    STEPS.findIndex((step) => step.href === pathname)
  );

  return (
    <ol className="mb-10 flex items-center justify-center">
      {STEPS.map((step, index) => (
        <li key={step.href} className="flex items-center">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                index <= currentIndex ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
              }`}
            >
              {index + 1}
            </span>
            <span
              className={`text-sm ${index === currentIndex ? "font-medium text-gray-900" : "text-gray-400"}`}
            >
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && <span className="mx-3 h-px w-8 bg-gray-200 sm:w-16" />}
        </li>
      ))}
    </ol>
  );
}
