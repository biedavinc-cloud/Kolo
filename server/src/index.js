import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { attachUser } from './middleware/auth.js';
import { authRouter } from './routes/auth.routes.js';
import { householdRouter } from './routes/household.routes.js';
import { usersRouter } from './routes/users.routes.js';
import { entitiesRouter } from './routes/entities.routes.js';
import { superadminRouter } from './routes/superadmin.routes.js';
import { miscRouter, stripeWebhookHandler } from './routes/misc.routes.js';

const app = express();

// Filet de sécurité : une erreur async non interceptée ne doit jamais faire
// tomber tout le serveur (et donc toutes les requêtes en cours) — on la logue
// et le process continue de tourner.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.set('trust proxy', 1);

// CORS : si FRONTEND_URL n'est pas défini, on retombe sur des origines locales
// connues plutôt que de refléter n'importe quelle origine avec credentials:true
// (ce qui autoriserait tout site tiers à faire des requêtes authentifiées).
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:4173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Origine non autorisée par CORS'));
    },
    credentials: true,
  })
);

// Le webhook Stripe a besoin du corps brut pour la vérification de signature,
// donc il est déclaré AVANT express.json().
app.post('/api/checkout/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));
app.use(attachUser);

// Limite le brute-force / la creation de comptes en masse sur les routes d'auth.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives, réessayez plus tard.' },
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/household', householdRouter);
app.use('/api/entities-users', usersRouter);
app.use('/api/entities', entitiesRouter);
app.use('/api/superadmin', superadminRouter);
app.use('/api', miscRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.message === 'Origine non autorisée par CORS') {
    return res.status(403).json({ error: err.message });
  }
  res.status(500).json({ error: 'Erreur serveur inattendue' });
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`[kolo-server] écoute sur http://localhost:${port}`);
});
