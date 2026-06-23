import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseKey, getSupabaseUrl } from "@/lib/supabase/config";

let serviceInstance: SupabaseClient | null = null;
let publicInstance: SupabaseClient | null = null;

/** Server-side client with publishable key (respects RLS) */
export function createPublicClient(): SupabaseClient {
  if (!publicInstance) {
    publicInstance = createSupabaseClient(getSupabaseUrl(), getSupabaseKey(), {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return publicInstance;
}

/** Service role client — optional, bypasses RLS */
export function createServiceClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    if (!serviceInstance) {
      serviceInstance = createSupabaseClient(getSupabaseUrl(), serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
    return serviceInstance;
  }
  return createPublicClient();
}
