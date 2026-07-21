/**
 * Sync Twilio Worker secrets from .dev.vars (never committed).
 *
 * Usage: node scripts/sync-twilio-secrets.mjs
 *
 * Secrets must not go in wrangler.jsonc `vars` — those are public in the repo.
 * `wrangler secret put` stores them encrypted on the Worker and they persist
 * across deploys.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const KEYS = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"];

function loadDevVars(path) {
  const text = readFileSync(path, "utf8");
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    values[key] = value;
  }
  return values;
}

const varsPath = resolve(process.cwd(), ".dev.vars");
const values = loadDevVars(varsPath);
const missing = KEYS.filter((key) => !values[key]);

if (missing.length) {
  console.error(`Missing in .dev.vars: ${missing.join(", ")}`);
  process.exit(1);
}

for (const key of KEYS) {
  console.log(`Setting Worker secret ${key}…`);
  const result = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["wrangler", "secret", "put", key],
    {
      input: values[key],
      encoding: "utf8",
      stdio: ["pipe", "inherit", "inherit"],
    },
  );
  if (result.status !== 0) {
    console.error(`Failed to set ${key}. Are you logged into the correct Cloudflare account?`);
    process.exit(result.status ?? 1);
  }
}

console.log("Twilio secrets saved on the Worker. They persist across deploys.");
