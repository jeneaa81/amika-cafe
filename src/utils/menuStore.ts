// Unified Menu & Showcase Store for Amika Café (Admin Panel <-> TV Screen <-> App)
import type { Product } from '../types';
import { PRODUCTS } from '../data/products';

export interface TvCoffeeItem {
  id: string;
  name: { ro: string; ru: string };
  volume: string;
  notes: { ro: string; ru: string };
  price: number;
  secondPrice?: number;
  badge: { ro: string; ru: string } | null;
  visible: boolean;
}

export interface TvDessertItem {
  id: string;
  name: { ro: string; ru: string };
  volume?: string;
  desc: { ro: string; ru: string };
  price: number;
  secondPrice?: number;
  discountPrice: number;
  badge: { ro: string; ru: string } | null;
  visible: boolean;
}

export interface TvSlideItem {
  id: string;
  image: string;
  badge: { ro: string; ru: string };
  title: { ro: string; ru: string };
  subtitle: { ro: string; ru: string };
  details: { ro: string; ru: string };
  priceTag?: { ro: string; ru: string };
  visible: boolean;
}

export interface TvBoardConfig {
  updatedAt: number;
  coffeeHeader: { ro: string; ru: string };
  coffeeBadge: string;
  coffeeFooterNote: { ro: string; ru: string };
  coffeeFooterPrice: string;
  coffeeItems: TvCoffeeItem[];
  dessertHeader: { ro: string; ru: string };
  dessertBadge: string;
  dessertFooterNote: { ro: string; ru: string };
  dessertFooterBrand: string;
  dessertItems: TvDessertItem[];
  slides: TvSlideItem[];
  storeProducts?: Product[];
}

export const STORAGE_KEY_TV_CONFIG = 'amika_tv_custom_config_v1';

