import Link from "next/link";
import { OnboardingSteps } from "@/components/auth/OnboardingSteps";

// Its own route group rather than living under (auth): the personalisation
// step reuses CardCustomizer, whose live card preview needs a lot more room
// than the (auth) layout's max-w-sm auth-card container allows.
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center px-6 py-16">
      <Link href="/" className="mb-8 text-lg font-semibold tracking-tight">
        Fidély
      </Link>
      <div className="w-full max-w-3xl">
        <OnboardingSteps />
        {children}
      </div>
    </div>
  );
}
