import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getEnv(): Promise<CloudflareEnv> {
  const { env } = await getCloudflareContext({ async: true });
  return env as CloudflareEnv;
}

export async function getDb(): Promise<D1Database> {
  const env = await getEnv();
  return env.DB;
}

export async function getMediaBucket(): Promise<R2Bucket> {
  const env = await getEnv();
  return env.MEDIA;
}

/**
 * Runs work after the response is sent, without blocking it. Falls back to
 * fire-and-forget if the execution context is unavailable (e.g. local dev).
 */
export async function runInBackground(work: () => Promise<unknown>): Promise<void> {
  try {
    const { ctx } = await getCloudflareContext({ async: true });
    ctx.waitUntil(work().catch((error) => console.error("Background task failed:", error)));
  } catch {
    void work().catch((error) => console.error("Background task failed:", error));
  }
}