export const DEFAULT_TV_CONFIG: TvBoardConfig = {
  updatedAt: 0,
  coffeeHeader: { ro: 'Cafea & Băuturi', ru: 'Кофе & Напитки' },
  coffeeBadge: '100% Arabica',
  coffeeFooterNote: {
    ro: '🥛 Lapte alternativ: Oatly ovăz / migdale / fără lactoză',
    ru: '🥛 Альтернативное молоко: овсяное Oatly / миндаль / безлактозное',
  },
  coffeeFooterPrice: '+10 / 12 L',
  coffeeItems: [
    {
      id: 'c-1',
      name: { ro: 'Espresso (milk) / Dublu', ru: 'Эспрессо (milk) / Двойной' },
      volume: '30 / 60 ml',
      notes: { ro: '100% Arabica', ru: '100% арабика' },
      price: 28,
      secondPrice: 35,
      badge: null,
      visible: true,
    },
    {
      id: 'c-6',
      name: { ro: 'Americano (milk) / Dublu', ru: 'Американо (Milk) / Двойной' },
      volume: '150 / 250 ml',
      notes: { ro: 'Cafea Americano aromată', ru: 'Классический американо' },
      price: 28,
      secondPrice: 35,
      badge: null,
      visible: true,
    },
    {
      id: 'c-2',
      name: { ro: 'Cappuccino / Vegan', ru: 'Капучино / Веган' },
      volume: '250 / 350 ml',
      notes: { ro: 'Espresso dublu, micro-spumă cremoasă', ru: 'Двойной эспрессо, кремовая пенка' },
      price: 35,
      secondPrice: 40,
      badge: { ro: 'TOP', ru: 'ХИТ' },
      visible: true,
    },
    {
      id: 'c-3',
      name: { ro: 'Flat White / Vegan', ru: 'Флэт Уайт / Веган' },
      volume: '200 / 300 ml',
      notes: { ro: 'Dublu espresso', ru: 'Двойной эспрессо' },
      price: 50,
      secondPrice: 55,
      badge: { ro: 'BARISTA', ru: 'ВЫБОР' },
      visible: true,
    },
    {
      id: 'c-4',
      name: { ro: 'Latte / Latte Mare', ru: 'Латте / Веган' },
      volume: '300 / 450 ml',
      notes: { ro: 'Vegan - 45 Lei', ru: 'Веган - 45 лей' },
      price: 39,
      secondPrice: 45,
      badge: null,
      visible: true,
    },
    {
      id: 'c-5',
      name: { ro: 'Raf Scortisoara & Lavandă', ru: 'Раф Корица + Лаванда' },
      volume: '300 ml',
      notes: { ro: '(sau alt sirop la alegere)', ru: '(или другой сироп на выбор)' },
      price: 55,
      badge: { ro: 'SPECIALITATE', ru: 'ФИРМЕННЫЙ' },
      visible: true,
    },
    {
      id: 'c-7',
      name: { ro: 'Matcha Latte / Vegan', ru: 'Матча Латте / Веган' },
      volume: '300 ml',
      notes: { ro: 'Pudră verde bio Uji', ru: 'Оригинальная церемониальная матча' },
      price: 55,
      badge: { ro: 'Organik', ru: 'Organik' },
      visible: true,
    },
    {
      id: 'c-8',
      name: { ro: 'Ceai Cătină', ru: 'Облепиховый чай' },
      volume: '400 ml',
      notes: { ro: 'Cătină, miere, scorțișoară, mentă, lămâie, ghimbir', ru: 'Облепиха, мед, корица, мята, лимон, имбирь' },
      price: 50,
      badge: null,
      visible: true,
    },
  ],
  dessertHeader: { ro: 'Ceaiuri & Specialități', ru: 'Чаи & Напитки' },
  dessertBadge: 'Natural & Bio',
  dessertFooterNote: {
    ro: '🌿 Infuzii naturale și băuturi preparate cu grijă',
    ru: '🌿 Натуральные листовые чаи и авторские настои',
  },
  dessertFooterBrand: '100% Natural',
  dessertItems: [
    {
      id: 'd-1',
      name: { ro: 'Ceai Cătină & Ghimbir', ru: 'Облепиховый чай с имбирем' },
      volume: '450 ml',
      desc: { ro: 'Cătină moldovenească bio, miere, ghimbir, scorțișoară', ru: 'Натуральная облепиха, свежий имбирь, мед, специи' },
      price: 45,
      discountPrice: 35,
      badge: { ro: 'TOP', ru: 'ХИТ' },
      visible: true,
    },
    {
      id: 'd-2',
      name: { ro: 'Ceai Verde Sencha Uji', ru: 'Зеленый чай Сенча (Япония)' },
      volume: '400 ml',
      desc: { ro: 'Frunze întregi, aromă proaspătă și revigorantă', ru: 'Премиальный японский чай, тонкий травянистый аромат' },
      price: 40,
      discountPrice: 30,
      badge: { ro: 'BIO', ru: 'БИО' },
      visible: true,
    },
    {
      id: 'd-3',
      name: { ro: 'Infuzie Fructe de Pădure & Mentă', ru: 'Ягодный чай с дикой мятой' },
      volume: '450 ml',
      desc: { ro: 'Zmeură, coacăze, flori de hibiscus, mentă proaspătă', ru: 'Малина, черная смородина, гибискус, листовая мята' },
      price: 45,
      discountPrice: 35,
      badge: null,
      visible: true,
    },
    {
      id: 'd-4',
      name: { ro: 'Ceai Negru Assam & Condimente', ru: 'Черный чай Ассам Пряный' },
      volume: '400 ml',
      desc: { ro: 'Ceai nobil din India, nuanțe calde de malț și cardamom', ru: 'Индийский классический черный чай с нотами солода' },
      price: 40,
      discountPrice: 30,
      badge: null,
      visible: true,
    },
    {
      id: 'd-5',
      name: { ro: 'Cascara Infuzie Cireșe Cafea', ru: 'Каскара (Настой кофейных ягод)' },
      volume: '350 ml',
      desc: { ro: 'Pulpă uscată de cireșe de cafea, note de măceș și miere', ru: 'Настой мякоти кофейных ягод, ноты шиповника и кураги' },
      price: 45,
      discountPrice: 35,
      badge: { ro: 'SPECIALITATE', ru: 'СПЕШЕЛТИ' },
      visible: true,
    },
    {
      id: 'd-6',
      name: { ro: 'Limonadă Artizanală Citrice & Mentă', ru: 'Крафтовый лимонад Цитрус-Мята' },
      volume: '400 ml',
      desc: { ro: 'Suc proaspăt stors de lămâie și portocală, apă minerală', ru: 'Свежевыжатый сок цитрусовых, мята, лед' },
      price: 45,
      discountPrice: 35,
      badge: { ro: 'PROASPĂT', ru: 'ФРЕШ' },
      visible: true,
    },
  ],
  slides: [
    {
      id: 's-1',
      image: 'insta_hd/hd_6_720x1280.jpg',
      badge: { ro: 'Partener Oficial Foodberry', ru: 'Официальный партнер Foodberry' },
      title: { ro: 'Deserturi Artizanale Proaspete', ru: 'Крафтовые десерты Foodberry' },
      subtitle: {
        ro: 'Unt francez 82%, fistic pur de Sicilia & ciocolată belgiană',
        ru: 'Французское масло 82%, сицилийская фисташка и бельгийский шоколад',
      },
      details: {
        ro: 'Livrări proaspete zilnic din laboratorul SweetMe direct în vitrina Amika Café.',
        ru: 'Свежая утренняя доставка напрямую из крафтовой кондитерской SweetMe.',
      },
      priceTag: { ro: 'De la 42 L', ru: 'От 42 MDL' },
      visible: true,
    },
    {
      id: 's-2',
      image: 'insta_hd/hd_17_720x1280.jpg',
      badge: { ro: 'Originea Săptămânii • Specialty', ru: 'Зерно недели • Specialty' },
      title: { ro: '100% Arabica Ethiopia Guji', ru: '100% Arabica Ethiopia Guji' },
      subtitle: {
        ro: 'Note de iasomie, bergamotă, piersici zemoase și caise dulci',
        ru: 'Ноты жасмина, бергамота, спелого персика и сладкого абрикоса',
      },
      details: {
        ro: 'Prăjire proaspătă artizanală de la partenerul nostru Briksa.',
        ru: 'Свежая местная обжарка от партнера Briksa. Шелковистая пенка.',
      },
      priceTag: { ro: 'Specialty Briksa', ru: 'Обжарка Briksa' },
      visible: true,
    },
    {
      id: 's-3',
      image: 'insta_hd/hd_8_720x1280.jpg',
      badge: { ro: 'Amika Café • Familie & Pasiune', ru: 'Amika Café • Семья и уют' },
      title: { ro: 'Ospitalitate Caldă din Cricova', ru: 'Тепло и забота в каждой чашке' },
      subtitle: {
        ro: '„Ajutorul meu” — cafea pregătită și servită din suflet',
        ru: '«Мой главный помощник» — кофе, приготовленный с любовью',
      },
      details: {
        ro: 'Locul unde fiecare oaspete este întâmpinat ca un prieten drag. Str. Drumul Viilor 10.',
        ru: 'Локальная кофейня, где ценят каждого гостя. Крикова, str. Drumul Viilor 10.',
      },
      priceTag: { ro: 'Cricova cu drag', ru: 'С любовью из Крикова' },
      visible: true,
    },
    {
      id: 's-4',
      image: 'insta_hd/hd_2_720x1280.jpg',
      badge: { ro: 'Design & Atmosferă', ru: 'Интерьер & Атмосфера' },
      title: { ro: 'Barul Amika & Terasa la Apus', ru: 'Барная стойка Amika & Закаты' },
      subtitle: {
        ro: 'Vedere panoramică spre viile Cricovei și leagăn la asfințit',
        ru: 'Панорамный вид на виноградники Крикова и качели на закате',
      },
      details: {
        ro: 'Vino să te bucuri de un latte fin sau un matcha într-o atmosferă luminoasă.',
        ru: 'Идеальное место для неспешного утра или вечера с чашкой спешелти кофе.',
      },
      priceTag: { ro: '08:00 – 21:00', ru: '08:00 – 21:00' },
      visible: true,
    },
    {
      id: 's-5',
      image: 'insta_hd/hd_3_720x1280.jpg',
      badge: { ro: 'Băuturi Speciale Amika', ru: 'Авторские напитки Amika' },
      title: { ro: 'Matcha Uji & Cold Brew Tonic', ru: 'Церемониальная Матча & Колд Брю' },
      subtitle: {
        ro: 'Ceai matcha ceremonial bătut cu tel de bambus și lapte Oatly',
        ru: 'Оригинальная матча из Японии, взбитая венчиком на овсяном молоке',
      },
      details: {
        ro: 'Sau încearcă deserturile trifles în pahar cu cremă fină de mascarpone.',
        ru: 'А также порционные муссовые десерты в стаканчиках со свежими ягодами.',
      },
      priceTag: { ro: 'Bio Japonia', ru: 'Удзи Япония' },
      visible: true,
    },
  ],
};

