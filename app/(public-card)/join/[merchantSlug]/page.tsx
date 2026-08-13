import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { JoinForm } from "@/components/public-card/JoinForm";

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ merchantSlug: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { merchantSlug } = await params;
  const { source } = await searchParams;
  const db = createServiceRoleClient();

  const { data: merchant } = await db
    .from("merchants")
    .select("id, business_name, brand_color, onboarding_completed")
    .eq("slug", merchantSlug)
    .maybeSingle();

  if (!merchant || !merchant.onboarding_completed) notFound();

  const { data: program } = await db
    .from("loyalty_programs")
    .select("reward_threshold, reward_description")
    .eq("merchant_id", merchant.id)
    .limit(1)
    .maybeSingle();

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div
          className="mb-8 rounded-2xl p-6 text-white"
          style={{ backgroundColor: merchant.brand_color }}
        >
          <p className="text-sm opacity-80">Programme de fidélité</p>
          <h1 className="mt-1 text-2xl font-semibold">{merchant.business_name}</h1>
          {program && (
            <p className="mt-3 text-sm opacity-90">
              {program.reward_threshold} points = {program.reward_description}
            </p>
          )}
        </div>

        <JoinForm merchantSlug={merchantSlug} source={source} />
      </div>
    </div>
  );
}
