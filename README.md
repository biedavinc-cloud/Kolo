# Kolo

Application de gestion budgétaire familiale. Frontend React/Vite + backend
[Hono](https://hono.dev) sur **Cloudflare Workers**, connecté à une base
Postgres [Neon](https://neon.tech).

> Ce dépôt utilisait auparavant Base44 comme backend hébergé, puis un serveur
> Express classique. Les deux ont été retirés : le backend est maintenant un
> Worker Cloudflare (Hono + client HTTP Neon), pour tourner sur la même
> plateforme que le frontend. L'ancien export Base44 est conservé pour
> référence dans `server/legacy-base44/` mais n'est plus exécuté.

## Structure

```
src/                     Frontend React (Vite) — pages, composants, hooks
server/src/worker.js     Point d'entrée du Worker Cloudflare (CORS, sécurité, rate limiting, routes)
server/src/routes/       Routes API (logique métier, inchangée depuis la version Express)
server/src/compat.js     Fine couche de compatibilité Express Router → Hono
server/schema.sql        Schéma Postgres à appliquer sur votre base Neon
server/src/migrate.js    Script Node (hors Worker) qui applique schema.sql
server/legacy-base44/    Ancien export Base44 (référence uniquement)
```

## Développement local

### 1. Base de données (Neon)

1. Créez un projet sur [console.neon.tech](https://console.neon.tech).
2. Copiez la "pooled connection string".
3. `cd server && cp .env.example .env`, puis renseignez `DATABASE_URL` (et
   `JWT_SECRET` — générez-en un avec
   `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
4. Appliquez le schéma (ce script tourne en Node, hors Worker) :
   ```bash
   cd server
   npm install
   npm run migrate
   ```

### 2. Backend (Worker)

```bash
cd server
cp .dev.vars.example .dev.vars   # renseignez DATABASE_URL et JWT_SECRET
npm run dev    # wrangler dev — http://localhost:8787
```

### 3. Frontend

```bash
npm install
npm run dev    # http://localhost:5173, proxy /api -> localhost:8787
```

## Déploiement sur Cloudflare

### Backend → Cloudflare Workers

```bash
cd server
npx wrangler login
npx wrangler r2 bucket create kolo-uploads   # stockage des reçus/avatars uploadés

# Secrets (jamais dans wrangler.toml, qui est versionné) :
npx wrangler secret put DATABASE_URL
npx wrangler secret put JWT_SECRET
# Optionnels selon les fonctionnalités activées :
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put RESEND_API_KEY

npx wrangler deploy
```

Une fois déployé, notez l'URL du Worker (`https://kolo-api.<votre-sous-domaine>.workers.dev`,
ou votre domaine personnalisé si configuré) — c'est votre `VITE_API_URL`.

Pensez aussi à mettre à jour la variable `FRONTEND_URL` dans `server/wrangler.toml`
(section `[vars]`) avec l'URL réelle de votre déploiement Cloudflare Pages, pour
que le CORS l'autorise — sinon le frontend restera bloqué en "Failed to fetch".

### Frontend → Cloudflare Pages

- **Build command** : `npm run build`
- **Build output directory** : `dist`
- **Variable d'environnement** : `VITE_API_URL` = l'URL du Worker ci-dessus
- Le fichier `public/_redirects` (`/* /index.html 200`) est déjà en place pour que
  le routage côté client (React Router) fonctionne sur Cloudflare Pages.

### Notes d'architecture du Worker

- **Base de données** : client HTTP `@neondatabase/serverless` (`neon()`), pas de
  pool de connexions — chaque requête est un appel `fetch` indépendant vers Neon.
- **Fichiers uploadés** (reçus, avatars) : stockés dans le bucket R2 `kolo-uploads`,
  servis via `GET /uploads/:key` — un Worker n'a pas de disque persistant.
- **Rate limiting** : binding natif Cloudflare (`AUTH_RATE_LIMITER`, 20 req/min)
  sur `/api/auth/*`, plutôt qu'un compteur en mémoire (qui n'aurait aucun sens
  réparti sur des isolates Workers).
- **Stripe** : client configuré avec `httpClient: Stripe.createFetchHttpClient()`
  et vérification de webhook via `constructEventAsync` — le SDK Stripe par défaut
  utilise les modules `http`/`https` de Node, indisponibles sur Workers.