// Built-in gallery of Instagram HD photos so the owner can also pick from existing photos
export const BUILTIN_INSTA_GALLERY = [
  { label: 'Витрина Foodberry (Круассаны)', path: 'insta_hd/hd_6_720x1280.jpg' },
  { label: 'Эспрессо и зерно Specialty', path: 'insta_hd/hd_17_720x1280.jpg' },
  { label: 'Семья Amika («Мой помощник»)', path: 'insta_hd/hd_8_720x1280.jpg' },
  { label: 'Барная стойка и интерьер', path: 'insta_hd/hd_2_720x1280.jpg' },
  { label: 'Матча и десерты в стаканчиках', path: 'insta_hd/hd_3_720x1280.jpg' },
  { label: 'Закат и качели в Крикова', path: 'insta_hd/hd_9_3024x4032.jpg' },
  { label: 'Терраса и фасад Amika', path: 'insta_hd/hd_10_3024x4032.jpg' },
  { label: 'Атмосфера зала и столики', path: 'insta_hd/hd_11_3024x4032.jpg' },
  { label: 'Кофе с собой на прогулке', path: 'insta_hd/hd_12_3072x4096.jpg' },
  { label: 'Латте-арт крупным планом', path: 'insta_hd/hd_4_1217x2160.jpg' },
  { label: 'Холодные напитки летние', path: 'insta_hd/hd_5_864x1536.jpg' },
  { label: 'Фирменная подача Amika', path: 'insta_hd/hd_1_720x1280.jpg' },
  { label: 'Десертная витрина (ракурс 2)', path: 'insta_hd/hd_7_720x1280.jpg' },
  { label: 'Утренний капучино и выпечка', path: 'insta_hd/hd_13_720x960.jpg' },
  { label: 'Свежие круассаны на подносе', path: 'insta_hd/hd_14_720x960.jpg' },
];

