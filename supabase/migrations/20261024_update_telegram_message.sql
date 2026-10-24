-- ========================================================
-- Amika Café: Optional Trigger Update for Telegram Message
-- Target: Supabase Cloud PostgreSQL
-- ========================================================
--
-- This script allows updating the text sent to customer Telegram
-- when order status changes to 'ready'.
-- Currently active format (in Romanian):
--   ☕ {customer_name}, comanda ta {id} este gata!
--   ✨ Te așteptăm la tejgheaua Amika Café (Cricova).
--   Să ai o zi minunată și plină de energie!
--
-- If you want a bilingual (RO + RU) notification, run the function below in Supabase SQL Editor:

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
