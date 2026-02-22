/** Storage utilities — supports local filesystem and Supabase Storage */

import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

type StorageMode = "local" | "prod";

function getMode(): StorageMode {
  return (process.env.STORAGE_MODE as StorageMode) || "local";
}

/** Returns the public URL for a file in a given Supabase Storage bucket. */
export function getStorageUrl(bucket: string, path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/** Save a generated file and return its public URL. */
export async function saveGeneratedFile(
  songId: string,
  filename: string,
  data: Buffer | string,
): Promise<string> {
  const mode = getMode();

  if (mode === "local") {
    const dir = join(process.cwd(), "public", "generated", songId);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), data);
    return `/generated/${songId}/${filename}`;
  }

  // prod: upload to Supabase Storage
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const storagePath = `${songId}/${filename}`;
  const contentType = filename.endsWith(".mp3") ? "audio/mpeg" : "text/plain";

  const { error } = await supabase.storage
    .from("generated")
    .upload(storagePath, data, { contentType, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  return getStorageUrl("generated", storagePath);
}