export interface StorePhotoPreset {
  id: string;
  category: string;
  name: { ro: string; ru: string };
  url: string;
}

export const STORE_PHOTO_PRESETS: StorePhotoPreset[] = [
  {
    id: 'photo-cappuccino',
    category: 'coffee',
    name: { ro: 'Cappuccino Cremoso', ru: 'Капучино Классический' },
    url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'photo-flatwhite',
    category: 'coffee',
    name: { ro: 'Flat White Dublu', ru: 'Флэт Уайт' },
    url: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'photo-latte',
    category: 'coffee',
    name: { ro: 'Caffè Latte Delicat', ru: 'Латте Нежный' },
    url: 'https://images.unsplash.com/photo-1593443320739-77f74939d0da?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'photo-raf',
    category: 'coffee',
    name: { ro: 'Raf Vanilie & Lavandă', ru: 'Раф Ваниль-Лаванда' },
    url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'photo-espresso',
    category: 'coffee',
    name: { ro: 'Espresso Solo / Dublu', ru: 'Эспрессо Соло / Двойной' },
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'photo-coldbrew',
    category: 'coffee',
    name: { ro: 'Cold Brew Tonic & Portocală', ru: 'Колд Брю Тоник Апельсин' },
    url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'photo-croissant',
    category: 'foodberry',
    name: { ro: 'Croissant Foodberry Francez', ru: 'Французский круассан Foodberry' },
    url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'photo-cheesecake',
    category: 'foodberry',
    name: { ro: 'Cheesecake San Sebastian', ru: 'Чизкейк Сан-Себастьян' },
    url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'photo-eclair',
    category: 'foodberry',
    name: { ro: 'Ecler Artizanal Fistic', ru: 'Крафтовый эклер Фисташка' },
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'photo-matcha',
    category: 'matcha_tea',
    name: { ro: 'Matcha Latte Ceremonial Uji', ru: 'Матча Латте Удзи (Япония)' },
    url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'photo-berrytea',
    category: 'matcha_tea',
    name: { ro: 'Ceai Cătină & Ghimbir / Fructe', ru: 'Облепиховый / Ягодный чай' },
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'photo-panini',
    category: 'breakfast',
    name: { ro: 'Panini Prosciutto & Mozzarella', ru: 'Панини Прошутто & Моцарелла' },
    url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'photo-beans',
    category: 'coffee',
    name: { ro: 'Boabe Cafea Specialty 250g', ru: 'Зерно Specialty 250г' },
    url: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=800&auto=format&fit=crop&q=80',
  },
];

