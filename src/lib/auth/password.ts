import bcrypt from "bcryptjs";

const DEFAULT_SALT_ROUNDS = 12;

export async function hashPassword(plain: string, saltRounds: number = DEFAULT_SALT_ROUNDS) {
  return bcrypt.hash(plain, saltRounds);
}

export async function verifyPassword(plain: string, hashed: string) {
  return bcrypt.compare(plain, hashed);
}
