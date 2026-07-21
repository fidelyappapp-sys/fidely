"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACTIVE_MERCHANT_COOKIE } from "@/lib/merchant";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function switchActiveMerchant(formData: FormData) {
  const merchantId = String(formData.get("merchantId") ?? "");
  if (!merchantId) return;

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_MERCHANT_COOKIE, merchantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });

  redirect("/dashboard");
}
