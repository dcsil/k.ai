#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "..", ".env");

if (fs.existsSync(envPath)) {
  console.log(`.env already exists at ${envPath}`);
  process.exit(0);
}

const args = process.argv.slice(2);
const isCI = args.includes("--ci") || process.env.CI === "true";

const askQuestion = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
};

const main = async () => {
  let ayrshareApiKey = "";
  let googleApiKey = "";

  if (!isCI) {
    console.log("Please enter the following API keys (leave empty to skip):");
    ayrshareApiKey = await askQuestion("AYRSHARE_API_KEY: ");
    googleApiKey = await askQuestion("GOOGLE_API_KEY: ");
  } else {
    console.log("CI mode detected or --ci flag passed. Skipping interactive prompts.");
  }

  const secret = crypto.randomBytes(32).toString("hex");

  const envContents = [
    "# k.ai development environment",
    "DATABASE_URL=\"file:./dev.db\"",
    `AYRSHARE_API_KEY="${ayrshareApiKey}"`,
    `GOOGLE_API_KEY="${googleApiKey}"`,
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
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
