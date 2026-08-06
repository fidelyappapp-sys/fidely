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

L'authentification se fait avec une **clé de compte de service JSON**, encodée en base64 et stockée dans une seule variable d'env — même convention que `APPLE_SIGNER_CERT`/`APPLE_SIGNER_KEY`. Le JWT du lien "Save to Wallet" est signé localement avec cette clé (voir `lib/wallet/google/saveLink.ts`), sans appel à l'API IAM Credentials.

(Une version antérieure utilisait Workload Identity Federation — OIDC Vercel échangé contre un jeton Google de courte durée, sans clé stockée — car l'ancien projet GCP bloquait la création de clés via `iam.disableServiceAccountKeyCreation`. Si votre projet a la même contrainte d'organisation, WIF reste l'option la plus sûre ; sinon une clé JSON classique est plus simple à opérer.)

1. **Projet Google Cloud** : créez ou sélectionnez un projet sur [console.cloud.google.com](https://console.cloud.google.com), activez `walletobjects.googleapis.com`.
2. **Compte Google Wallet Business Console** : inscrivez-vous sur [Google Wallet Business Console](https://pay.google.com/business/console/) pour obtenir votre **Issuer ID** → `GOOGLE_WALLET_ISSUER_ID`. Le compte reste en mode Test (10 testeurs max) tant que Google n'a pas validé une demande de publication — prévoyez ce délai avant l'ouverture publique.
3. **Compte de service** : IAM & Admin → Comptes de service → créez-en un (ex. `fidely-wallet-issuer`) → onglet "Clés" → "Ajouter une clé" → JSON → téléchargez le fichier.
4. Dans le Wallet Business Console → Utilisateurs, ajoutez l'email du compte de service (`client_email` dans le JSON) avec le rôle "Wallet Object Issuer".
5. Encodez le fichier en base64 et mettez-le dans `GOOGLE_WALLET_SERVICE_ACCOUNT_KEY` :
   ```bash
   base64 -i service-account.json | pbcopy
   ```

Une fois `GOOGLE_WALLET_ISSUER_ID` et `GOOGLE_WALLET_SERVICE_ACCOUNT_KEY` renseignés, le bouton "Ajouter à Google Wallet" apparaît automatiquement, et les mises à jour de points déclenchent une notification native sur Android.

**Sécurité** : contrairement à WIF, cette clé JSON est une credential longue durée — si `service-account.json` fuite, elle doit être révoquée immédiatement (IAM & Admin → Comptes de service → onglet Clés → supprimer) puis régénérée.

## Notes

- Les deux intégrations régénèrent le pass/l'objet à la demande à partir de l'état actuel en base — rien n'est mis en cache.
- La notification affichée au client vient du mécanisme natif du Wallet (champ `changeMessage` côté Apple, `messages[]` côté Google), pas d'un système de push séparé.
