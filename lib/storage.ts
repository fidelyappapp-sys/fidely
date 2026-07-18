import { createServiceRoleClient } from "@/lib/supabase/server";

const BUCKET = "merchant-photos";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Uploads a menu/gallery photo straight from the merchant's device (no
// separate CDN/URL step) and returns its public URL.
export async function uploadMerchantPhoto(merchantId: string, file: File): Promise<string> {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new Error("Format d'image non supporté (JPEG, PNG, WEBP ou GIF).");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image trop lourde (5 Mo maximum).");
  }

  const path = `${merchantId}/${crypto.randomUUID()}.${ext}`;
  const db = createServiceRoleClient();

  const { error } = await db.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
