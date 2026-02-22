/** Supabase Storage URL helper — shared contract (Owner: Role 2 Backend/Data) */

/**
 * Returns the public URL for a file in a given Supabase Storage bucket.
 * Requires NEXT_PUBLIC_SUPABASE_URL to be set.
 */
export function getStorageUrl(bucket: string, path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
