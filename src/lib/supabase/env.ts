// Shared env-var validation for the Supabase clients (server, browser,
// proxy). Replaces non-null assertions with explicit runtime checks so
// missing or empty values surface as a clear error in Vercel function
// logs instead of a cryptic Node `fetch failed` from the SDK.

export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !url.trim()) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not set. " +
        "Add it to .env.local for local development, or to your Vercel " +
        "project's Environment Variables (Settings → Environment Variables) " +
        "for production. Find the value in Supabase Dashboard → Project Settings → API.",
    );
  }
  if (!anonKey || !anonKey.trim()) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. " +
        "Add it to .env.local for local development, or to your Vercel " +
        "project's Environment Variables (Settings → Environment Variables) " +
        "for production. Find the value in Supabase Dashboard → Project Settings → API.",
    );
  }

  return { url, anonKey };
}
