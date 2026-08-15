import { NextResponse } from "next/server";
import { requireMerchantContext } from "@/lib/merchant";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { appBaseUrl, isStripeConfigured } from "@/lib/env";
import { componentsOrderSchema } from "@/lib/validation/schemas";
import { PLAQUE_COMPONENTS, PLAQUE_FULL_KIT, findPlaqueComponent } from "@/lib/boutique";
import { getOrCreateStripeCustomerId } from "@/lib/stripe/customer";
import type { ShopOrderItem } from "@/lib/supabase/types";

export const runtime = "nodejs";

// Components/pack for the Plaque avis Google (see lib/boutique.ts,
// components/dashboard/PlaqueComponentsOrderForm.tsx). Unlike the plaque's
// own tiered checkout (nfc-checkout/route.ts), prices here are flat per
// component — the only real complexity is that "qr"/"nfc_chip"/"full_kit"
// each require one point-of-sale id per unit, which must belong to this
// merchant and get resolved into a label snapshot (posAssignments) so
// fulfillment (see app/admin/(protected)/orders) knows where each physical
// QR/chip is headed without depending on the point of sale still existing
// unchanged later.
export async function POST(request: Request) {
  if (!isStripeConfigured) {
    return NextResponse.json({ error: "La facturation n'est pas encore configurée." }, { status: 503 });
  }

  const merchant = await requireMerchantContext();
  if (merchant.role !== "owner") {
    return NextResponse.json({ error: "Réservé au propriétaire du commerce." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = componentsOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  }

  const { displayStandQty, sheetQty, qrQty, qrPosIds, nfcChipQty, nfcChipPosIds, fullKitQty, fullKitPosIds } =
    parsed.data;

  const allPosIds = [...new Set([...qrPosIds, ...nfcChipPosIds, ...fullKitPosIds])];

  const supabase = await createServerSupabaseClient();

  let posLabelById = new Map<string, string>();
  if (allPosIds.length > 0) {
    const { data: pointsOfSale } = await supabase
      .from("merchant_qr_codes")
      .select("id, label")
      .eq("merchant_id", merchant.merchantId)
      .in("id", allPosIds);

    posLabelById = new Map((pointsOfSale ?? []).map((p) => [p.id, p.label]));
    if (posLabelById.size !== allPosIds.length) {
      return NextResponse.json({ error: "Point de vente invalide." }, { status: 400 });
    }
  }

  function assignments(posIds: string[]): ShopOrderItem["posAssignments"] {
    return posIds.map((posId) => ({ posId, posLabel: posLabelById.get(posId)! }));
  }

  const orderItems: ShopOrderItem[] = [];
  let amountCents = 0;

  const displayStand = findPlaqueComponent("display_stand")!;
  if (displayStandQty > 0) {
    orderItems.push({
      key: displayStand.key,
      label: displayStand.label,
      quantity: displayStandQty,
      unitAmountCents: displayStand.amountCents,
    });
    amountCents += displayStand.amountCents * displayStandQty;
  }

  const sheet = findPlaqueComponent("sheet")!;
  if (sheetQty > 0) {
    orderItems.push({ key: sheet.key, label: sheet.label, quantity: sheetQty, unitAmountCents: sheet.amountCents });
    amountCents += sheet.amountCents * sheetQty;
  }

  const qr = findPlaqueComponent("qr")!;
  if (qrQty > 0) {
    orderItems.push({
      key: qr.key,
      label: qr.label,
      quantity: qrQty,
      unitAmountCents: qr.amountCents,
      posAssignments: assignments(qrPosIds),
    });
    amountCents += qr.amountCents * qrQty;
  }

  const nfcChip = findPlaqueComponent("nfc_chip")!;
  if (nfcChipQty > 0) {
    orderItems.push({
      key: nfcChip.key,
      label: nfcChip.label,
      quantity: nfcChipQty,
      unitAmountCents: nfcChip.amountCents,
      posAssignments: assignments(nfcChipPosIds),
    });
    amountCents += nfcChip.amountCents * nfcChipQty;
  }

  if (fullKitQty > 0) {
    orderItems.push({
      key: PLAQUE_FULL_KIT.key,
      label: PLAQUE_FULL_KIT.label,
      quantity: fullKitQty,
      unitAmountCents: PLAQUE_FULL_KIT.amountCents,
      posAssignments: assignments(fullKitPosIds),
    });
    amountCents += PLAQUE_FULL_KIT.amountCents * fullKitQty;
  }

  const { data: order, error: orderError } = await supabase
    .from("shop_orders")
    .insert({
      merchant_id: merchant.merchantId,
      items: orderItems,
      amount_cents: amountCents,
      delivery_method: "hand_delivery",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? "Impossible de créer la commande." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const customerId = await getOrCreateStripeCustomerId({
    merchantId: merchant.merchantId,
    businessName: merchant.businessName,
    email: user?.email ?? null,
  });

  const lineItems = orderItems.map((item) => ({
    price_data: {
      currency: "eur",
      unit_amount: item.unitAmountCents,
      product_data: { name: item.label },
    },
    quantity: item.quantity,
  }));

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: lineItems,
    metadata: { type: "boutique_order", order_id: order.id, merchant_id: merchant.merchantId },
    success_url: `${appBaseUrl()}/boutique?checkout=success`,
    cancel_url: `${appBaseUrl()}/boutique?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
