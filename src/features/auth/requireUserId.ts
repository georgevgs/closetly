import { supabase } from "~/lib/supabase";

export const requireUserId = async (): Promise<string> => {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) throw new Error("Not authenticated");
  return userId;
};
