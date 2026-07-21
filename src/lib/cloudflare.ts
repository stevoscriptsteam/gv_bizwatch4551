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
