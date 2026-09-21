import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

function secretKey(env) {
  if (!env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return new TextEncoder().encode(env.JWT_SECRET);
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function signToken(env, user, opts = {}) {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    household_id: user.household_id,
    is_super_admin: user.is_super_admin,
    is_founder: user.is_founder,
    purpose: opts.purpose,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(opts.expiresIn || env.JWT_EXPIRES_IN || '30d')
    .sign(secretKey(env));
}

export async function verifyToken(env, token) {
  const { payload } = await jwtVerify(token, secretKey(env));
  return payload;
}

export function publicUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return rest;
}
