# Bascule Stripe test → live

Ce document liste précisément ce qu'il faut faire pour passer Fidély en mode Stripe live. Aucune de ces étapes n'a été faite automatiquement — les clés live et la décision de facturer réellement des cartes appartiennent au gérant de Fidély.

## État actuel (test mode)

- `STRIPE_SECRET_KEY` en production est une clé **restreinte de test** (`rk_test_...`).
- Un webhook est actif en mode test sur `https://fidely-rouge.vercel.app/api/stripe/webhook`, avec les événements : `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.
- Stripe sépare intégralement test et live : **rien de ce qui existe en test (webhook, Produits, Prix, clients) n'existe en live.** Tout doit être recréé une fois les clés live actives.

## Étapes, dans l'ordre

### 1. Activer le compte Stripe en live
Dans le Dashboard Stripe, terminer l'activation du compte (infos légales, IBAN) si ce n'est pas déjà fait — impossible de passer en live sans ça.

### 2. Récupérer les clés live
Dashboard Stripe → Developers → API keys (en mode "Live", pas "Test") :
- `STRIPE_SECRET_KEY` (idéalement une clé **restreinte** avec uniquement les permissions nécessaires : Billing, Checkout Sessions, Customers, Webhooks, Products/Prices — pas une clé illimitée)

### 3. Recréer le webhook en live
Dashboard Stripe (mode Live) → Developers → Webhooks → Add endpoint :
- URL : `https://fidely-rouge.vercel.app/api/stripe/webhook`
- Événements à cocher (identiques au test) :
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
- Copier le **Signing secret** généré (`whsec_...`) → ce sera `STRIPE_WEBHOOK_SECRET` en live.

### 4. Recréer les Produits/Prix en live
Les Prix créés en test (`STRIPE_METERED_PRICE_ID` et les 5 `STRIPE_PRICE_*` de la boutique) n'existent pas en live. Une fois les clés live en place localement :
```bash
STRIPE_SECRET_KEY=sk_live_... npm run stripe:setup
STRIPE_SECRET_KEY=sk_live_... npm run stripe:boutique-setup
```
Chaque script imprime les nouveaux id à utiliser.

### 5. Mettre à jour les variables sur Vercel (production)
Remplacer ces 7 variables par leurs équivalents live :
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_METERED_PRICE_ID`
- `STRIPE_PRICE_DISPLAY_STAND`
- `STRIPE_PRICE_SHEET`
- `STRIPE_PRICE_QR`
- `STRIPE_PRICE_FULL_KIT`
- `STRIPE_PRICE_NEW_SHOP_KIT`

Puis redéployer (`vercel --prod`) — Vercel n'applique pas les nouvelles valeurs aux fonctions déjà déployées sans nouveau déploiement.

### 6. Vérifier le délai de 30 jours avant le premier prélèvement
Le prix métré (`scripts/stripe-setup.ts`) est configuré avec `recurring.interval: "day", interval_count: 30` — un cycle de facturation de 30 jours exacts, pas un mois calendaire. Une subscription 100% metered ne facture rien à la création, seulement à la fin de son premier cycle (documenté dans `docs/STRIPE_SETUP.md`). Concrètement : un commerçant qui active sa facturation aujourd'hui ne sera prélevé que dans 30 jours, jamais avant.

**À vérifier une fois en live** : créer un abonnement de test réel (petit montant, carte à vous), attendre ou avancer artificiellement via le Dashboard Stripe, et confirmer que la première facture arrive bien à J+30 avec le bon montant (`max(30€, 0,10€ × scans)`).

### 7. Repasser en test si besoin
Les clés test (`rk_test_...`) restent valides indéfiniment — il suffit de les remettre dans les variables d'environnement pour retester sans toucher aux vraies cartes bancaires.
