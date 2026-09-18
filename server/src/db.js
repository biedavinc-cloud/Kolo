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

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function query(text, params) {
  const result = await pool.query(text, params);
  return result;
}
