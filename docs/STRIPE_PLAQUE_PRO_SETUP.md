# Configuration Stripe — Plaque Pro

Le palier "Pro" de la Plaque avis Google ajoute un abonnement récurrent (6,99€/mois ou 54,99€/an) au-dessus de l'achat unique de la plaque. C'est un abonnement **séparé** de l'abonnement fidélité principal (voir [STRIPE_SETUP.md](STRIPE_SETUP.md)) — même client Stripe possible, jamais la même ligne `merchants`/le même webhook branch (voir `merchant_plaque_subscriptions`, `supabase/migrations/0030_merchant_plaque_subscriptions.sql`).

## 1. Créer le Product + les 2 Prices

```bash
STRIPE_SECRET_KEY=sk_test_... npm run stripe:plaque-pro-setup
```

Crée un **Product** "Fidély Plaque — Abonnement Pro" avec deux **Prices récurrents** (mensuel 6,99€, annuel 54,99€). Copiez les ids affichés dans :

```
STRIPE_PRICE_PLAQUE_PRO_MONTHLY=
STRIPE_PRICE_PLAQUE_PRO_ANNUAL=
```

## 2. Webhook

Aucun nouveau type d'événement à enregistrer — le webhook existant (`app/api/stripe/webhook`) écoute déjà tout ce qu'il faut :
- `checkout.session.completed` (branché sur `metadata.type === "plaque_pro_checkout"`)
- `customer.subscription.created` / `.updated` / `.deleted`
- `invoice.paid` / `invoice.payment_failed`

**Point critique à valider avant la mise en production** : ces événements génériques (`customer.subscription.*`, `invoice.*`) sont maintenant reçus à la fois pour l'abonnement fidélité principal et pour l'abonnement Plaque Pro, potentiellement pour le même client Stripe. Le webhook les distingue via `subscription.metadata.subscription_kind === "plaque_pro"` — sans quoi un événement sur l'un des deux abonnements écraserait les colonnes de l'autre (`merchants.subscription_status` vs `merchant_plaque_subscriptions.status`).

À tester en mode test avant bascule :

```bash
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
stripe trigger invoice.paid
```

sur un commerçant possédant **les deux** abonnements simultanément, en vérifiant à chaque fois qu'un seul des deux enregistrements (`merchants` ou `merchant_plaque_subscriptions`) a changé.

## 3. Comportement en cas d'impayé

Contrairement à l'abonnement fidélité principal (qui bloque le scan en caisse), un abonnement Plaque Pro impayé **ne bloque aucune plaque** : le commerçant redescend simplement en capacité Présence (3 modifications/mois, pas de multilingue) sur toutes ses plaques Présence/Pro — voir `getEffectiveHubTier` dans `lib/hub/modifications.ts`. Le retour à `active` (paiement qui reprend) rebascule instantanément en Pro, sans étape manuelle.
