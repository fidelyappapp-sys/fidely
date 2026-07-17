import Link from "next/link";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProgramForm } from "@/components/dashboard/ProgramForm";

export default async function ProgramPage() {
  const merchant = await requireMerchantContext();
  const supabase = await createServerSupabaseClient();

  const { data: program } = await supabase
    .from("loyalty_programs")
    .select("name, points_per_scan, reward_threshold, reward_description")
    .eq("merchant_id", merchant.merchantId)
    .single();

  if (!program) {
    return <p className="text-sm text-red-600">Programme introuvable.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Programme de fidélité</h1>
      <p className="mt-1 text-sm text-gray-600">
        Ces réglages s&apos;appliquent à toutes les cartes de vos clients.
      </p>
      <div className="mt-8">
        <ProgramForm program={program} />
      </div>

      <div className="mt-12">
        <Link
          href="/dashboard/qr-codes"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Gérer vos QR codes (inscription, employés, offres) →
        </Link>
      </div>
    </div>
  );
}

