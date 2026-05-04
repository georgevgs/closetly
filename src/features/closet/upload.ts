import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { supabase } from "~/lib/supabase";

export type UploadResult = {
  photoPath: string;
  thumbPath: string;
};

const MAX_SIZE = 1280;
const THUMB_SIZE = 480;

export async function uploadItemImage(
  uri: string,
  userId: string,
  itemId: string
): Promise<UploadResult> {
  const [full, thumb] = await Promise.all([
    manipulateAsync(uri, [{ resize: { width: MAX_SIZE } }], {
      compress: 1,
      format: SaveFormat.PNG,
    }),
    manipulateAsync(uri, [{ resize: { width: THUMB_SIZE } }], {
      compress: 1,
      format: SaveFormat.PNG,
    }),
  ]);

  const photoPath = `${userId}/${itemId}/photo.png`;
  const thumbPath = `${userId}/${itemId}/thumb.png`;

  const fullBuf = await fetchArrayBuffer(full.uri);
  const thumbBuf = await fetchArrayBuffer(thumb.uri);

  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.storage
      .from("closet-photos")
      .upload(photoPath, fullBuf, { contentType: "image/png", upsert: true }),
    supabase.storage
      .from("closet-photos")
      .upload(thumbPath, thumbBuf, { contentType: "image/png", upsert: true }),
  ]);

  if (e1) throw e1;
  if (e2) throw e2;

  return { photoPath, thumbPath };
}

async function fetchArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const res = await fetch(uri);
  return await res.arrayBuffer();
}
