// Supabase Client for Amika Café (Cloud Database for Menu & TV Screen)
import type { TvBoardConfig } from './menuStore';

export const SUPABASE_URL = 'https://ildagazsbdtgjlzlkfaq.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsZGFnYXpzYmR0Z2psemxrZmFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NzA3NDgsImV4cCI6MjEwODE0Njc0OH0.BSGfGWuXT7HNfsCjmUbeisbcGzXs0FJvUHMz5lC-FeQ';

const SUPABASE_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

/**
 * Fetch the single persistent menu config row from Supabase
 */
export async function fetchMenuConfigFromSupabase(): Promise<TvBoardConfig | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/menu_config?id=eq.current&select=*`,
      {
        method: 'GET',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!resp.ok) {
      console.warn('Supabase fetch returned status:', resp.status);
      return null;
    }

    const rows = await resp.json();
    if (Array.isArray(rows) && rows.length > 0 && rows[0]?.config) {
      const cfg = rows[0].config as TvBoardConfig;
      if (
        Array.isArray(cfg.coffeeItems) &&
        Array.isArray(cfg.dessertItems) &&
        Array.isArray(cfg.slides)
      ) {
        return cfg;
      }
    }
    return null;
  } catch (err) {
    console.warn('Supabase fetchMenuConfig error:', err);
    return null;
  }
}

/**
 * Upsert the current menu config into Supabase
 */
export async function saveMenuConfigToSupabase(
  config: TvBoardConfig
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/menu_config?on_conflict=id`,
      {
        method: 'POST',
        headers: {
          ...SUPABASE_HEADERS,
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify({
          id: 'current',
          config,
          updated_at: new Date().toISOString(),
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (resp.ok) {
      return true;
    }
    console.warn('Supabase save failed with status:', resp.status);
    return false;
  } catch (err) {
    console.warn('Supabase saveMenuConfig error:', err);
    return false;
  }
}
