/**
 * Supabase configuration.
 * Create src/config.local.ts with:
 *   export const SUPABASE_URL = 'https://xxx.supabase.co';
 *   export const SUPABASE_ANON_KEY = 'your-key';
 * Or set env vars: SUPABASE_URL=... SUPABASE_ANON_KEY=... npm run ios
 */
let SUPABASE_URL = '';
let SUPABASE_ANON_KEY = '';

try {
  const local = require('./config.local');
  SUPABASE_URL = local.SUPABASE_URL ?? '';
  SUPABASE_ANON_KEY = local.SUPABASE_ANON_KEY ?? '';
} catch {
  // config.local.ts not found - create it from config.local.example.ts
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };
