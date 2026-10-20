import React, { useState, useEffect, useRef } from 'react';
import type { Language, Order } from '../types';
import {
  Clock,
  Sparkles,
  Flame,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Cake,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface TvMenuBoardProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  orders: Order[];
  onExitTvMode: () => void;
}

interface ShowcaseSlide {
  id: string;
  badge: { ro: string; ru: string };
  title: { ro: string; ru: string };
  subtitle: { ro: string; ru: string };
  details: { ro: string; ru: string };
  image: string;
  priceTag?: { ro: string; ru: string };
  accentColor: string;
}

export const TvMenuBoard: React.FC<TvMenuBoardProps> = ({
  language: initialLanguage,
  orders,
  onExitTvMode,
}) => {
  const baseUrl = import.meta.env.BASE_URL;

  // Language state (can auto-alternate or be manually set)
  const [lang, setLang] = useState<Language>(initialLanguage);
  const [autoRotateLang, setAutoRotateLang] = useState<boolean>(false);

  // Time & Date
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Flash Sale Mode: 'auto' | 'active' | 'inactive'
  const [flashSaleMode, setFlashSaleMode] = useState<'auto' | 'active' | 'inactive'>('inactive');

  // Active showcase slide
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Sound chime helper
  const playTvChime = (freq = 659.25) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio might need user gesture
    }
  };

  // Clock ticker & Auto Flash Sale at 20:00
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine if flash sale is active
  const isFlashSaleActive =
    flashSaleMode === 'active' ||
    (flashSaleMode === 'auto' && currentTime.getHours() >= 20);

  // Auto-switch language every 15s if enabled
  useEffect(() => {
    if (!autoRotateLang) return;
    const interval = setInterval(() => {
      setLang((prev) => (prev === 'ro' ? 'ru' : 'ro'));
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRotateLang]);

  // Showcase Slides using real Instagram HD photos of Amika Café & Foodberry
  const slides: ShowcaseSlide[] = [
    {
      id: 'foodberry-craft',
      badge: { ro: 'Partener Oficial Foodberry', ru: 'Официальный партнер Foodberry' },
      title: { ro: 'Deserturi Artizanale Proaspete', ru: 'Крафтовые десерты Foodberry' },
      subtitle: {
        ro: 'Unt francez 82%, fistic pur de Sicilia & ciocolată belgiană',
        ru: 'Французское масло 82%, сицилийская фисташка и бельгийский шоколад',
      },
      details: {
        ro: 'Livrări proaspete zilnic din laboratorul SweetMe / Foodberry direct în vitrina Amika Café.',
        ru: 'Свежая утренняя доставка напрямую из крафтовой кондитерской SweetMe / Foodberry.',
      },
      image: `${baseUrl}insta_hd/hd_6_720x1280.jpg`,
      priceTag: { ro: 'De la 42 L', ru: 'От 42 MDL' },
      accentColor: 'from-rose-500/30 to-amber-500/20',
    },
    {
      id: 'coffee-origin',
      badge: { ro: 'Зерно недели • Specialty', ru: 'Зерно недели • Specialty' },
      title: { ro: '100% Arabica Ethiopia Guji', ru: '100% Arabica Ethiopia Guji' },
      subtitle: {
        ro: 'Note de iasomie, bergamotă, piersici zemoase și caise dulci',
        ru: 'Ноты жасмина, бергамота, спелого персика и сладкого абрикоса',
      },
      details: {
        ro: 'Prăjire proaspătă artizanală de la partenerul nostru Briksa. Întreabă barista despre preparare.',
        ru: 'Свежая местная обжарка от партнера Briksa. Идеальный баланс сладости и шелковистой пенки.',
      },
      image: `${baseUrl}insta_hd/hd_17_720x1280.jpg`,
      priceTag: { ro: 'Specialty Briksa', ru: 'Обжарка Briksa' },
      accentColor: 'from-amber-600/30 to-stone-900',
    },
    {
      id: 'family-soul',
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
      image: `${baseUrl}insta_hd/hd_8_720x1280.jpg`,
      priceTag: { ro: 'Cricova cu drag', ru: 'С любовью из Крикова' },
      accentColor: 'from-amber-700/30 to-emerald-950/30',
    },
    {
      id: 'bar-ambiance',
      badge: { ro: 'Design & Atmosferă', ru: 'Интерьер & Атмосфера' },
      title: { ro: 'Barul Amika & Terasa la Apus', ru: 'Барная стойка Amika & Закаты' },
      subtitle: {
        ro: 'Vedere panoramică spre viile Cricovei și leagăn la asfințit',
        ru: 'Панорамный вид на виноградники Крикова и качели на закате',
      },
      details: {
        ro: 'Vino să te bucuri de un latte fin sau un matcha ceremonial într-o atmosferă luminoasă și calmă.',
        ru: 'Идеальное место для неспешного утра или романтического вечера с чашкой спешелти кофе.',
      },
      image: `${baseUrl}insta_hd/hd_2_720x1280.jpg`,
      priceTag: { ro: '08:00 – 21:00', ru: '08:00 – 21:00' },
      accentColor: 'from-amber-500/20 to-stone-900',
    },
    {
      id: 'matcha-coldbrew',
      badge: { ro: 'Băuturi Speciale Amika', ru: 'Авторские напитки Amika' },
      title: { ro: 'Matcha Uji & Cold Brew Tonic', ru: 'Церемониальная Матча & Колд Брю' },
      subtitle: {
        ro: 'Ceai matcha ceremonial bătut cu tel de bambus și lapte Oatly',
        ru: 'Оригинальная матча из Японии, взбитая венчиком на овсяном молоке',
      },
      details: {
        ro: 'Sau încearcă deserturile trifles în pahar cu cremă fină de mascarpone și fructe proaspete.',
        ru: 'А также порционные муссовые десерты в стаканчиках со свежими лесными ягодами.',
      },
      image: `${baseUrl}insta_hd/hd_3_720x1280.jpg`,
      priceTag: { ro: 'Bio Japonia', ru: 'Удзи Япония' },
      accentColor: 'from-emerald-600/30 to-amber-700/20',
    },
  ];

  // Auto-advance showcase slides every 7 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Keyboard controls for presentations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        handleToggleFullscreen();
      } else if (e.key === 'ArrowRight') {
        setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
      } else if (e.key === 'l' || e.key === 'L') {
        setLang((prev) => (prev === 'ro' ? 'ru' : 'ro'));
      } else if (e.key === 's' || e.key === 'S') {
        setFlashSaleMode((prev) => (prev === 'active' ? 'inactive' : 'active'));
      } else if (e.key === 'Escape') {
        if (!document.fullscreenElement) {
          onExitTvMode();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, onExitTvMode]);

  // Orders readiness tracking: notify with sound when an order becomes ready
  const prevReadyOrdersRef = useRef<string[]>([]);
  const readyOrders = orders.filter((o) => o.status === 'ready');
  const preparingOrders = orders.filter((o) => o.status === 'preparing' || o.status === 'new');

  useEffect(() => {
    const currentReadyIds = readyOrders.map((o) => o.id);
    const newReady = currentReadyIds.filter((id) => !prevReadyOrdersRef.current.includes(id));
    if (newReady.length > 0 && prevReadyOrdersRef.current.length > 0) {
      playTvChime(880); // Sound notification on TV!
    }
    prevReadyOrdersRef.current = currentReadyIds;
  }, [readyOrders]);

  const activeSlide = slides[currentSlideIndex];

  // Coffee menu items
  const coffeeItems = [
    {
      name: { ro: 'Espresso Solo / Dublu', ru: 'Эспрессо / Двойной' },
      volume: '40 ml',
      notes: { ro: '100% Arabica Briksa, note de ciocolată', ru: '100% арабика Briksa, темный шоколад' },
      price: 25,
      badge: null,
    },
    {
      name: { ro: 'Cappuccino Cremoso', ru: 'Капучино Классический' },
      volume: '250 ml',
      notes: { ro: 'Espresso dublu, micro-spumă catifelată', ru: 'Двойной эспрессо, нежная молочная пенка' },
      price: 40,
      badge: { ro: 'TOP', ru: 'ХИТ' },
    },
    {
      name: { ro: 'Flat White Dublu', ru: 'Флэт Уайт' },
      volume: '200 ml',
      notes: { ro: 'Gust intens de cafea, dublu ristretto', ru: 'Двойной шот ристретто, глянцевая пенка' },
      price: 48,
      badge: { ro: 'BARISTA', ru: 'ВЫБОР' },
    },
    {
      name: { ro: 'Caffè Latte Delicat', ru: 'Латте Классический' },
      volume: '350 ml',
      notes: { ro: 'Lapte mătăsos, gust fin și cremos', ru: 'Большой объем нежного молока' },
      price: 45,
      badge: null,
    },
    {
      name: { ro: 'Raf Vanilie & Lavandă', ru: 'Раф Ваниль-Лаванда' },
      volume: '300 ml',
      notes: { ro: 'Specialitatea casei cu flori de lavandă', ru: 'Фирменный рецепт с натуральной лавандой' },
      price: 55,
      badge: { ro: 'SPECIALITATE', ru: 'ФИРМЕННЫЙ' },
    },
    {
      name: { ro: 'Cold Brew Tonic & Portocală', ru: 'Колд Брю Тоник Апельсин' },
      volume: '350 ml',
      notes: { ro: 'Infuzat la rece 16 ore, apă tonică premium', ru: '16 ч холодного заваривания, тоник, лед' },
      price: 55,
      badge: null,
    },
    {
      name: { ro: 'Matcha Latte Ceremonial Uji', ru: 'Матча Латте Удзи (Япония)' },
      volume: '300 ml',
      notes: { ro: 'Pudră verde bio, tel de bambus chasen', ru: 'Оригинальная церемониальная матча' },
      price: 55,
      badge: { ro: 'BIO', ru: 'ЯПОНИЯ' },
    },
    {
      name: { ro: 'Ceai Cătină & Ghimbir', ru: 'Облепиховый чай с имбирем' },
      volume: '400 ml',
      notes: { ro: 'Cătină moldovenească, miere, scorțișoară', ru: 'Местная облепиха, натуральный мед' },
      price: 45,
      badge: null,
    },
  ];

  // Bakery & Foodberry items
  const dessertItems = [
    {
      name: { ro: 'Croissant cu Migdale Foodberry', ru: 'Миндальный круассан Foodberry' },
      desc: { ro: 'Unt francez, cremă frangipane, fulgi crocanți', ru: 'Французское масло, миндальный крем франжипан' },
      price: 42,
      discountPrice: 29,
      badge: { ro: 'FOODBERRY', ru: 'FOODBERRY' },
    },
    {
      name: { ro: 'Tartă Fistic & Zmeură Foodberry', ru: 'Фисташковый тарт с малиной' },
      desc: { ro: 'Ganache de fistic sicilian, confit de zmeură', ru: 'Сицилийская фисташка, сочная малина' },
      price: 58,
      discountPrice: 41,
      badge: { ro: 'TOP DESSERT', ru: 'ТОП ДЕСЕРТ' },
    },
    {
      name: { ro: 'Cheesecake San Sebastian', ru: 'Чизкейк Сан-Себастьян' },
      desc: { ro: 'Bască arsă, textură cremoasă mătăsoasă', ru: 'Тающая карамельная текстура внутри' },
      price: 65,
      discountPrice: 45,
      badge: { ro: 'CHEF PICK', ru: 'ШЕДЕВР' },
    },
    {
      name: { ro: 'Éclair Mango & Maracuja', ru: 'Эклер Манго-Маракуйя' },
      desc: { ro: 'Pâte à choux, piure exotic de maracuja', ru: 'Заварное тесто, тропический крем' },
      price: 45,
      discountPrice: 31,
      badge: null,
    },
    {
      name: { ro: 'Panini Cald Prosciutto-Mozzarella', ru: 'Панини Прошутто & Моцарелла' },
      desc: { ro: 'Ciabatta la grill, roșii uscate, pesto genovese', ru: 'Хрустящий гриль, моцарелла, вяленые томаты' },
      price: 58,
      discountPrice: 45,
      badge: { ro: 'GRILL', ru: 'ГРИЛЬ' },
    },
    {
      name: { ro: 'Croissant Gourmet Somon & Avocado', ru: 'Круассан с лососем и авокадо' },
      desc: { ro: 'Somon puțin sărat, cremă de brânză fină', ru: 'Слабосоленый лосось, крем-чиз, руккола' },
      price: 68,
      discountPrice: 52,
      badge: { ro: 'MIC DEJUN', ru: 'ЗАВТРАК' },
    },
  ];

  const formattedDate = currentTime.toLocaleDateString(lang === 'ro' ? 'ro-RO' : 'ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 text-stone-100 flex flex-col overflow-hidden select-none font-sans">
      {/* FLASH SALE TOP MARQUEE (Activates in Flash Sale Mode) */}
      {isFlashSaleActive && (
        <div className="bg-gradient-to-r from-rose-700 via-amber-600 to-rose-700 text-white px-6 py-2.5 flex items-center justify-between shadow-2xl animate-pulse">
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-black/30">
              <Flame className="w-5 h-5 text-amber-300 animate-bounce" />
            </span>
            <span className="font-black text-sm md:text-base tracking-wider uppercase font-serif">
              {lang === 'ro'
                ? '🔥 FLASH SALE DE SEARĂ: -30% LA TOATĂ VITRINA DE DESERTURI FOODBERRY PÂNĂ LA ÎNCHIDERE!'
                : '🔥 ВЕЧЕРНЯЯ FLASH-РАСПРОДАЖА: -30% НА ВСЮ ВИТРИНУ ДЕСЕРТОВ FOODBERRY ДО ЗАКРЫТИЯ!'}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono font-bold text-xs md:text-sm bg-black/40 px-3 py-1 rounded-full border border-amber-300/40">
            <span>{lang === 'ro' ? 'Închidere la 21:00' : 'До закрытия в 21:00'}</span>
          </div>
        </div>
      )}

      {/* TOP HEADER BAR */}
      <header className="bg-stone-900/90 border-b border-stone-800/80 px-6 py-3 flex items-center justify-between backdrop-blur-md shrink-0">
        {/* Brand identity */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={`${baseUrl}amika_logo_round.png`}
              alt="Amika Café"
              className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-500/60 shadow-lg shadow-amber-950/60"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-stone-900 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white font-serif tracking-tight">
                Amika Café
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                Specialty Coffee
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Foodberry Partner</span>
              </span>
            </div>
            <p className="text-xs text-stone-400 font-medium">
              or. Cricova • str. Drumul Viilor 10 • Prăjire proaspătă Briksa
            </p>
          </div>
        </div>

        {/* Live Clock & Status */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-2.5 text-right bg-stone-950/60 px-4 py-1.5 rounded-2xl border border-stone-800">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-2xl font-black text-amber-400 font-mono tracking-tight leading-none">
                {formattedTime}
              </div>
              <div className="text-[11px] text-stone-400 capitalize font-medium mt-0.5">
                {formattedDate}
              </div>
            </div>
          </div>
        </div>

        {/* TV Controls & Presentation Toggles */}
        <div className="flex items-center gap-2">
          {/* Flash sale switcher */}
          <button
            onClick={() =>
              setFlashSaleMode((prev) =>
                prev === 'inactive' ? 'active' : prev === 'active' ? 'auto' : 'inactive'
              )
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
              isFlashSaleActive
                ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-950/60 animate-pulse'
                : flashSaleMode === 'auto'
                ? 'bg-amber-900/40 text-amber-300 border-amber-600/40'
                : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
            }`}
            title="Переключить режим Flash-распродажи"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>
              {flashSaleMode === 'active'
                ? '🔥 Flash -30% (ON)'
                : flashSaleMode === 'auto'
                ? '⏰ Flash (Auto 20:00)'
                : 'Flash Sale (OFF)'}
            </span>
          </button>

          {/* Language button */}
          <div className="flex bg-stone-800 rounded-xl p-0.5 border border-stone-700 text-xs font-bold">
            <button
              onClick={() => {
                setLang('ro');
                setAutoRotateLang(false);
              }}
              className={`px-2 py-1 rounded-lg transition ${
                lang === 'ro' && !autoRotateLang ? 'bg-amber-600 text-white' : 'text-stone-400'
              }`}
            >
              RO
            </button>
            <button
              onClick={() => {
                setLang('ru');
                setAutoRotateLang(false);
              }}
              className={`px-2 py-1 rounded-lg transition ${
                lang === 'ru' && !autoRotateLang ? 'bg-amber-600 text-white' : 'text-stone-400'
              }`}
            >
              RU
            </button>
            <button
              onClick={() => setAutoRotateLang(!autoRotateLang)}
              className={`px-2 py-1 rounded-lg transition text-[10px] ${
                autoRotateLang ? 'bg-amber-500/20 text-amber-300 font-extrabold' : 'text-stone-500'
              }`}
              title="Авто-смена языка каждые 15 сек"
            >
              RO⇄RU
            </button>
          </div>

          {/* Sound mute toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700 transition"
            title={soundEnabled ? 'Звук включен' : 'Без звука'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen button */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700 transition"
            title="Во весь экран (F11)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Exit TV Mode */}
          <button
            onClick={onExitTvMode}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-600/40 text-stone-300 border border-stone-700 text-xs font-semibold flex items-center gap-1 transition"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">{lang === 'ro' ? 'Ieșire' : 'Назад'}</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA: 2 SECTIONS (MENU BOARD + ROTATING SHOWCASE) */}
      <main className="flex-1 grid grid-cols-12 gap-5 p-5 overflow-hidden">
        {/* ================= LEFT 7 COLS: DIGITAL MENU BOARD ================= */}
        <section className="col-span-12 lg:col-span-7 flex flex-col gap-4 overflow-hidden">
          <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
            {/* COLUMN 1: SPECIALTY COFFEE */}
            <div className="bg-stone-900/60 rounded-3xl border border-stone-800/80 p-4 flex flex-col justify-between shadow-xl backdrop-blur-sm">
              <div>
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-800">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
                      <Coffee className="w-4 h-4" />
                    </span>
                    <h2 className="font-extrabold text-white text-base tracking-wide uppercase font-serif">
                      {lang === 'ro' ? 'Cafea & Băuturi' : 'Кофе & Напитки'}
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/20">
                    100% Arabica
                  </span>
                </div>

                <div className="space-y-2">
                  {coffeeItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 rounded-xl hover:bg-stone-800/40 transition group"
                    >
                      <div className="pr-2 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-stone-100 group-hover:text-amber-300 transition">
                            {item.name[lang]}
                          </span>
                          {item.badge && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              {item.badge[lang]}
                            </span>
                          )}
                          <span className="text-[10px] text-stone-500 font-mono">
                            {item.volume}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400 line-clamp-1">
                          {item.notes[lang]}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-amber-400 font-mono">
                          {item.price}{' '}
                          <span className="text-[10px] font-semibold text-stone-400">MDL</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-note milk options */}
              <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between text-[10px] text-stone-400 font-medium">
                <span>🥛 Lapte alternativ: Oatly ovăz / migdale / fără lactoză</span>
                <span className="font-mono text-amber-400/90 font-bold">+10 / 12 L</span>
              </div>
            </div>

            {/* COLUMN 2: FOODBERRY BAKERY & DESSERTS */}
            <div className={`rounded-3xl border p-4 flex flex-col justify-between shadow-xl backdrop-blur-sm transition-all duration-500 ${
              isFlashSaleActive
                ? 'bg-gradient-to-br from-rose-950/40 via-stone-900/80 to-amber-950/40 border-rose-500/50 shadow-rose-950/40 ring-1 ring-rose-500/40'
                : 'bg-stone-900/60 border-stone-800/80'
            }`}>
              <div>
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-800">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-xl ${isFlashSaleActive ? 'bg-rose-500/30 text-rose-300' : 'bg-rose-500/20 text-rose-400'}`}>
                      <Cake className="w-4 h-4" />
                    </span>
                    <h2 className="font-extrabold text-white text-base tracking-wide uppercase font-serif">
                      {lang === 'ro' ? 'Vitrina Foodberry' : 'Десерты Foodberry'}
                    </h2>
                  </div>

                  {isFlashSaleActive ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse shadow-md">
                      -30% REDUCERE
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-500/20">
                      Craft Bakery
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {dessertItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 rounded-xl hover:bg-stone-800/40 transition group"
                    >
                      <div className="pr-2 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-stone-100 group-hover:text-amber-300 transition">
                            {item.name[lang]}
                          </span>
                          {item.badge && !isFlashSaleActive && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              {item.badge[lang]}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-400 line-clamp-1">
                          {item.desc[lang]}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        {isFlashSaleActive ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs text-stone-500 line-through font-mono">
                              {item.price}
                            </span>
                            <span className="text-base font-black text-rose-400 font-mono animate-bounce">
                              {item.discountPrice}{' '}
                              <span className="text-[10px] font-semibold text-rose-300">L</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-base font-black text-amber-400 font-mono">
                            {item.price}{' '}
                            <span className="text-[10px] font-semibold text-stone-400">MDL</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-note foodberry fresh delivery */}
              <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between text-[10px] text-stone-400 font-medium">
                <span className="flex items-center gap-1 text-rose-300">
                  <Sparkles className="w-3 h-3 text-rose-400" />
                  <span>{lang === 'ro' ? 'Livrări proaspete zilnic la 08:00' : 'Свежая выпечка каждое утро к 08:00'}</span>
                </span>
                <span className="text-stone-400 font-semibold">SweetMe Bakery</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= RIGHT 5 COLS: DYNAMIC SHOWCASE SLIDER ================= */}
        <section
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="col-span-12 lg:col-span-5 flex flex-col rounded-3xl overflow-hidden bg-stone-900/80 border border-stone-800 shadow-2xl relative group"
        >
          {/* Progress bar at top of slider */}
          <div className="grid grid-cols-5 gap-1.5 p-3 absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-stone-950/80 to-transparent">
            {slides.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm cursor-pointer"
                onClick={() => setCurrentSlideIndex(i)}
              >
                <div
                  className={`h-full bg-amber-400 transition-all duration-300 ${
                    i === currentSlideIndex
                      ? 'w-full'
                      : i < currentSlideIndex
                      ? 'w-full bg-amber-400/60'
                      : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Active slide hero photo & background */}
          <div className="relative flex-1 overflow-hidden bg-stone-950">
            <img
              src={activeSlide.image}
              alt={activeSlide.title[lang]}
              className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
            />

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent"></div>
            <div className={`absolute inset-0 bg-gradient-to-br ${activeSlide.accentColor} mix-blend-overlay`}></div>

            {/* Inset Badge Pill */}
            <div className="absolute top-10 left-4 z-10 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-stone-950/80 text-amber-300 border border-amber-500/40 backdrop-blur-md shadow-lg flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>{activeSlide.badge[lang]}</span>
              </span>

              {activeSlide.priceTag && (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-600/90 text-white shadow-lg backdrop-blur-md">
                  {activeSlide.priceTag[lang]}
                </span>
              )}
            </div>

            {/* Inset Photo Overlay: when on Bar Ambiance slide, show small circular child inset */}
            {activeSlide.id === 'bar-ambiance' && (
              <div className="absolute top-10 right-4 z-10">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-2xl ring-2 ring-stone-950">
                  <img
                    src={`${baseUrl}insta_hd/hd_9_3024x4032.jpg`}
                    alt="Cricova Sunset"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Floating Navigation Arrows */}
            <button
              onClick={() =>
                setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length)
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-950/60 text-white/70 hover:text-white hover:bg-stone-900 border border-white/10 transition backdrop-blur-sm opacity-0 group-hover:opacity-100 active:scale-95 z-20"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % slides.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-950/60 text-white/70 hover:text-white hover:bg-stone-900 border border-white/10 transition backdrop-blur-sm opacity-0 group-hover:opacity-100 active:scale-95 z-20"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Slide Information Card */}
            <div className="absolute bottom-0 inset-x-0 p-6 z-10 space-y-2">
              <h3 className="text-2xl font-black text-white font-serif leading-tight drop-shadow-md">
                {activeSlide.title[lang]}
              </h3>
              <p className="text-sm font-semibold text-amber-200/95 leading-snug drop-shadow">
                {activeSlide.subtitle[lang]}
              </p>
              <p className="text-xs text-stone-300/90 leading-relaxed drop-shadow line-clamp-2">
                {activeSlide.details[lang]}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ================= BOTTOM BAR: GIANT QR CODE + LIVE ORDER TICKER ================= */}
      <footer className="bg-stone-900/95 border-t border-stone-800 px-6 py-3 flex items-center justify-between gap-6 shrink-0 backdrop-blur-md">
        {/* Left: Giant Loyalty QR Code */}
        <div className="flex items-center gap-4 shrink-0 bg-stone-950/80 p-2.5 rounded-2xl border border-amber-500/30 shadow-lg">
          <div className="w-16 h-16 bg-white p-1 rounded-xl shrink-0 shadow-md flex items-center justify-center">
            <img
              src={`${baseUrl}amika_qr.svg`}
              alt="Scan QR"
              className="w-full h-full object-contain"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'ro' ? 'Card de Fidelitate Digital' : 'Электронная Карта Гостя'}</span>
            </div>
            <div className="text-sm font-black text-white">
              {lang === 'ro' ? 'A 6-a cafea este CADOU! ☕' : '6-я чашка кофе в ПОДАРОК! ☕'}
            </div>
            <p className="text-[11px] text-stone-400">
              {lang === 'ro'
                ? 'Scanează camera telefonului • Precomandă rapidă fără coadă'
                : 'Наведи камеру телефона • Заказ с собой без очередей'}
            </p>
          </div>
        </div>

        {/* Center: Live Order Status Board (Synergy with Barista Screen) */}
        <div className="flex-1 bg-stone-950/60 rounded-2xl border border-stone-800/80 p-2.5 px-4 flex items-center justify-between gap-4 overflow-hidden">
          {/* READY ORDERS */}
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                {lang === 'ro' ? 'Gata de ridicare:' : 'Готовы к выдаче:'}
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {readyOrders.length > 0 ? (
                readyOrders.map((o) => (
                  <span
                    key={o.id}
                    className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-mono font-black text-sm flex items-center gap-1.5 shadow-sm animate-pulse"
                  >
                    <span>{o.id}</span>
                    <span className="text-xs font-sans font-bold text-white">
                      ({o.customerName})
                    </span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-stone-500 italic">
                  {lang === 'ro' ? 'Toate comenzile au fost preluate' : 'Все заказы выданы'}
                </span>
              )}
            </div>
          </div>

          {/* PREPARING ORDERS */}
          <div className="hidden xl:flex items-center gap-3 border-l border-stone-800 pl-4 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                {lang === 'ro' ? 'În lucru:' : 'Готовятся:'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {preparingOrders.slice(0, 2).map((o) => (
                <span
                  key={o.id}
                  className="px-2.5 py-0.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 font-mono font-bold text-xs"
                >
                  {o.id}
                </span>
              ))}
              {preparingOrders.length === 0 && (
                <span className="text-xs text-stone-500 italic">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Sound & Presentation Info */}
        <div className="hidden md:flex flex-col items-end text-right shrink-0">
          <div className="text-[10px] text-stone-400 uppercase tracking-wider font-bold flex items-center gap-1">
            <span>Amika Live Board</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </div>
          <div className="text-xs font-bold text-stone-300 font-serif">
            Cricova • Moldova
          </div>
          <div className="text-[10px] text-amber-400/80 font-mono">
            Full HD 1080p
          </div>
        </div>
      </footer>
    </div>
  );
};
export default TvMenuBoard;
