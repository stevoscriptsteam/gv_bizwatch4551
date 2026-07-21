/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  DB: D1Database;
  MEDIA: R2Bucket;
  APP_NAME: string;
  REGION_LABEL: string;
  APP_URL?: string;
  SESSION_SECRET?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM_NUMBER?: string;
  ADMIN_SECRET?: string;
}
