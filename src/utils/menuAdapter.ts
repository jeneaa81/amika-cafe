import type { Product, Category } from '../types';
import type { TvBoardConfig } from './menuStore';
import { PRODUCTS as DEFAULT_PRODUCTS } from '../data/products';

/**
 * Adapt and merge the persistent cloud TvBoardConfig into the customer-facing Product[] array.
 * Keeps rich photos, customization options, while dynamically applying:
 * 1. Cloud prices & dual pricing (Solo / Doppio).
 * 2. Stop-list visibility (items with visible=false are excluded from ordering).
 * 3. Newly added custom items created in AdminBuilder.
 */
export function adaptCloudMenuToProducts(
  config: TvBoardConfig | null,
  baseProducts: Product[] = DEFAULT_PRODUCTS
): Product[] {
  if (!config) return baseProducts;

  const result: Product[] = [];
  const processedCloudIds = new Set<string>();

  // Helper to find a base product by ID or matching name
  const findBaseProduct = (
    nameRo: string,
    id: string
  ): Product | undefined => {
    return baseProducts.find(
      (p) =>
        p.id === id ||
        p.name.ro.toLowerCase().trim() === nameRo.toLowerCase().trim() ||
        p.name.ru.toLowerCase().trim() === nameRo.toLowerCase().trim()
    );
  };

  // 1. Process Coffee Items from Cloud
  if (Array.isArray(config.coffeeItems)) {
    for (const coffee of config.coffeeItems) {
      if (!coffee.visible) continue; // Respect stop-list!
      processedCloudIds.add(coffee.id);

      const base = findBaseProduct(coffee.name.ro, coffee.id);
      if (base) {
        result.push({
          ...base,
          price: coffee.price,
          secondPrice: coffee.secondPrice,
          volume: coffee.volume || base.volume,
          badge: coffee.badge || base.badge,
          options: {
            ...base.options,
            dose: coffee.secondPrice ? true : base.options?.dose,
          },
        });
      } else {
        // Custom coffee item created in AdminBuilder
        result.push({
          id: coffee.id,
          name: coffee.name,
          description: coffee.notes,
          price: coffee.price,
          secondPrice: coffee.secondPrice,
          volume: coffee.volume,
          category: 'coffee',
          image:
            'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
          badge: coffee.badge || undefined,
          options: {
            dose: Boolean(coffee.secondPrice),
            milk: true,
            syrup: true,
            temperature: true,
          },
        });
      }
    }
  }

  // 2. Process Dessert & Tea Items from Cloud
  if (Array.isArray(config.dessertItems)) {
    for (const item of config.dessertItems) {
      if (!item.visible) continue; // Respect stop-list!
      processedCloudIds.add(item.id);

      const base = findBaseProduct(item.name.ro, item.id);
      const isTea =
        item.name.ro.toLowerCase().includes('ceai') ||
        item.name.ru.toLowerCase().includes('чай') ||
        item.name.ro.toLowerCase().includes('matcha');

      const category: Category = isTea ? 'matcha_tea' : 'foodberry';

      if (base) {
        result.push({
          ...base,
          price: item.price,
          secondPrice: item.secondPrice,
          volume: item.volume || base.volume,
          badge: item.badge || base.badge,
        });
      } else {
        // Custom dessert/tea created in AdminBuilder
        result.push({
          id: item.id,
          name: item.name,
          description: item.desc,
          price: item.price,
          secondPrice: item.secondPrice,
          volume: item.volume,
          category,
          isFoodberry: category === 'foodberry',
          image: isTea
            ? 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=80',
          badge: item.badge || undefined,
        });
      }
    }
  }

  // 3. Fallback: Include any base products not managed in the cloud list
  for (const base of baseProducts) {
    const isAlreadyIncluded = result.some(
      (r) =>
        r.id === base.id ||
        r.name.ro.toLowerCase() === base.name.ro.toLowerCase()
    );
    if (!isAlreadyIncluded) {
      result.push(base);
    }
  }

  return result;
}
