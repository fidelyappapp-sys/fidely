# Configuration Apple Wallet & Google Wallet

L'intégration est entièrement codée contre les vraies APIs Apple/Google. Tant que les variables d'environnement ci-dessous ne sont pas renseignées, les boutons "Ajouter au Wallet" restent simplement masqués dans l'interface — rien ne casse.

## Apple Wallet

1. **Compte développeur** : inscrivez-vous à l'[Apple Developer Program](https://developer.apple.com/programs/) (99$/an).
2. **Pass Type ID** : dans le portail développeur → Certificates, Identifiers & Profiles → Identifiers → créez un "Pass Type ID" (ex : `pass.com.fidely.loyalty`). Notez-le dans `APPLE_PASS_TYPE_ID`.
3. **Team ID** : visible sur la page "Membership" du compte développeur → `APPLE_TEAM_ID`.
4. **Certificat de signature** :
   - Sur le Pass Type ID créé, cliquez "Create Certificate".
   - Générez une CSR depuis Keychain Access (Trousseau d'accès → Assistant certificat → Demander un certificat à une autorité de certification).
   - Uploadez la CSR, téléchargez le certificat `.cer` généré.
   - Double-cliquez le `.cer` pour l'importer dans Keychain Access, puis exportez-le en `.p12` (clic droit → Exporter → incluez la clé privée, définissez un mot de passe).
   - Convertissez en PEM :
     ```bash
     openssl pkcs12 -in Certificates.p12 -clcerts -nokeys -out signerCert.pem -legacy
     openssl pkcs12 -in Certificates.p12 -nocerts -out signerKey.pem -legacy
     ```
   - Encodez en base64 : `base64 -i signerCert.pem` → `APPLE_SIGNER_CERT`, `base64 -i signerKey.pem` → `APPLE_SIGNER_KEY`. Le mot de passe choisi va dans `APPLE_SIGNER_KEY_PASSPHRASE`.
5. **Certificat WWDR** : téléchargez le certificat intermédiaire Apple Worldwide Developer Relations (G4) depuis la [page PKI d'Apple](https://www.apple.com/certificateauthority/), convertissez-le en PEM et encodez-le en base64 → `APPLE_WWDR_CERT`.

Une fois ces 5 variables renseignées (`APPLE_PASS_TYPE_ID`, `APPLE_TEAM_ID`, `APPLE_WWDR_CERT`, `APPLE_SIGNER_CERT`, `APPLE_SIGNER_KEY`), le bouton "Ajouter à Apple Wallet" apparaît automatiquement sur la page carte client, et les mises à jour de points déclenchent une notification native sur l'iPhone du client.

## Google Wallet

L'authentification se fait via **Workload Identity Federation** (WIF) entre l'OIDC de Vercel et Google Cloud — aucune clé de compte de service n'est jamais créée ni stockée. C'est un choix délibéré : la contrainte d'organisation `iam.disableServiceAccountKeyCreation` est active sur le projet GCP de Fidély et bloque de toute façon la création de clés JSON classiques ; WIF est aussi la méthode recommandée par Google pour les workloads externes (jetons de courte durée, rien à faire fuiter).

1. **Projet Google Cloud** : créez ou sélectionnez un projet sur [console.cloud.google.com](https://console.cloud.google.com), activez `walletobjects.googleapis.com`, `iam.googleapis.com`, `iamcredentials.googleapis.com`, `sts.googleapis.com`.
2. **Compte Google Wallet Business Console** : inscrivez-vous sur [Google Wallet Business Console](https://pay.google.com/business/console/) pour obtenir votre **Issuer ID** → `GOOGLE_WALLET_ISSUER_ID`. Le compte reste en mode Test (10 testeurs max) tant que Google n'a pas validé une demande de publication — prévoyez ce délai avant l'ouverture publique.
3. **Vercel** : dans le projet → Settings → Security → "Secure backend access with OIDC federation" → activer en mode **Team**, sauvegarder.
4. **Workload Identity Pool + provider OIDC** (Google Cloud Console → IAM & Admin → Workload Identity Federation, ou via `gcloud`) :
   - Pool `vercel`, provider OIDC `vercel`, issuer `https://oidc.vercel.com/[TEAM_SLUG]`, attribute mapping `google.subject = assertion.sub`, audience par défaut.
5. **Compte de service** (sans clé) : IAM & Admin → Comptes de service → créez-en un (ex. `fidely-wallet-issuer`) → `GCP_SERVICE_ACCOUNT_EMAIL`.
6. Accordez `roles/iam.serviceAccountTokenCreator` sur ce compte de service à :
   - chaque principal WIF `principal://iam.googleapis.com/projects/{GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/vercel/subject/owner:{TEAM}:project:{PROJECT}:environment:{production|development}` (un par environnement Vercel à autoriser),
   - et au compte de service lui-même (auto-impersonation, nécessaire pour signer le JWT du lien "Save to Wallet" via l'API IAM Credentials plutôt qu'avec une clé locale).
7. Dans le Wallet Business Console → Utilisateurs, ajoutez l'email du compte de service avec le rôle "Wallet Object Issuer".
8. En local, `vercel link` puis `vercel env pull` récupère automatiquement `VERCEL_OIDC_TOKEN` dans `.env.local` (ne pas le définir manuellement — Vercel l'injecte aussi automatiquement en prod).

Une fois `GOOGLE_WALLET_ISSUER_ID`, `GCP_PROJECT_NUMBER`, `GCP_WORKLOAD_IDENTITY_POOL_ID`, `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID` et `GCP_SERVICE_ACCOUNT_EMAIL` renseignés, le bouton "Ajouter à Google Wallet" apparaît automatiquement, et les mises à jour de points déclenchent une notification native sur Android.

## Notes

- Les deux intégrations régénèrent le pass/l'objet à la demande à partir de l'état actuel en base — rien n'est mis en cache.
- La notification affichée au client vient du mécanisme natif du Wallet (champ `changeMessage` côté Apple, `messages[]` côté Google), pas d'un système de push séparé.
