import { neon } from '@neondatabase/serverless';

// Same query(text, params) interface as the Express server's db.js, so the
// ported route logic (all $1,$2… SQL strings) needed no rewriting.
export function makeQuery(env) {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
  }
  const sql = neon(env.DATABASE_URL);
  return async function query(text, params = []) {
    const rows = await sql.query(text, params);
    return { rows };
  };
}
