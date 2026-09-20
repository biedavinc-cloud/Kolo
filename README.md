# Kolo

Application de gestion budgétaire familiale. Frontend React/Vite + backend
[Hono](https://hono.dev) sur **Cloudflare Pages Functions**, connecté à une base
Postgres [Neon](https://neon.tech).

**Stack :** frontend + backend déployés ensemble sur Cloudflare Pages (même origine),
base de données Neon.

> Ce dépôt utilisait auparavant Base44 comme backend hébergé, puis un serveur Express
> classique. Le backend déployé est maintenant `functions/api/` (Cloudflare Pages
> Functions). `server/` (Express) reste dans le dépôt comme référence et pour du
> développement local hors-Cloudflare si besoin, mais n'est plus ce qui est déployé.
> L'ancien export Base44 est conservé pour référence dans `server/legacy-base44/`.

## Structure

```
src/                          Frontend React (Vite) — pages, composants, hooks
functions/api/[[route]].js    Backend déployé — routeur Hono (Cloudflare Pages Functions)
functions/api/_lib/           Auth (JWT via jose), accès Neon, config des entités, abonnements
shared/plans.js               Prix (USD) et limites par plan — source unique frontend + backend
server/                       Backend Express (référence / dev local hors-Cloudflare)
server/schema.sql             Schéma Postgres à appliquer sur votre base Neon
server/legacy-base44/         Ancien export Base44 (référence uniquement)
```

## Développement local

### 1. Base de données (Neon)

1. Créez un projet sur [console.neon.tech](https://console.neon.tech).
2. Copiez la "pooled connection string".
3. `cd server && cp .env.example .env`, puis renseignez `DATABASE_URL` (et
   `JWT_SECRET` — générez-en un avec
   `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
4. Appliquez le schéma :
   ```bash
   cd server
   npm install
   npm run migrate
   ```

### 2. Backend

```bash
cd server
npm run dev    # http://localhost:8787
```

### 3. Frontend

```bash
npm install
npm run dev    # http://localhost:5173, proxy /api -> localhost:8787
```

## Déploiement sur Cloudflare

Tout tourne maintenant sur Cloudflare Pages — frontend **et** backend :

- Le frontend (React/Vite) est buildé normalement (`npm run build` → `dist/`).
- Le backend est porté en **Cloudflare Pages Functions** sous `functions/api/`
  (`[[route]].js`, routeur [Hono](https://hono.dev)) : même logique et mêmes routes que
  `server/` (Express), mais avec `jose` à la place de `jsonwebtoken` et le driver HTTP
  de `@neondatabase/serverless` à la place de `pg`/`ws` — deux libs qui ne tournent pas
  dans le runtime Workers. `server/` (Express) reste dans le dépôt comme référence et
  pour du développement local hors-Cloudflare si besoin, mais n'est plus ce qui est
  déployé.
- Comme le frontend et l'API sont servis depuis la **même origine**, `src/api/client.js`
  appelle `/api/...` en relatif par défaut : pas besoin de `VITE_API_URL` en production
  (ni de CORS, puisqu'il n'y a plus qu'une seule origine).

### Configuration Cloudflare Pages

- **Build command** : `npm run build`
- **Build output directory** : `dist`
- **Bindings** (voir `wrangler.toml`, à recréer dans Settings → Functions si vous
  déployez sans passer par `wrangler pages deploy`) :
  - R2 bucket `UPLOADS` (`kolo-uploads`) — fichiers uploadés (reçus, avatars)
  - Rate limit `AUTH_RATE_LIMITER` (20 req/min) — protège `/api/auth/*` du brute-force
- **Variables d'environnement** (Settings → Environment variables), en secret pour les
  deux premières :
  - `DATABASE_URL` — connexion Neon (pooled connection string)
  - `JWT_SECRET` — chaîne aléatoire longue (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
  - `JWT_EXPIRES_IN` (optionnel, défaut `30d`)
  - `CORE_SUPER_ADMIN_EMAILS` (optionnel, emails séparés par des virgules)
  - `ANTHROPIC_API_KEY` / `RESEND_API_KEY` / `EMAIL_FROM` (optionnels — assistant IA et
    emails d'invitation restent désactivés proprement, avec un message clair, tant que
    ces clés ne sont pas fournies)
  - Paiement — 5 PSP supportés, chacun optionnel et indépendant (voir
    `functions/api/_lib/psp/`). Un plan reste sélectionnable sans paiement configuré, mais
    aucun moyen de paiement n'apparaît tant qu'aucune des clés ci-dessous n'est renseignée :
    - **Stripe** : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
    - **Paystack** : `PAYSTACK_SECRET_KEY`, `PAYSTACK_CURRENCY` (optionnel, défaut `USD`)
    - **Flutterwave** : `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_WEBHOOK_HASH`,
      `FLUTTERWAVE_CURRENCY` (optionnel, défaut `USD`)
    - **PayUnit** : `PAYUNIT_API_KEY`, `PAYUNIT_API_USER`, `PAYUNIT_API_PASSWORD`,
      `PAYUNIT_MODE` (`test`|`live`), `PAYUNIT_CURRENCY` (optionnel, défaut `XAF`) — ⚠️
      intégration non testée contre un vrai sandbox, à vérifier en priorité
    - **Paddle** : `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_MODE` (`sandbox`|`live`)
    - Webhooks à configurer chez chaque PSP vers
      `https://<votre-domaine>/api/checkout/webhook/<stripe|paystack|flutterwave|payunit|paddle>`
    - `FRONTEND_URL` (optionnel) — origine utilisée pour les URL de retour de paiement ;
      sinon déduite de la requête entrante
- `public/_redirects` (`/* /index.html 200`) gère déjà le routage React Router côté
  client sur Cloudflare Pages.

### Abonnements : prix et accès

- Prix des 4 plans (Starter/Pro/Premium/Family) en **USD**, définis une seule fois dans
  `shared/plans.js` et réutilisés à l'identique par le frontend (affichage) et le
  backend (facturation, calcul du MRR) — aucune duplication, donc aucun risque
  de désynchronisation entre ce qui est affiché et ce qui est réellement facturé/appliqué.
- Les limites par plan (nombre de comptes bancaires, de membres du foyer, accès à
  l'assistant IA) sont **appliquées côté serveur** : dépasser la limite d'un plan, ou
  utiliser une fonctionnalité après expiration de l'essai/abonnement, renvoie une
  erreur 402 explicite — ce n'est plus seulement une restriction d'affichage
  contournable en appelant l'API directement.

### Ce qui n'est toujours pas configuré/vérifié par défaut

- **Paiement** : intégrations Stripe/Paystack/Flutterwave/Paddle écrites contre l'API
  REST documentée de chaque fournisseur, mais **non testées contre un vrai
  sandbox** (aucune clé disponible pendant le développement, et ces domaines ne sont
  pas joignables depuis l'environnement où ce code a été écrit). PayUnit en particulier
  est peu documenté publiquement — à vérifier en priorité. Tester chaque PSP en mode
  test avant d'activer ses clés en production.
- Connexion Google/Apple : nécessite des identifiants OAuth réels côté Google/Apple.
- Assistant IA, emails d'invitation : fonctionnels dès que les clés/secrets
  correspondants sont renseignés (voir ci-dessus) ; sinon, désactivés proprement avec un
  message clair plutôt qu'une erreur opaque.

