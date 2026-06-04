import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Client untuk akses publik (anon key)
export const supabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
);

// Client untuk akses admin / server-side (service role key)
// Hanya digunakan di backend — JANGAN expose ke frontend
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export const STORAGE_BUCKET = env.SUPABASE_STORAGE_BUCKET;

/**
 * Upload file bukti chores ke Supabase Storage
 * Return: public URL file
 */
export async function uploadChoreEvidence(
  childId: string,
  choreId: string,
  file: Buffer,
  mimeType: string,
  attempt: number,
): Promise<string> {
  const ext = mimeType.split('/')[1] ?? 'jpg';
  const path = `${childId}/${choreId}/attempt-${attempt}-${Date.now()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload gagal: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}
