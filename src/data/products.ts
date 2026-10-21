import type { Product } from '../types';

export const MILK_OPTIONS = [
  { id: 'regular', name: { ro: 'Lapte obișnuit', ru: 'Обычное молоко' }, extraPrice: 0 },
  { id: 'oat', name: { ro: 'Lapte de ovăz (Oatly)', ru: 'Овсяное молоко (Oatly)' }, extraPrice: 12 },
  { id: 'almond', name: { ro: 'Lapte de migdale', ru: 'Миндальное молоко' }, extraPrice: 12 },
  { id: 'lactose_free', name: { ro: 'Lapte fără lactoză', ru: 'Безлактозное молоко' }, extraPrice: 10 },
];

export const SYRUP_OPTIONS = [
  { id: 'none', name: { ro: 'Fără sirop', ru: 'Без сиропа' }, extraPrice: 0 },
  { id: 'caramel', name: { ro: 'Caramel sărat', ru: 'Соленая карамель' }, extraPrice: 8 },
  { id: 'vanilla', name: { ro: 'Vanilie Bourbon', ru: 'Бурбонская ваниль' }, extraPrice: 8 },
  { id: 'hazelnut', name: { ro: 'Alune de pădure', ru: 'Лесной орех' }, extraPrice: 8 },
];

