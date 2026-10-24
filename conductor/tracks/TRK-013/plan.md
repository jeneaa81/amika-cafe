# План реализации TRK-013: Production Core Implementation

> **Методология:** Subagent-Driven Development (`subagent-driven-development`)  
> **Верификация:** Evidence Before Claims (`verification-before-completion`)  
> **Базовые документы:** [PRD (conductor/prd.md)](file:///d:/Amika_Cafe/conductor/prd.md), [ADR (conductor/adr/)](file:///d:/Amika_Cafe/conductor/adr/index.md)

---

## 📋 Реестр задач реализации (Implementation Ledger)

| # | Задача | Статус | Артефакты / Файлы | Верификация |
| :--- | :--- | :--- | :--- | :--- |
| **T-1** | **Supabase SQL Migration & Client API** | ✅ Выполнено | `supabase/migrations/20261024_init_orders_loyalty.sql`, `src/utils/supabaseClient.ts`, `src/types/index.ts` | База данных, REST API методы, триггер `pg_net` для Telegram Push |
| **T-2** | **Unified Cloud Menu in TWA** | ✅ Выполнено | `src/App.tsx`, `src/utils/menuAdapter.ts`, `src/utils/menuStore.ts` | Загрузка меню из Supabase `menu_config`, поддержка Solo/Doppio, стоп-лист, оффлайн-кэш |
| **T-3** | **Pre-order Persistence & TG Identity** | ✅ Выполнено | `src/App.tsx`, `src/components/CartModal.tsx` | Запись предзаказов в `public.orders`, передача `telegram_user_id` и имени из Telegram WebApp |
| **T-4** | **Barista Realtime POS Screen** | ✅ Выполнено | `src/components/BaristaScreen.tsx`, `src/App.tsx` | Потоковая подписка на предзаказы, смена статуса на `'ready'` (триггер пуша гостю) и `'completed'` |
| **T-5** | **Loyalty 5+1 & Admin Manual Editor** | ✅ Выполнено | `src/components/LoyaltyModal.tsx`, `src/components/AdminBuilder.tsx` | Персональная карта гостя по `telegram_user_id`, QR-код, вкладка «4. Лояльность» в админке с ручной правкой чашек (0..6) |
| **T-6** | **Decouple Smart TV Board** | ✅ Выполнено | `public/tv.html`, `src/components/TvMenuBoard.tsx` | Полное разделение заказов и ТВ: экран работает как чистый эстетичный бордер меню и Foodberry |
| **T-7** | **Final Verification & Production Build** | ✅ Выполнено | `dist/`, TypeScript compiler | `npm run build` exit code 0, 1939 модулей скомпилировано без единой ошибки |
