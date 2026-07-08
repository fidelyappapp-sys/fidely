# Configuration Stripe

Fidély facture chaque commerçant 0,10€ par scan, avec un minimum de 30€/mois, sur un seul plan tout inclus.

## 1. Créer le Meter + Product + Price

```bash
STRIPE_SECRET_KEY=sk_test_... npm run stripe:setup
```

Ce script crée :
- un **Billing Meter** (`event_name: loyalty_scan`) qui agrège les scans par client Stripe,
- un **Product** "Fidély — Abonnement",
- un **Price** métré avec paliers graduels : `[0 → 300 scans = 30€ forfait, 300+ = 0,10€/scan]`, ce qui équivaut exactement à `max(30€, 0,10€ × scans)`.

Copiez l'id du price affiché dans `STRIPE_METERED_PRICE_ID`.

## 2. Variables d'environnement

```
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_METERED_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
```

## 3. Webhook

En local :

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copiez le `whsec_...` affiché dans `STRIPE_WEBHOOK_SECRET`.

En production, créez un endpoint webhook dans le Dashboard Stripe pointant vers `https://votre-domaine/api/stripe/webhook`, écoutant au minimum :
- `checkout.session.completed`
- `customer.subscription.created` / `.updated` / `.deleted`
- `invoice.paid`
- `invoice.payment_failed`

## 4. Validation du modèle tarifaire avant mise en production

La combinaison précise "meter + tiers graduated + flat_amount minimum" n'a pas d'exemple officiel documenté par Stripe. **Avant d'activer la facturation réelle**, en mode test :

1. Souscrivez un client test au price créé ci-dessus.
2. Simulez des `meter_events` (`stripe.billing.meterEvents.create`) : d'abord moins de 300 dans la période de facturation, puis plus de 300.
3. Vérifiez que la facture générée correspond bien à `max(30€, 0,10€ × scans)`.

Si le comportement ne correspond pas (le `flat_amount` ne se combine pas comme attendu avec un price métré), utiliser le fallback à deux Prices sur le même abonnement :

- **Price A** — prix récurrent classique (`licensed`), 30€/mois, quantité fixe à 1 → garantit le minimum.
- **Price B** — prix métré, `billing_scheme: tiered` / `tiers_mode: graduated`, mais sans `flat_amount` : `[{up_to:300, unit_amount:0}, {up_to:'inf', unit_amount:10}]` → ne facture que le dépassement au-delà de 300 scans.

Le résultat facturé au client est identique (deux lignes de facture au lieu d'une), avec un mécanisme 100% documenté par Stripe. Dans ce cas, ajoutez `STRIPE_BASE_PRICE_ID` et incluez les deux prices dans les `line_items` du Checkout Session (`app/api/stripe/checkout/route.ts`).
