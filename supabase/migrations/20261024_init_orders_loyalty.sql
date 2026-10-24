-- ========================================================
-- Amika Café: Migration for Orders, Loyalty & Push Trigger
-- Target: Supabase Cloud PostgreSQL
-- ========================================================

-- 1. Enable pg_net extension for server-side HTTP requests to Telegram Bot API
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Orders Table (Pre-orders from Telegram Mini App)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    telegram_user_id BIGINT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    pickup_time TEXT NOT NULL DEFAULT 'Peste 5 min',
    payment_method TEXT NOT NULL DEFAULT 'pickup',
    status TEXT NOT NULL DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast ordering by time and filtering by status
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_tg_user ON public.orders(telegram_user_id);

-- 3. Loyalty Cards Table (5+1 Digital Stamp Card)
CREATE TABLE IF NOT EXISTS public.loyalty_cards (
    card_number TEXT PRIMARY KEY,
    telegram_user_id BIGINT UNIQUE NOT NULL,
    customer_name TEXT,
    current_stamps INT2 NOT NULL DEFAULT 0 CHECK (current_stamps >= 0 AND current_stamps <= 6),
    total_free_earned INT4 NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tg_user ON public.loyalty_cards(telegram_user_id);

-- 4. Row Level Security (RLS) Configuration
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;

-- Allow anonymous public access via anon key (Frontend TWA & Barista Tablet)
DROP POLICY IF EXISTS "Allow anon read orders" ON public.orders;
CREATE POLICY "Allow anon read orders" ON public.orders
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert orders" ON public.orders;
CREATE POLICY "Allow anon insert orders" ON public.orders
    FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update orders" ON public.orders;
CREATE POLICY "Allow anon update orders" ON public.orders
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read loyalty" ON public.loyalty_cards;
CREATE POLICY "Allow anon read loyalty" ON public.loyalty_cards
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert loyalty" ON public.loyalty_cards;
CREATE POLICY "Allow anon insert loyalty" ON public.loyalty_cards
    FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update loyalty" ON public.loyalty_cards;
CREATE POLICY "Allow anon update loyalty" ON public.loyalty_cards
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 5. Server-Side Telegram Push Trigger Function (ADR-0001)
-- Triggers when order status transitions to 'ready'
CREATE OR REPLACE FUNCTION public.notify_guest_order_ready()
RETURNS TRIGGER AS $$
DECLARE
    v_bot_token TEXT := '8935606630:AAHf5kRs6U466GrduKzrwMeBmoKam8ltwEA';
    v_message TEXT;
    v_url TEXT;
BEGIN
    -- Only trigger when status changes to 'ready'
    IF NEW.status = 'ready' AND (OLD.status IS NULL OR OLD.status != 'ready') THEN
        v_message := '☕ <b>' || COALESCE(NEW.customer_name, 'Oaspete') || '</b>, comanda ta <b>' || NEW.id || '</b> este gata!' || E'\n' ||
                     '✨ Te așteptăm la tejgheaua Amika Café (Cricova).' || E'\n' ||
                     '<i>Să ai o zi minunată și plină de energie!</i>';
                     
        v_url := 'https://api.telegram.org/bot' || v_bot_token || '/sendMessage';

        -- Perform non-blocking HTTP request via pg_net
        PERFORM net.http_post(
            url := v_url,
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := json_build_object(
                'chat_id', NEW.telegram_user_id,
                'text', v_message,
                'parse_mode', 'HTML'
            )::jsonb
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to public.orders
DROP TRIGGER IF EXISTS trg_notify_order_ready ON public.orders;
CREATE TRIGGER trg_notify_order_ready
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_guest_order_ready();
