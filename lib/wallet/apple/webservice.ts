import { createServiceRoleClient } from "@/lib/supabase/server";

// Shared helper for the PassKit Web Service endpoints: validates the
// "Authorization: ApplePass <token>" header the device sends against the
// per-card auth token minted at card creation (loyalty_cards.pass_auth_token).
export async function verifyPassKitAuth(
  passTypeIdentifier: string,
  serialNumber: string,
  authorizationHeader: string | null
): Promise<boolean> {
  if (passTypeIdentifier !== process.env.APPLE_PASS_TYPE_ID) return false;
  if (!authorizationHeader?.startsWith("ApplePass ")) return false;

  const token = authorizationHeader.slice("ApplePass ".length).trim();
  if (!token) return false;

  const db = createServiceRoleClient();
  const { data: card } = await db
    .from("loyalty_cards")
    .select("pass_auth_token")
    .eq("pass_serial_number", serialNumber)
    .maybeSingle();

  return Boolean(card && card.pass_auth_token === token);
}
