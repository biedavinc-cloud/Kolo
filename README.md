# Kolo

Application de gestion budgétaire familiale. Frontend React/Vite + backend Express
connecté à une base Postgres [Neon](https://neon.tech).

> Ce dépôt utilisait auparavant Base44 comme backend hébergé. Cette dépendance a été
> retirée : toute la logique métier vit maintenant dans `server/` (Express + Neon).
> L'ancien export Base44 (schémas d'entités, fonctions serverless) est conservé pour
> référence dans `server/legacy-base44/` mais n'est plus exécuté.

## Structure

```
src/            Frontend React (Vite) — pages, composants, hooks
server/         Backend Express — routes API, auth JWT, accès Neon
server/schema.sql   Schéma Postgres à appliquer sur votre base Neon
server/legacy-base44/   Ancien export Base44 (référence uniquement)
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

⚠️ **Important : seul le frontend peut être déployé tel quel sur Cloudflare Pages.**
Le backend (`server/`) est un serveur Express classique (`app.listen`, WebSocket pour
Neon, webhook Stripe brut, JWT) : ce n'est **pas** compatible avec le runtime Workers
de Cloudflare Pages Functions sans réécriture significative. Pour l'instant, hébergez
`server/` sur une plateforme Node.js classique (Railway, Render, Fly.io, un VPS...),
et pointez le frontend dessus.

### Frontend → Cloudflare Pages

- **Build command** : `npm run build`
- **Build output directory** : `dist`
- **Variable d'environnement** : `VITE_API_URL` = l'URL publique de votre backend
  (ex. `https://api.kolo.example.com`)
- Le fichier `public/_redirects` (`/* /index.html 200`) est déjà en place pour que
  le routage côté client (React Router) fonctionne sur Cloudflare Pages.

### Backend → hébergeur Node

- Déployez le contenu de `server/` avec les variables de `server/.env.example`
  renseignées (dont `DATABASE_URL` Neon, `JWT_SECRET`, `FRONTEND_URL` pointant vers
  votre domaine Cloudflare Pages pour CORS).
- `npm run migrate` une fois pour appliquer `schema.sql` sur la base Neon de
  production.

Si vous voulez plus tard porter `server/` sur Cloudflare Workers directement
(le driver `@neondatabase/serverless` est compatible Workers), il faudra remplacer
Express par un routeur compatible Workers (Hono, itty-router...) — dites-le moi si
vous voulez que je m'en occupe.
