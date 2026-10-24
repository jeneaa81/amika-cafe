# Паспорт проекта Amika Café (Conductor Hub)

> **Единый источник истины (Single Source of Truth)** для архитектуры, продуктового контекста, технического стека и рабочих процессов кофейни Amika Café (Крикова, Молдова).

---

## 🧭 Навигация по артефактам паспорта

| Артефакт | Описание | Основные темы |
| :--- | :--- | :--- |
| **[prd.md](file:///d:/Amika_Cafe/conductor/prd.md)** | **Техническое задание (PRD)** | Официальное ТЗ экосистемы: Click & Collect, терминал бариста, Telegram push, единый каталог, лояльность 5+1, админка витрины. |
| **[adr/index.md](file:///d:/Amika_Cafe/conductor/adr/index.md)** | **Архитектурные решения (ADR)** | Реестр принятых решений: серверный push (pg_net), RLS-безопасность, единое облачное меню, TV-декаплинг. |
| **[product.md](file:///d:/Amika_Cafe/conductor/product.md)** | **Что и Зачем** (Продуктовое видение) | Бизнес-модель, аудитория, ключевые фичи (TWA, Loyalty, Barista Screen, TV Board, Store Admin), метрики успеха, роадмап. |
| **[tech-stack.md](file:///d:/Amika_Cafe/conductor/tech-stack.md)** | **С помощью Чего** (Технологический стек) | React 19, TypeScript, Tailwind CSS v4, Supabase (PostgreSQL REST), Realtime multi-cluster SSE (ntfy), webOS 3.0 ES5 совместимость. |
| **[workflow.md](file:///d:/Amika_Cafe/conductor/workflow.md)** | **Как работаем** (Инженерия и процессы) | Правила коммитов, деплой на GitHub Pages (`gh-pages`), проверка работоспособности, принцип *Evidence Before Claims*. |
| **[product-guidelines.md](file:///d:/Amika_Cafe/conductor/product-guidelines.md)** | **Как общаемся** (Бренд и стандарты) | Тональность бренда, двуязычие (RO/RU), правила отображения валюты (`MDL`), форматирование двойных цен и объемов. |
| **[tracks.md](file:///d:/Amika_Cafe/conductor/tracks.md)** | **Что происходит** (Реестр треков) | История завершенных этапов (TWA, лояльность, TV-доска, Supabase, двойные цены) и активные/запланированные задачи. |
| **[code_styleguides/typescript.md](file:///d:/Amika_Cafe/conductor/code_styleguides/typescript.md)** | **Гайдлайны кода** | Стандарты TypeScript, типизация сущностей меню, строгие соглашения webOS ES5. |

---

## 📌 Ключевые сведения о проекте

- **Название проекта**: Amika Café Digital Ecosystem (TWA + Barista POS + Live Digital TV Menu Board)
- **Локация**: г. Крикова, ул. Кишинэулуй 84 (Молдова), кластер Linella & Foodberry
- **Production URL**: [https://jeneaa81.github.io/amika-cafe/](https://jeneaa81.github.io/amika-cafe/)
- **TV Digital Board URL**: [https://jeneaa81.github.io/amika-cafe/tv.html](https://jeneaa81.github.io/amika-cafe/tv.html)
- **Telegram Bot**: [@AmikaCafeBot](https://t.me/AmikaCafeBot)
- **Репозиторий**: `https://github.com/jeneaa81/amika-cafe.git` (ветки `main` и `gh-pages`)
- **База данных**: Supabase PostgreSQL (`ildagazsbdtgjlzlkfaq.supabase.co`)
- **Realtime Relay**: Multi-cluster SSE (`adminforge.de`, `tedomum.fr`, `ntfy.sh`)
- **Целевое ТВ-устройство**: LG 43LH609 (webOS 3.0 / Chromium 38, без современного JS)