export function getDefaultStoreProducts(): Product[] {
  return PRODUCTS.map((p, idx) => ({
    ...p,
    visible: p.visible !== false,
    showOnTv: p.showOnTv !== false,
    tvColumn: p.tvColumn || (p.category === 'coffee' ? 'coffee' : 'desserts'),
    sortOrder: idx + 1,
  }));
}

export function syncTvColumnsFromStoreProducts(config: TvBoardConfig): TvBoardConfig {
  const store = Array.isArray(config.storeProducts) && config.storeProducts.length > 0
    ? config.storeProducts
    : getDefaultStoreProducts();

  const formatItemVolume = (
    vol?: string,
    secVol?: string,
    defaultVol?: string
  ): string | undefined => {
    const base = (vol || '').replace(/\s*\/\s*$/, '').trim();
    const second = (secVol || '').trim();
    if (base && second) return `${base} / ${second}`;
    if (base) return base;
    return defaultVol;
  };

  const normalizeBadge = (
    badge?: { ro: string; ru: string } | null
  ): { ro: string; ru: string } | null => {
    if (!badge) return null;
    const ro = (badge.ro || '').trim();
    const ru = (badge.ru || '').trim();
    if (!ro && !ru) return null;
    return { ro: ro || ru, ru: ru || ro };
  };

  // Left TV Column (Coffee & Drinks)
  const coffeeItems: TvCoffeeItem[] = store
    .filter((p) => p.showOnTv && (p.tvColumn === 'coffee' || !p.tvColumn))
    .map((p) => ({
      id: p.id,
      name: p.name,
      volume: formatItemVolume(p.volume, p.secondVolume, '250 ml') || '250 ml',
      notes: p.description,
      price: p.price,
      secondPrice: p.secondPrice,
      badge: normalizeBadge(p.badge),
      visible: p.visible !== false,
    }));

  // Right TV Column (Desserts & Specialities)
  const dessertItems: TvDessertItem[] = store
    .filter((p) => p.showOnTv && p.tvColumn === 'desserts')
    .map((p) => ({
      id: p.id,
      name: p.name,
      volume: formatItemVolume(p.volume, p.secondVolume),
      desc: p.description,
      price: p.price,
      secondPrice: p.secondPrice,
      discountPrice: Math.round(p.price * 0.7),
      badge: normalizeBadge(p.badge),
      visible: p.visible !== false,
    }));

  return {
    ...config,
    storeProducts: store,
    coffeeItems,
    dessertItems,
  };
}

export function loadTvConfig(): TvBoardConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TV_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.coffeeItems) && Array.isArray(parsed.dessertItems) && Array.isArray(parsed.slides)) {
        if (!Array.isArray(parsed.storeProducts) || parsed.storeProducts.length === 0) {
          parsed.storeProducts = getDefaultStoreProducts();
        }
        return { ...DEFAULT_TV_CONFIG, ...parsed };
      }
    }
  } catch (e) {
    console.warn('Failed to load TV config from localStorage:', e);
  }
  return {
    ...DEFAULT_TV_CONFIG,
    storeProducts: getDefaultStoreProducts(),
  };
}

export function saveTvConfigLocal(
  config: TvBoardConfig,
  preserveTimestamp = false
): TvBoardConfig {
  const updated = {
    ...config,
    updatedAt:
      preserveTimestamp && config.updatedAt ? config.updatedAt : Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY_TV_CONFIG, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save TV config to localStorage:', e);
  }
  return updated;
}

// Compress uploaded image file via HTML5 Canvas so it transfers rapidly and doesn't overflow TV RAM
export function compressImageFile(file: File, maxDimension = 1080, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Image load error'));
      img.src = String(e.target?.result || '');
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });
}
