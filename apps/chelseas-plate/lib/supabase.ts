import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required Supabase environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseServerClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const url = getRequiredEnv("SUPABASE_URL");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || getRequiredEnv("SUPABASE_ANON_KEY");

  cachedClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedClient;
}
