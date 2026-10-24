# Реестр архитектурных решений (Architecture Decision Records — ADR)

> **Проект:** Amika Café Digital Ecosystem  
> **Статус реестра:** Актуален  
> **Последнее обновление:** 24 октября 2026

---

## 🧭 Список принятых архитектурных решений

| ADR ID | Название решения | Статус | Дата | Влияние на систему |
| :--- | :--- | :--- | :--- | :--- |
| **[ADR-0001](file:///d:/Amika_Cafe/conductor/adr/0001-telegram-push-serverless-dispatch.md)** | **Защищенная серверная отправка Telegram Push через Supabase Database Webhook / pg_net** | Принято (Accepted) | 24.10.2026 | Изоляция секретного токена бота `@AmikaCafeBot`, гарантированная транзакционная доставка уведомлений о готовности заказа. |
| **[ADR-0002](file:///d:/Amika_Cafe/conductor/adr/0002-orders-loyalty-rls-security.md)** | **Схема данных и политики Row Level Security (RLS) для предзаказов и карт лояльности** | Принято (Accepted) | 24.10.2026 | Защита номеров телефонов, предотвращение накрутки бесплатных чашек, разграничение прав гостя, бариста и администратора. |
| **[ADR-0003](file:///d:/Amika_Cafe/conductor/adr/0003-unified-cloud-menu-source.md)** | **Единый облачный источник правды каталога меню через Supabase menu_config** | Принято (Accepted) | 24.10.2026 | Устранение десинхрона цен между TWA и ТВ, мгновенное распространение стоп-листа по SSE, сохранение оффлайн-кэша. |
| **[ADR-0004](file:///d:/Amika_Cafe/conductor/adr/0004-smart-tv-order-decoupling.md)** | **Полное разделение Smart TV меню-борда и системы управления заказами** | Принято (Accepted) | 24.10.2026 | Очистка экрана телевизора LG webOS 3.0 от фастфуд-очереди, фокус на эстетике меню и Foodberry, тихие пуши в Telegram. |
| **[ADR-0005](file:///d:/Amika_Cafe/conductor/adr/0005-store-catalog-admin-and-media-storage.md)** | **Архитектура админки витрины магазина, гибридного медиа-хранилища и сквозного стоп-листа** | На рассмотрении (Proposed) | 24.10.2026 | Вкладка «Витрина» в ?mode=admin, автосжатие фото (WebP <80KB) в Supabase Storage, единый мастер-каталог для ТВ, 1-клик стоп-лист бариста. |

---

## 🏗️ Сводная архитектурная диаграмма (Target Architecture)

```mermaid
flowchart TD
    subgraph ClientLayer["Клиентский слой"]
        TWA["Гость: Telegram Mini App\n(@AmikaCafeBot)\nReact 19 + TypeScript"]
        Barista["Сотрудник: Экран Бариста\n(?mode=barista)\nОчередь ТОЛЬКО предзаказов"]
        Admin["Владелец: Admin Builder\n(?mode=admin)\nМеню + Ручные штампы"]
        TV["Зал: LG Smart TV (webOS 3.0)\ntv.html (Pure ES5)\nМеню + Слайды + Flash Sale"]
    end

    subgraph SupabaseCloud["Облачный бэкенд Supabase"]
        T_Menu[("public.menu_config\nЕдиное меню")]
        T_Orders[("public.orders\nRLS: Клиент видит свои,\nБариста меняет статус")]
        T_Loyalty[("public.loyalty_cards\nRLS: Клиент только читает,\nАдмин редактирует")]
        
        Trigger["DB Trigger (pg_net)\non UPDATE status='ready'"]
    end

    subgraph External["Внешние сервисы"]
        TGBot["Telegram Bot API\n(Секретный токен в Vault)"]
        SSE["Multi-Cluster SSE Relay\n(ntfy.tedomum.fr / adminforge.de)"]
    end

    TWA -->|"1. Чтение каталога"| T_Menu
    TWA -->|"2. Создание предзаказа"| T_Orders
    TWA -->|"3. Просмотр баланса чашек"| T_Loyalty

    T_Orders -->|"Realtime подписка предзаказов"| Barista
    Barista -->|"Смена статуса на 'ready'"| T_Orders

    T_Orders -->|"Срабатывание триггера"| Trigger
    Trigger -->|"POST sendMessage (Push клиенту)"| TGBot
    TGBot -.->|"Личное сообщение: 'Кофе готов!'"| TWA

    Admin -->|"Сохранение меню"| T_Menu
    Admin -->|"Корректировка чашек (Тест)"| T_Loyalty
    Admin -->|"Broadcast CONFIG_SYNC"| SSE
    SSE -->|"Мгновенный сигнал обновления"| TV
    T_Menu -->|"Загрузка свежих цен"| TV
```
