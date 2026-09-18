import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { attachUser } from './middleware/auth.js';
import { authRouter } from './routes/auth.routes.js';
import { householdRouter } from './routes/household.routes.js';
import { usersRouter } from './routes/users.routes.js';
import { entitiesRouter } from './routes/entities.routes.js';
import { superadminRouter } from './routes/superadmin.routes.js';
import { miscRouter, stripeWebhookHandler } from './routes/misc.routes.js';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }));

// Le webhook Stripe a besoin du corps brut pour la vérification de signature,
// donc il est déclaré AVANT express.json().
app.post('/api/checkout/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));
app.use(attachUser);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/household', householdRouter);
app.use('/api/entities-users', usersRouter);
app.use('/api/entities', entitiesRouter);
app.use('/api/superadmin', superadminRouter);
app.use('/api', miscRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur inattendue' });
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`[kolo-server] écoute sur http://localhost:${port}`);
});
