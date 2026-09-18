import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

if (!JWT_SECRET) {
  console.warn('[auth] JWT_SECRET manquant — définissez-le dans server/.env (chaîne aléatoire longue).');
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, household_id: user.household_id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function publicUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return rest;
}
