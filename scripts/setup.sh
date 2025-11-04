#!/usr/bin/env bash

# -e (errexit): exit immediately if any simple command returns a non-zero status.
# -u (nounset): treat unset variables as an error and exit.
# -o pipefail: make a pipeline return a non-zero exit status if any command in the pipeline fails (not just the last one).
set -euo pipefail

# Ensure we're in the repo root
cd "$(dirname "$0")/.."

echo "[setup] Using Node: $(node -v)"
echo "[setup] Using npm:  $(npm -v)"

# Install dependencies
if [ -f package-lock.json ]; then
  echo "[setup] Installing dependencies with npm ci"
  npm ci
else
  echo "[setup] Installing dependencies with npm install"
  npm install
fi

# Generate environment for CI
if [ -f scripts/generate-env.js ]; then
  echo "[setup] Generating environment via scripts/generate-env.js"
  node scripts/generate-env.js
else
  echo "[setup] WARNING: scripts/generate-env.js not found; skipping env generation" >&2
fi

# Run Prisma migrations for CI (creates/updates local dev DB)
echo "[setup] Running Prisma migrate dev"
npx prisma migrate dev --name ci --skip-seed

# Optionally generate Prisma client explicitly (migrate dev usually does this)
# echo "[setup] Ensuring Prisma client is generated"
# npx prisma generate

echo "[setup] Completed environment setup."
