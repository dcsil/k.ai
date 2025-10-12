#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const envPath = path.resolve(__dirname, "..", ".env");

if (fs.existsSync(envPath)) {
  console.log(`.env already exists at ${envPath}`);
  process.exit(0);
}

const secret = crypto.randomBytes(32).toString("hex");

const envContents = [
  "# k.ai development environment",
  "DATABASE_URL=\"file:./dev.db\"",
  "AYRSHARE_API_KEY=\"\"",
  `JWT_ACCESS_SECRET="${secret}"`,
  "JWT_ACCESS_TTL=900",
  "JWT_REFRESH_TTL=2592000",
  "PASSWORD_RESET_TTL=3600",
  "EMAIL_VERIFICATION_TTL=86400",
  "AUTH_MAX_LOGIN_ATTEMPTS=5",
  "AUTH_LOCKOUT_DURATION=900",
  "REFRESH_COOKIE_SAME_SITE=lax",
  "",
].join("\n");

fs.writeFileSync(envPath, envContents, { encoding: "utf8", flag: "wx" });
console.log(`Created .env at ${envPath}`);