export const PRODUCTS: Product[] = [
  // COFFEE
  {
    id: 'cap-01',
    name: { ro: 'Cappuccino Cremoso', ru: 'Капучино Классический' },
    description: {
      ro: 'Espresso dublu din boabe 100% Arabica de origine unică, lapte cremos texturat mătăsos.',
      ru: 'Двойной эспрессо из 100% спешелти арабики, шелковистая молочная пенка.',
    },
    price: 40,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&auto=format&fit=crop&q=80',
    volume: '250 ml',
    badge: { ro: 'Cel mai vândut', ru: 'Хит продаж' },
    options: { milk: true, syrup: true, temperature: true },
  },
  {
    id: 'fw-02',
    name: { ro: 'Flat White Dublu', ru: 'Флэт Уайт' },
    description: {
      ro: 'Gust intens de cafea cu două shot-uri de ristretto și micro-spumă fină de lapte.',
      ru: 'Насыщенный кофейный вкус на двойном ристретто с тонкой глянцевой пенкой.',
    },
    price: 48,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=800&auto=format&fit=crop&q=80',
    volume: '200 ml',
    badge: { ro: 'Favorit Barista', ru: 'Выбор Бариста' },
    options: { milk: true, syrup: true, temperature: true },
  },
  {
    id: 'latte-03',
    name: { ro: 'Caffè Latte Delicat', ru: 'Латте Классический' },
    description: {
      ro: 'Băutură delicată pe bază de espresso proaspăt și mult lapte catifelat.',
      ru: 'Мягкий кофейный напиток на основе эспрессо и большого объема нежного молока.',
    },
    price: 45,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1593443320739-77f74939d0da?w=800&auto=format&fit=crop&q=80',
    volume: '350 ml',
    options: { milk: true, syrup: true, temperature: true },
  },
  {
    id: 'raf-04',
    name: { ro: 'Raf Vanilie & Lavandă', ru: 'Раф Ваниль-Лаванда' },
    description: {
      ro: 'Specialitatea casei: espresso bătut împreună cu smântână dulce de 10% și extract natural de lavandă.',
      ru: 'Фирменный напиток: эспрессо, взбитый с 10% сливками и натуральными цветками лаванды.',
    },
    price: 55,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=80',
    volume: '300 ml',
    badge: { ro: 'Specialitate Amika', ru: 'Фирменный Amika' },
    options: { syrup: true },
  },
  {
    id: 'esp-05',
    name: { ro: 'Espresso Dublu / Solo', ru: 'Эспрессо / Двойной Эспрессо' },
    description: {
      ro: 'Shot curat de espresso cu note de ciocolată neagră, nuci caramelizate și aciditate plăcută.',
      ru: 'Чистый шот спешелти эспрессо с нотами темного шоколада, орехов и ярким послевкусием.',
    },
    price: 25,
    secondPrice: 35,
    volume: '40 ml',
    secondVolume: '80 ml',
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    options: { dose: true },
  },
  {
    id: 'cb-06',
    name: { ro: 'Cold Brew Tonic cu Portocală', ru: 'Колд Брю Тоник с Апельсином' },
    description: {
      ro: 'Cafea infuzată la rece 16 ore, apă tonică premium, felie de portocală proaspătă și gheață.',
      ru: 'Кофе 16-часового холодного заваривания, премиальный тоник, свежий апельсин и лед.',
    },
    price: 55,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80',
    volume: '350 ml',
    badge: { ro: 'Răcoritor', ru: 'Освежающий' },
  },

  // FOODBERRY DESSERTS & PASTRY
  {
    id: 'fb-01',
    name: { ro: 'Croissant cu Migdale Foodberry', ru: 'Миндальный круассан Foodberry' },
    description: {
      ro: 'Croissant artizanal din unt francez, umplut din plin cu cremă fină de migdale (frangipane) și fulgi crocanți de migdale.',
      ru: 'Крафтовый круассан на французском сливочном масле с щедрой миндальной начинкой (франжипан) и лепестками миндаля.',
    },
    price: 42,
    category: 'foodberry',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=80',
    isFoodberry: true,
    badge: { ro: 'Partener Foodberry', ru: 'Партнер Foodberry' },
  },
  {
    id: 'fb-02',
    name: { ro: 'Tartă cu Fistic & Zmeură Foodberry', ru: 'Фисташковый тарт с малиной Foodberry' },
    description: {
      ro: 'Aluat fraged cu unt, ganache mătăsos din pastă pură de fistic sicilian și confit aromat de zmeură proaspătă.',
      ru: 'Песочная основа сабле, нежный ганаш из натуральной сицилийской фисташки и сочный конфитюр из малины.',
    },
    price: 58,
    category: 'foodberry',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
    isFoodberry: true,
    badge: { ro: 'Top Desert', ru: 'Топ Десерт' },
  },
  {
    id: 'fb-03',
    name: { ro: 'Cheesecake San Sebastian Foodberry', ru: 'Чизкейк Сан-Себастьян Foodberry' },
    description: {
      ro: 'Celebrul cheesecake basc ars cu textură ultrafină cremoasă la interior. Se servește la dorință cu ciocolată belgiană caldă.',
      ru: 'Знаменитый обожженный баскский чизкейк с невероятно кремовой тающей текстурой внутри.',
    },
    price: 65,
    category: 'foodberry',
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80',
    isFoodberry: true,
    badge: { ro: 'Specialitate Chef', ru: 'Шедевр' },
  },
  {
    id: 'fb-04',
    name: { ro: 'Éclair Mango & Maracuja Foodberry', ru: 'Эклер Манго-Маракуйя Foodberry' },
    description: {
      ro: 'Pâte à choux crocantă, cremă catifelată din piure natural de fructul pasiunii și glazură de mango.',
      ru: 'Заварное тесто, шелковистый крем на натуральном пюре маракуйи и яркая тропическая глазурь из манго.',
    },
    price: 45,
    category: 'foodberry',
    image: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=800&auto=format&fit=crop&q=80',
    isFoodberry: true,
    badge: { ro: 'Partener Foodberry', ru: 'Партнер Foodberry' },
  },

  // MATCHA & SPECIALTY TEA
  {
    id: 'mt-01',
    name: { ro: 'Matcha Latte Ceremonial Uji', ru: 'Матча Латте Церемониальный' },
    description: {
      ro: 'Pudră autentică de ceai verde matcha din provincia Uji (Japonia), bătută cu telul chasen și lapte fin.',
      ru: 'Настоящая церемониальная матча из региона Удзи (Япония), взбитая бамбуковым венчиком на вашем любимом молоке.',
    },
    price: 55,
    category: 'matcha_tea',
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80',
    volume: '300 ml',
    badge: { ro: 'Bio Japonia', ru: 'Япония Удзи' },
    options: { milk: true, syrup: true, temperature: true },
  },
  {
    id: 'mt-02',
    name: { ro: 'Pink Pitaya & Mango Matcha', ru: 'Розовая Матча Питахайя & Манго' },
    description: {
      ro: 'Băutură fără cofeină din pudră roz de fructul dragonului (pitaya), piure de mango și lapte de ovăz.',
      ru: 'Яркий безалкогольный напиток на суперфуде розовой питахайи с пюре манго и овсяным молоком.',
    },
    price: 60,
    category: 'matcha_tea',
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80',
    volume: '350 ml',
    badge: { ro: 'Instagram Hit', ru: 'Инста-Хит' },
    options: { milk: true },
  },
  {
    id: 'mt-03',
    name: { ro: 'Ceai Fierbinte Cătină & Ghimbir', ru: 'Облепиховый чай с имбирем и медом' },
    description: {
      ro: 'Boabe proaspete de cătină moldovenească, felii de ghimbir suculent, miere naturală de salcâm și scorțișoară.',
      ru: 'Свежая местная облепиха, корень имбиря, натуральный акациевый мед, розмарин и палочка корицы.',
    },
    price: 45,
    category: 'matcha_tea',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
    volume: '400 ml',
  },

  // BREAKFAST & PANINI
  {
    id: 'pan-01',
    name: { ro: 'Panini Cald Prosciutto & Mozzarella', ru: 'Горячий Панини Прошутто-Моцарелла' },
    description: {
      ro: 'Ciabatta crocantă la grill, prosciutto crudo maturat, mozzarella fior di latte topită, roșii uscate și pesto genovese.',
      ru: 'Хрустящая гриль-чиабатта, итальянское прошутто, тающая моцарелла, вяленые томаты и соус песто.',
    },
    price: 58,
    category: 'breakfast',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80',
    badge: { ro: 'La Grill', ru: 'На гриле' },
  },
  {
    id: 'pan-02',
    name: { ro: 'Croissant Gourmet Somon & Avocado', ru: 'Круассан с лососем и авокадо' },
    description: {
      ro: 'Croissant pufos tăiat în jumătate, somon ușor sărat, cremă de brânză fină, avocado proaspăt și rucola.',
      ru: 'Пышный круассан, слабосоленый лосось, сливочный крем-чиз, ломтики авокадо и свежая руккола.',
    },
    price: 68,
    category: 'breakfast',
    image: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=800&auto=format&fit=crop&q=80',
    badge: { ro: 'Mic Dejun', ru: 'Завтрак' },
  },
];
