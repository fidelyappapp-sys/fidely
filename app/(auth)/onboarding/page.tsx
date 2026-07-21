import { redirect } from "next/navigation";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/auth/OnboardingForm";

export default async function OnboardingPage() {
  const authed = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authed.auth.getUser();

  if (!user) redirect("/login");

  const db = createServiceRoleClient();
  const { data: staffRows } = await db
    .from("merchant_staff")
    .select("merchant_id")
    .eq("auth_user_id", user.id)
    .limit(1);

  if (staffRows && staffRows.length > 0) redirect("/dashboard");

  return (
    <div>
      <h1 className="text-xl font-semibold">Configurez votre programme de fidélité</h1>
      <p className="mt-1 mb-6 text-sm text-gray-600">
        Ces informations pourront être modifiées plus tard dans votre tableau de bord.
      </p>
      <OnboardingForm />
    </div>
  );
}
