import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const sql = fs.readFileSync(path.resolve(__dirname, '../schema.sql'), 'utf8');
  console.log('[migrate] Application de server/schema.sql sur la base Neon...');
  await pool.query(sql);
  console.log('[migrate] Terminé.');
  await pool.end();
}

main().catch((err) => {
  console.error('[migrate] Échec :', err.message);
  process.exit(1);
});
