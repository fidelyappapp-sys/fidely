import type Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";

type Db = ReturnType<typeof createServiceRoleClient>;

// Invoicing service boundary: Stripe Billing is the system of record today
// (sequential numbering, VAT via Stripe Tax, hosted PDF, auto-email — all
// native Stripe Billing features, configured in the Stripe Dashboard, not
// built here). This module only mirrors invoice metadata locally so the
// admin UI can search/filter fast without paginating the Stripe API.
//
// TODO(2027-09-01): French B2B e-invoicing mandate — issuing invoices to
// professional customers must go through an approved "plateforme de
// dématérialisation" (PDP, e.g. Chorus Pro-compatible) by this date for
// TPE/PME/micro-entreprise issuers. When that lands, this file's functions
// are the only place that should need to change (e.g. call the PDP's API
// instead of/alongside Stripe here) — callers (the webhook handler, the
// admin invoices page) shouldn't need to change. The `format`,
// `plateforme_agreee`, and `statut_transmission` columns on `invoices`
// are reserved for that migration and unused until then.

export async function recordInvoiceFromStripeEvent(db: Db, invoice: Stripe.Invoice): Promise<void> {
  const merchantId = await resolveMerchantId(db, invoice.customer as string | null);
  if (!merchantId) return;

  await db.from("invoices").upsert(
    {
      merchant_id: merchantId,
      stripe_invoice_id: invoice.id,
      amount_cents: invoice.amount_due,
      currency: invoice.currency,
      status: invoice.status ?? "draft",
      hosted_invoice_url: invoice.hosted_invoice_url ?? null,
      period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
      period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
    },
    { onConflict: "stripe_invoice_id" }
  );
}

async function resolveMerchantId(db: Db, stripeCustomerId: string | null): Promise<string | null> {
  if (!stripeCustomerId) return null;
  const { data } = await db
    .from("merchants")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();
  return data?.id ?? null;
}

export interface InvoiceRow {
  id: string;
  merchantId: string;
  businessName: string;
  amountCents: number;
  currency: string;
  status: string;
  hostedInvoiceUrl: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  createdAt: string;
}

export async function listInvoices(
  db: Db,
  filters: { merchantId?: string; status?: string; month?: string } = {}
): Promise<InvoiceRow[]> {
  let query = db
    .from("invoices")
    .select("id, merchant_id, amount_cents, currency, status, hosted_invoice_url, period_start, period_end, created_at, merchants(business_name)")
    .order("created_at", { ascending: false })
    .limit(300);

  if (filters.merchantId) query = query.eq("merchant_id", filters.merchantId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.month) {
    // "month" is "YYYY-MM" — filter on the invoice's creation month.
    const start = new Date(`${filters.month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    query = query.gte("created_at", start.toISOString()).lt("created_at", end.toISOString());
  }

  const { data } = await query;
  return (data ?? []).map((row) => ({
    id: row.id,
    merchantId: row.merchant_id,
    businessName: (row.merchants as unknown as { business_name: string } | null)?.business_name ?? "?",
    amountCents: row.amount_cents,
    currency: row.currency,
    status: row.status,
    hostedInvoiceUrl: row.hosted_invoice_url,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    createdAt: row.created_at,
  }));
}
