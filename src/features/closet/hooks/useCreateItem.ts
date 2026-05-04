import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { supabase } from "~/lib/supabase";
import { uploadItemImage } from "../upload";
import { itemsKeys } from "./useItems";
import type { TablesInsert } from "~/types/database";
import type { ItemColor } from "~/types/items";

export type NewItemInput = Omit<TablesInsert<"items">, "user_id" | "photo_path" | "thumb_path"> & {
  photoUri: string;
  colors: ItemColor[];
};

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewItemInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const itemId = Crypto.randomUUID();
      const { photoPath, thumbPath } = await uploadItemImage(
        input.photoUri,
        userId,
        itemId
      );

      const { photoUri: _photoUri, ...rest } = input;
      const { data, error } = await supabase
        .from("items")
        .insert({
          ...rest,
          id: itemId,
          user_id: userId,
          photo_path: photoPath,
          thumb_path: thumbPath,
          colors: rest.colors as unknown as TablesInsert<"items">["colors"],
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: itemsKeys.all }),
  });
}
