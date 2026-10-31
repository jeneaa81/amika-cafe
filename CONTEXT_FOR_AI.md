# КОНТЕКСТ ПРОЕКТА: Amika Café (Cricova) — Digital Ecosystem

## 1. О заведении и локации
* **Заведение:** Amika Café — крафтовая кофейня третьей волны (Specialty Coffee), партнер пекарни Foodberry / SweetMe.
* **Локация:** Молдова, мун. Кишинэу, г. Крикова (or. Cricova), ул. Друмул Виилор 10 (str. Drumul Viilor 10). Рядом с Linella и Farmacia Familiei.
* **Специфика бизнеса:**
  * Учет ведет бухгалтер в 1С (прямая интеграция с кассой 1С не требуется).
  * Кофейня использует цифровой ТВ-борд на стене для меню и Instagram-промо, а также Mini App для гостей и экран бариста для приема заказов.

---

## 2. Архитектура и стек технологий

### Frontend
* **Guest App & Admin/Barista**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React.
* **Standalone TV Menu Board** (`public/tv.html`):
  * **Строгий стандарт ES5**: гарантирует работу на старых и новых телевизорах LG webOS Smart TV 3.0+ (браузеры Chromium 38–68).
  * **Запрет ES6 в tv.html**: нельзя использовать `let`, `const`, стрелочные функции `=>`, шаблонные строки ` ``, `async/await`.
  * **Запрет современного CSS в tv.html**: нельзя использовать flexbox `gap:`, `inset:`, `space-evenly`.
  * **SVG вместо эмодзи**: любые Unicode-эмодзи заменены чистыми SVG.
  * **Антиалиасинг углов**: карточки с `border-radius: 26px` содержат `-webkit-mask-image: -webkit-radial-gradient(white, black)` и `background-clip: padding-box`, а у родителя `menu-section` установлен `overflow: visible`, чтобы внешние тени не обрезались под прямым углом.

### Backend & Cloud Sync
* **Supabase Database**: `https://ildagazsbdtgjlzlkfaq.supabase.co`, таблица `menu_config`, основная строка `id='current'`.
  * **Строгое правило безопасности**: никогда не перезаписывать и не удалять позиции меню (`coffeeItems`, `dessertItems`) без явного указания пользователя.
* **Real-Time Push Relay**: 3 европейских кластера `ntfy.sh` (`ntfy.tedomum.fr`, `ntfy.adminforge.de`, `ntfy.sh`), топик `amika_cricova_tv_control`.
* **Локальная шина**: `BroadcastChannel('amika_tv_bus')` и `localStorage`.

---

## 3. Оформление и цветовая гамма

### Дневная тема («Botanical Warm Cream»)
* Фон экрана: `tv_bg_day.jpg` с ботаническим обрамлением веток оливы и эвкалипта.
* Карточки меню: тёплый кремово-песочный оттенок `rgba(244, 217, 196, 0.97)` (`#f4d9c4`) в соответствии с физическим макетом и интерьером кофейни.
* Часы и бейдж Specialty Coffee: оливковый оттенок `#556b2f`.
* Контуры: `rgba(210, 168, 120, 0.45)`.

### Вечерняя тема («Evening Lounge / Dark Roast»)
* Фон экрана: `tv_bg_night.jpg` (глубокий кофейно-древесный фон с вечерним боке).
* Карточки меню: полупрозрачный эспрессо `rgba(24, 20, 18, 0.88)` с золотисто-оливковыми ценниками `#9bb155`.
* Часы и бейдж Specialty Coffee: `#9bb155`.

### Управление темами и часы
* Режимы темы: `day` (ручной день), `night` (ручная ночь), `auto_sunset` (астрономический закат в Крикова 47.139° N, 28.862° E за 15 минут до заката), `auto_schedule` (08:00 – 17:00).
* Часы: расчет молдавского времени (EET / UTC+2 зимой, UTC+3 летом) напрямую из UTC-эпохи, гарантирует точный показ времени вне зависимости от локальной настройки часового пояса ТВ.

---

## 4. Развернутые живые ссылки

* **TV Menu Board**: `https://jeneaa81.github.io/amika-cafe/tv.html`
* **Guest App / Barista**: `https://jeneaa81.github.io/amika-cafe/`
* **Admin Builder**: `https://jeneaa81.github.io/amika-cafe/?admin=1`
* **Репозиторий**: `https://github.com/jeneaa81/amika-cafe.git`
  * Ветка `main` — исходный код.
  * Ветка `gh-pages` — скомпилированный билд из папки `dist`.

---

## 5. Проверочные команды

```bash
# Проверка совместимости tv.html
node scripts/verify_tv.cjs

# Линтинг
npm run lint

# Сборка
npm run build
```
