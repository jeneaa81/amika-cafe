// Supabase Client for Amika Café (Cloud Database for Menu & TV Screen & Orders & Loyalty)
import type { TvBoardConfig } from './menuStore';
import type { Order, OrderStatus, LoyaltyCard } from '../types';

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

// ==========================================
// ORDERS API (Click & Collect Pre-orders)
// ==========================================

interface DbOrderRow {
  id: string;
  telegram_user_id: number;
  customer_name: string;
  customer_phone: string;
  items: unknown;
  total_amount: number;
  pickup_time: string;
  payment_method: string;
  status: string;
  notes?: string;
  created_at: string;
}

function normalizeCartItem(raw: unknown, index: number): Order['items'][number] {
  const item = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const rawProduct = (typeof item.product === 'object' && item.product !== null ? item.product : {}) as Record<string, unknown>;
  
  let nameObj: { ro: string; ru: string };
  if (typeof rawProduct.name === 'object' && rawProduct.name !== null) {
    nameObj = {
      ro: String((rawProduct.name as Record<string, string>).ro || 'Produs'),
      ru: String((rawProduct.name as Record<string, string>).ru || 'Товар'),
    };
  } else if (typeof item.name === 'string') {
    nameObj = { ro: item.name, ru: item.name };
  } else {
    nameObj = { ro: 'Cafea / Desert', ru: 'Кофе / Десерт' };
  }

  const rawOptions = (typeof item.options === 'object' && item.options !== null ? item.options : {}) as Record<string, unknown>;

  return {
    cartItemId: String(item.cartItemId || `item-${index}`),
    product: {
      id: String(rawProduct.id || `p-${index}`),
      name: nameObj,
      description: (typeof rawProduct.description === 'object' && rawProduct.description !== null
        ? rawProduct.description
        : { ro: '', ru: '' }) as { ro: string; ru: string },
      price: Number(item.unitPrice || rawProduct.price || 0),
      secondPrice: typeof rawProduct.secondPrice === 'number' ? rawProduct.secondPrice : undefined,
      category: (rawProduct.category as any) || 'coffee',
      image: String(rawProduct.image || ''),
      volume: typeof rawProduct.volume === 'string' ? rawProduct.volume : undefined,
      secondVolume: typeof rawProduct.secondVolume === 'string' ? rawProduct.secondVolume : undefined,
      options: typeof rawProduct.options === 'object' && rawProduct.options !== null ? rawProduct.options as any : {},
    },
    quantity: Number(item.quantity || item.qty || 1),
    options: {
      dose: rawOptions.dose as any,
      milk: typeof rawOptions.milk === 'string' ? rawOptions.milk : undefined,
      syrup: typeof rawOptions.syrup === 'string' ? rawOptions.syrup : undefined,
      temperature: rawOptions.temperature as any,
    },
    unitPrice: Number(item.unitPrice || rawProduct.price || 0),
    totalPrice: Number(item.totalPrice || (Number(item.quantity || 1) * Number(item.unitPrice || rawProduct.price || 0))),
  };
}

