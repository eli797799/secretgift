import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseKey, getSupabaseUrl, isSupabaseConfigured } from "./config";

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Add API keys to .env.local");
  }

  return createBrowserClient(getSupabaseUrl(), getSupabaseKey());
}
