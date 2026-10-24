# TypeScript Styleguide: Amika Café

> **Стандарт кода:** Правила типизации и архитектурные конвенции для кодовой базы Amika Café.

---

## 1. Общие принципы

- Строгий режим (`strict: true`) в `tsconfig.json`.
- Запрет неявного `any`. Любые входящие внешние данные (например, из Supabase или localStorage) валидируются или типизируются через интерфейсы.
- Все типы сущностей предметной области хранятся в `src/types/index.ts`.

---

## 2. Именование и соглашения

- Интерфейсы и типы: PascalCase (например, `Product`, `CartItem`, `MenuConfig`, `Language`).
- Компоненты React: PascalCase с расширением `.tsx` (например, `ProductCard.tsx`, `AdminBuilder.tsx`).
- Хелперы и утилиты: camelCase (например, `supabaseClient.ts`, `tvSync.ts`).
- Двуязычные текстовые поля всегда объявляются как `{ ro: string; ru: string }`.

---

## 3. Модели цен и дозировок

При добавлении новых свойств продукта всегда учитывайте опциональность второй цены:

```typescript
export interface Product {
  id: string;
  name: { ro: string; ru: string };
  description: { ro: string; ru: string };
  price: number;
  secondPrice?: number;
  volume: string;
  secondVolume?: string;
  category: ProductCategory;
  imageUrl?: string;
  isPopular?: boolean;
  isAvailable?: boolean;
  options?: ProductOptions;
}
```

При расчете стоимости позиции в корзине:
```typescript
const itemPrice = (item.dose === 'double' && item.product.secondPrice)
  ? item.product.secondPrice
  : item.product.price;
```