function mapDbRowToOrder(row: DbOrderRow): Order {
  const rawItems = Array.isArray(row.items) ? row.items : [];
  return {
    id: row.id,
    telegramUserId: row.telegram_user_id,
    customerName: row.customer_name || 'Oaspete',
    customerPhone: row.customer_phone || '',
    items: rawItems.map(normalizeCartItem),
    totalAmount: Number(row.total_amount) || 0,
    pickupTime: row.pickup_time || 'Peste 5 min',
    paymentMethod: (row.payment_method as Order['paymentMethod']) || 'pickup',
    status: (row.status as OrderStatus) || 'new',
    notes: row.notes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

/**
 * Insert a new pre-order into Supabase (with automatic retry on ID collision)
 */
export async function createOrderInSupabase(
  order: Order
): Promise<{ success: boolean; id: string }> {
  let orderId = order.id;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      const payload = {
        id: orderId,
        telegram_user_id: order.telegramUserId || 0,
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        items: order.items,
        total_amount: order.totalAmount,
        pickup_time: order.pickupTime,
        payment_method: order.paymentMethod,
        status: order.status || 'new',
        notes: order.notes || '',
        created_at: new Date().toISOString(),
      };

      const resp = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
        method: 'POST',
        headers: {
          ...SUPABASE_HEADERS,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (resp.ok) {
        return { success: true, id: orderId };
      }

      if (resp.status === 409) {
        // ID collision - increment sequential ID and retry
        const currentNum = parseInt(orderId.replace(/\D/g, ''), 10);
        orderId = `#${isNaN(currentNum) ? 101 : currentNum + 1}`;
        console.warn(`Order ID collision on ${order.id}, retrying with next sequential ID: ${orderId}...`);
        continue;
      }

      const errText = await resp.text();
      console.warn('Supabase createOrder failed:', resp.status, errText);
      return { success: false, id: orderId };
    } catch (err) {
      console.warn('Supabase createOrder error:', err);
    }
  }

  return { success: false, id: orderId };
}

/**
 * Fetch active orders for Barista Screen (status in 'new', 'preparing', 'ready')
 */
export async function fetchActiveOrdersFromSupabase(): Promise<Order[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?status=in.(new,preparing,ready)&order=created_at.desc&limit=50`,
      {
        method: 'GET',
        headers: SUPABASE_HEADERS,
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!resp.ok) return [];
    const rows = (await resp.json()) as DbOrderRow[];
    return Array.isArray(rows) ? rows.map(mapDbRowToOrder) : [];
  } catch (err) {
    console.warn('Supabase fetchActiveOrders error:', err);
    return [];
  }
}

/**
 * Update an order's status in Supabase (e.g. 'preparing' -> 'ready' -> 'completed')
 */
export async function updateOrderStatusInSupabase(
  orderId: string,
  newStatus: OrderStatus
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`,
      {
        method: 'PATCH',
        headers: {
          ...SUPABASE_HEADERS,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ status: newStatus }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    return resp.ok;
  } catch (err) {
    console.warn('Supabase updateOrderStatus error:', err);
    return false;
  }
}

// ==========================================
// LOYALTY CARDS API (5+1 Digital Card)
// ==========================================

interface DbLoyaltyRow {
  card_number: string;
  telegram_user_id: number;
  customer_name?: string;
  current_stamps: number;
  total_free_earned: number;
  updated_at: string;
}

function mapDbRowToLoyalty(row: DbLoyaltyRow): LoyaltyCard {
  return {
    cardNumber: row.card_number,
    telegramUserId: row.telegram_user_id,
    customerName: row.customer_name || undefined,
    currentStamps: row.current_stamps,
    totalFreeCoffeesEarned: row.total_free_earned,
    lastUpdated: row.updated_at,
  };
}

/**
 * Get guest's loyalty card by Telegram User ID
 */
export async function fetchLoyaltyCardByTelegramId(
  tgUserId: number
): Promise<LoyaltyCard | null> {
  if (!tgUserId) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/loyalty_cards?telegram_user_id=eq.${tgUserId}&select=*`,
      {
        method: 'GET',
        headers: SUPABASE_HEADERS,
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!resp.ok) return null;
    const rows = (await resp.json()) as DbLoyaltyRow[];
    if (Array.isArray(rows) && rows.length > 0) {
      return mapDbRowToLoyalty(rows[0]);
    }
    return null;
  } catch (err) {
    console.warn('Supabase fetchLoyaltyCard error:', err);
    return null;
  }
}

/**
 * Upsert or save loyalty card in Supabase
 */
export async function saveLoyaltyCardToSupabase(
  card: LoyaltyCard
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const payload = {
      card_number: card.cardNumber,
      telegram_user_id: card.telegramUserId || 0,
      customer_name: card.customerName || '',
      current_stamps: card.currentStamps,
      total_free_earned: card.totalFreeCoffeesEarned,
      updated_at: new Date().toISOString(),
    };

    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/loyalty_cards?on_conflict=card_number`,
      {
        method: 'POST',
        headers: {
          ...SUPABASE_HEADERS,
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    return resp.ok;
  } catch (err) {
    console.warn('Supabase saveLoyaltyCard error:', err);
    return false;
  }
}

/**
 * Fetch all loyalty cards for Admin Editor list
 */
export async function fetchAllLoyaltyCardsFromSupabase(): Promise<LoyaltyCard[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/loyalty_cards?order=updated_at.desc&limit=50`,
      {
        method: 'GET',
        headers: SUPABASE_HEADERS,
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!resp.ok) return [];
    const rows = (await resp.json()) as DbLoyaltyRow[];
    return Array.isArray(rows) ? rows.map(mapDbRowToLoyalty) : [];
  } catch (err) {
    console.warn('Supabase fetchAllLoyaltyCards error:', err);
    return [];
  }
}

