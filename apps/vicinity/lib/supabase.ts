import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null | undefined;

function readEnv(name: string) {
  return process.env[name]?.trim();
}

export function hasSupabaseServerEnv() {
  return Boolean(readEnv("SUPABASE_URL") && (readEnv("SUPABASE_SERVICE_ROLE_KEY") || readEnv("SUPABASE_ANON_KEY")));
}

export function getSupabaseServerClient() {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  const url = readEnv("SUPABASE_URL");
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY") || readEnv("SUPABASE_ANON_KEY");

  if (!url || !key) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedClient;
}
