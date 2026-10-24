-- ========================================================
-- Amika Café: Reset Orders & Telegram Serverless Webhook
-- Target: Supabase Cloud PostgreSQL
-- ========================================================

-- 1. Удаление всех накопленных тестовых заказов (обнуление)
TRUNCATE TABLE public.orders;

-- Разрешить удаление заказов через API (на будущее)
DROP POLICY IF EXISTS "Allow anon delete orders" ON public.orders;
CREATE POLICY "Allow anon delete orders" ON public.orders
    FOR DELETE TO anon USING (true);

-- 2. Серверный триггер для отправки двуязычного уведомления о готовности заказа
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
    IF NEW.status = 'ready' AND (OLD.status IS NULL OR OLD.status != 'ready') THEN
        -- Формирование списка товаров из JSONB
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

        -- Двуязычное сообщение: RO + RU с позициями
        v_message := '☕ <b>Precomanda dvs. ' || NEW.id || ' este gata!</b>' || E'\n' ||
                     '📦 <b>Conținut:</b> ' || v_items_ro || '.' || E'\n' ||
                     '✨ Vă așteptăm la barul Amika Café (Cricova) fără coadă! ❤️' || E'\n\n' ||
                     '☕ <b>Ваш предзаказ ' || NEW.id || ' готов!</b>' || E'\n' ||
                     '📦 <b>Состав:</b> ' || v_items_ru || '.' || E'\n' ||
                     '✨ Ждём вас на барной стойке Amika Café без очереди! ❤️';
                     
        v_url := 'https://api.telegram.org/bot' || v_bot_token || '/sendMessage';

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

DROP TRIGGER IF EXISTS trg_notify_order_ready ON public.orders;
CREATE TRIGGER trg_notify_order_ready
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_guest_order_ready();

-- 3. Функция вебхука Telegram для автоматического ответа на /start и регистрации карты
CREATE OR REPLACE FUNCTION public.telegram_webhook(payload jsonb)
RETURNS jsonb AS $$
DECLARE
    v_bot_token TEXT := '8935606630:AAHf5kRs6U466GrduKzrwMeBmoKam8ltwEA';
    v_message JSONB;
    v_chat_id BIGINT;
    v_text TEXT;
    v_first_name TEXT;
    v_reply TEXT;
    v_card_num TEXT;
BEGIN
    v_message := payload->'message';
    IF v_message IS NULL THEN
        v_message := payload->'edited_message';
    END IF;

    IF v_message IS NOT NULL THEN
        v_chat_id := (v_message->'chat'->>'id')::BIGINT;
        v_text := COALESCE(v_message->>'text', '');
        v_first_name := COALESCE(v_message->'from'->>'first_name', 'Oaspete');

        -- Автоматическая регистрация карты лояльности в базе Supabase
        v_card_num := 'AMIKA-' || LPAD((FLOOR(RANDOM() * 9000 + 1000)::INT)::TEXT, 4, '0');
        INSERT INTO public.loyalty_cards (card_number, telegram_user_id, customer_name, current_stamps, total_free_earned)
        VALUES (v_card_num, v_chat_id, v_first_name, 0, 0)
        ON CONFLICT (telegram_user_id) DO UPDATE
        SET customer_name = EXCLUDED.customer_name;

        -- Ответ на /start или любое первое текстовое сообщение
        IF v_text = '/start' OR v_text LIKE '/start%' OR v_text != '' THEN
            v_reply := '☕ <b>Bine ați venit la Amika Café! / Добро пожаловать!</b>' || E'\n\n' ||
                       '✨ <b>Specialty Coffee & Foodberry Bakery (Cricova)</b>' || E'\n' ||
                       'Plasați o precomandă rapidă fără coadă și adunați cafele gratuite pe cardul dvs. digital 5+1!' || E'\n\n' ||
                       'Оформите быстрый предзаказ без очереди и получайте бесплатный кофе по карте 5+1:' || E'\n\n' ||
                       '👇 <i>Apăsați butonul de mai jos pentru a deschide meniul:</i>' || E'\n' ||
                       '👇 <i>Нажмите кнопку ниже, чтобы открыть меню:</i>';

            PERFORM net.http_post(
                url := 'https://api.telegram.org/bot' || v_bot_token || '/sendMessage',
                headers := '{"Content-Type": "application/json"}'::jsonb,
                body := json_build_object(
                    'chat_id', v_chat_id,
                    'text', v_reply,
                    'parse_mode', 'HTML',
                    'reply_markup', json_build_object(
                        'inline_keyboard', json_build_array(
                            json_build_array(
                                json_build_object(
                                    'text', '☕ Deschide Meniul / Открыть Меню',
                                    'web_app', json_build_object('url', 'https://jeneaa81.github.io/amika-cafe/')
                                )
                            )
                        )
                    )
                )::jsonb
            );
        END IF;
    END IF;

    RETURN json_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.telegram_webhook(jsonb) TO anon, authenticated, service_role;
