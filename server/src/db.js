import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Le driver serverless de Neon a besoin d'un implémenteur WebSocket en Node.
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.warn(
    '[db] DATABASE_URL manquant — copiez server/.env.example vers server/.env ' +
    'et renseignez la chaîne de connexion Neon (voir https://console.neon.tech).'
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (err) => {
  // Une erreur sur une connexion inactive du pool ne doit pas faire planter
  // le process — sans ce handler, EventEmitter la relance en exception fatale.
  console.error('[db pool error]', err.message);
});

export async function query(text, params) {
  const result = await pool.query(text, params);
  return result;
}
