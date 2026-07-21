# Fidély

Plateforme de cartes de fidélité digitales pour commerçants : QR codes automatiques, cartes Apple Wallet / Google Wallet, scan en caisse, facturation automatique via Stripe (0,10€/scan, minimum 30€/mois).

## Stack

- **Frontend/backend** : Next.js 16 (App Router, TypeScript, Tailwind), Route Handlers en runtime Node.
- **Base de données** : Supabase (Postgres, Auth, RLS).
- **Paiement** : Stripe Billing (metered + tiered graduated pricing).
- **Wallets** : PassKit Web Service complet (Apple) + Google Wallet REST API.

## Démarrage local

```bash
npm install
cp .env.example .env.local
```

Renseignez au minimum dans `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
QR_SIGNING_SECRET=  # une chaîne aléatoire longue
```

Appliquez le schéma sur votre projet Supabase (`supabase/migrations/*.sql`), puis :

```bash
npm run dev
```

L'app fonctionne de bout en bout (inscription commerçant, programme de fidélité, QR codes, scan, points) sans Stripe ni Apple/Google Wallet configurés — ces intégrations s'activent dès que leurs variables d'environnement sont renseignées (voir [docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md) et [docs/WALLET_SETUP.md](docs/WALLET_SETUP.md)).

## Structure

```
app/(marketing)      landing + tarifs
app/(auth)           inscription / connexion / onboarding commerçant
app/(dashboard)      tableau de bord commerçant (scanner, clients, programme, facturation, équipe)
app/(public-card)    inscription client + carte de fidélité publique
app/api              scan, join, Stripe, wallets, cron
lib/                 logique métier (Supabase, Stripe, QR, wallets)
supabase/migrations  schéma Postgres + RLS
docs/                guides de configuration Stripe / Apple / Google Wallet
```

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run stripe:setup` — crée le Meter/Product/Price Stripe (voir [docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md))
- `npm run stripe:boutique-setup` — crée les Products/Prices one-time de la boutique (voir [docs/STRIPE_LIVE_CUTOVER.md](docs/STRIPE_LIVE_CUTOVER.md))
