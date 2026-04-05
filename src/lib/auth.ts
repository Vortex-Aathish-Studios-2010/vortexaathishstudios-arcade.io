import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures the current browser session has an anonymous auth identity.
 * Returns the user's uid. Reuses existing session if present.
 */
export const ensureAnonymousAuth = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) return session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) throw new Error("Failed to create anonymous session");
  return data.user.id;
};

/**
 * Returns the current auth user id or null.
 */
export const getAuthUserId = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
};
