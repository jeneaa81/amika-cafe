-- ========================================================
-- Amika Café: Bilingual Push Notification Trigger with Items Summary
-- Target: Supabase Cloud PostgreSQL
-- ========================================================
--
-- This function sends a bilingual (Romanian + Russian) push notification
-- to the customer's Telegram bot when their pre-order status becomes 'ready'.
-- It extracts all items and quantities from NEW.items and lists them.

CREATE OR REPLACE FUNCTION public.notify_guest_order_ready()
RETURNS TRIGGER AS $$
DECLARE
    v_bot_token TEXT := '8935606630:AAHf5kRs6U466GrduKzrwMeBmoKam8ltwEA';
    v_message TEXT;
    v_url TEXT;
    v_items_ro TEXT := '';
    v_items_ru TEXT := '';
    v_item RECORD;
    v_qty INT;
    v_name_ro TEXT;
    v_name_ru TEXT;
BEGIN
    -- Only trigger when status changes to 'ready'
    IF NEW.status = 'ready' AND (OLD.status IS NULL OR OLD.status != 'ready') THEN
        -- Construct bilingual items summary from JSONB array
        FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(NEW.items, '[]'::jsonb)) LOOP
            v_qty := COALESCE((v_item.value->>'quantity')::INT, (v_item.value->>'qty')::INT, 1);
            v_name_ro := COALESCE(v_item.value->'product'->'name'->>'ro', v_item.value->>'name', 'Produs');
            v_name_ru := COALESCE(v_item.value->'product'->'name'->>'ru', v_item.value->>'name', 'Товар');
            
            IF v_items_ro != '' THEN v_items_ro := v_items_ro || ', '; END IF;
            v_items_ro := v_items_ro || v_qty || 'x ' || v_name_ro;
            
            IF v_items_ru != '' THEN v_items_ru := v_items_ru || ', '; END IF;
            v_items_ru := v_items_ru || v_qty || 'x ' || v_name_ru;
        END LOOP;

        IF v_items_ro = '' THEN v_items_ro := 'Cafea / Desert'; END IF;
        IF v_items_ru = '' THEN v_items_ru := 'Кофе / Десерт'; END IF;

        -- Bilingual notification: Romanian + Russian with items list
        v_message := '☕ <b>Precomanda dvs. ' || NEW.id || ' este gata!</b>' || E'\n' ||
                     '📦 <b>Conținut:</b> ' || v_items_ro || '.' || E'\n' ||
                     '✨ Vă așteptăm la barul Amika Café (Cricova) fără coadă! ❤️' || E'\n\n' ||
                     '☕ <b>Ваш предзаказ ' || NEW.id || ' готов!</b>' || E'\n' ||
                     '📦 <b>Состав:</b> ' || v_items_ru || '.' || E'\n' ||
                     '✨ Ждём вас на барной стойке Amika Café без очереди! ❤️';
                     
        v_url := 'https://api.telegram.org/bot' || v_bot_token || '/sendMessage';

        -- Perform non-blocking HTTP request via pg_net
        IF NEW.telegram_user_id IS NOT NULL AND NEW.telegram_user_id > 0 THEN
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
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rebind trigger to public.orders
DROP TRIGGER IF EXISTS trg_notify_order_ready ON public.orders;
CREATE TRIGGER trg_notify_order_ready
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_guest_order_ready();
