import React, { useState, useEffect, useRef } from 'react';
import type { Language, Order } from '../types';
import { playMelodicChime } from '../utils/audio';
import {
  type TvBoardConfig,
  loadTvConfig,
  saveTvConfigLocal,
} from '../utils/menuStore';
import { fetchMenuConfigFromSupabase } from '../utils/supabaseClient';
import {
  Clock,
  Sparkles,
  Flame,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Coffee,
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

export const TvMenuBoard: React.FC<TvMenuBoardProps> = ({
  language: initialLanguage,
  onExitTvMode,
}) => {
  const baseUrl = import.meta.env.BASE_URL;

  // Dynamic Menu & Carousel Configuration (editable from Admin Cabinet)
  const [boardConfig, setBoardConfig] = useState<TvBoardConfig>(() => loadTvConfig());

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
  const [remoteToast, setRemoteToast] = useState<string | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  const visibleSlides = boardConfig.slides.filter((s) => s.visible !== false);
  const slides = visibleSlides.length > 0 ? visibleSlides : boardConfig.slides;
  const visibleCoffeeItems = boardConfig.coffeeItems.filter((c) => c.visible !== false);
  const visibleDessertItems = boardConfig.dessertItems.filter((d) => d.visible !== false);

  const triggerMelodicChime = () => {
    if (!soundEnabled) return;
    playMelodicChime();
  };

  const processedCmdIdsRef = useRef<Set<string>>(new Set());
  const lastFetchedUrlRef = useRef<string>('');

  const applyRemoteConfig = (cfg: TvBoardConfig, sourceLabel = 'Админ') => {
    if (!cfg || !Array.isArray(cfg.coffeeItems) || !Array.isArray(cfg.slides)) return;
    setBoardConfig(cfg);
    saveTvConfigLocal(cfg);
    setCurrentSlideIndex(0);
    triggerMelodicChime();
    setRemoteToast(`✨ ${sourceLabel}: Меню и фотогалерея обновлены!`);
    setTimeout(() => setRemoteToast(null), 4000);
  };

  const fetchConfigFromUrl = async (url: string, notify = true) => {
    if (!url || url === lastFetchedUrlRef.current) return;
    lastFetchedUrlRef.current = url;
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const cfg = (await resp.json()) as TvBoardConfig;
        if (cfg && Array.isArray(cfg.coffeeItems)) {
          if (notify) {
            applyRemoteConfig(cfg, 'Админ-панель');
          } else {
            setBoardConfig(cfg);
            saveTvConfigLocal(cfg);
          }
        }
      }
    } catch {}
  };

  // Central command dispatcher for remote control
  const handleRemoteCommand = (msg: Record<string, unknown>, source = 'Пульт') => {
    if (!msg || typeof msg !== 'object') return;

    const cmdId =
      typeof msg._cmdId === 'string'
        ? msg._cmdId
        : typeof msg.id === 'string'
        ? msg.id
        : null;

    if (cmdId) {
      if (processedCmdIdsRef.current.has(cmdId)) return;
      processedCmdIdsRef.current.add(cmdId);
      if (processedCmdIdsRef.current.size > 200) {
        const first = processedCmdIdsRef.current.values().next().value;
        if (first) processedCmdIdsRef.current.delete(first);
      }
    }

    if (msg.type === 'CONFIG_SUPABASE_SYNC') {
      fetchMenuConfigFromSupabase().then((cfg) => {
        if (cfg) applyRemoteConfig(cfg, source);
      });
      return;
    } else if (msg.type === 'CONFIG_SYNC' && msg.config) {
      applyRemoteConfig(msg.config as TvBoardConfig, source);
      return;
    } else if (msg.type === 'CONFIG_URL_SYNC' && typeof msg.url === 'string') {
      fetchConfigFromUrl(msg.url, true);
      return;
    } else if (msg.type === 'SET_FLASH_SALE' && typeof msg.mode === 'string') {
      setFlashSaleMode(msg.mode as 'auto' | 'active' | 'inactive');
      setRemoteToast(
        `🔥 ${source}: Режим распродажи ${
          msg.mode === 'active' ? 'ВКЛЮЧЕН (-30%)' : msg.mode === 'auto' ? 'АВТО (20:00)' : 'ВЫКЛЮЧЕН'
        }`
      );
    } else if (msg.type === 'SET_SLIDE' && typeof msg.index === 'number') {
      setCurrentSlideIndex(msg.index % Math.max(1, slides.length));
      setIsPaused(true);
      setTimeout(() => setIsPaused(false), 20000);
      setRemoteToast(`📸 ${source}: Слайд №${msg.index + 1}`);
    } else if (msg.type === 'SET_LANG_MODE' && typeof msg.mode === 'string') {
      if (msg.mode === 'auto') {
        setAutoRotateLang(true);
        setRemoteToast(`🔄 ${source}: Авто-ротация языка (RO ⇄ RU каждые 15 сек)`);
      } else {
        setAutoRotateLang(false);
        setLang(msg.mode as Language);
        setRemoteToast(`🌐 ${source}: Язык ${msg.mode.toUpperCase()}`);
      }
    } else if (msg.type === 'SET_LANG' && typeof msg.lang === 'string') {
      setAutoRotateLang(false);
      setLang(msg.lang as Language);
      setRemoteToast(`🌐 ${source}: Язык ${msg.lang.toUpperCase()}`);
    } else if (msg.type === 'CHIME') {
      triggerMelodicChime();
      setRemoteToast(`🔔 ${source}: Мелодичный гонг`);
    }

    setTimeout(() => setRemoteToast(null), 3500);
  };

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to remote commands & admin config updates
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('amika_tv_bus');
      channel.onmessage = (event) => {
        handleRemoteCommand(event.data, 'Локальный пульт');
      };
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'amika_tv_command' && e.newValue) {
        try {
          const msg = JSON.parse(e.newValue);
          handleRemoteCommand(msg, 'Админ / Пульт');
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    const sseEndpoints = [
      'https://ntfy.tedomum.fr/amika_cricova_tv_control/sse',
      'https://ntfy.adminforge.de/amika_cricova_tv_control/sse',
    ];

    const sseInstances: EventSource[] = [];
    const activeStreams = new Set<string>();

    sseEndpoints.forEach((url) => {
      try {
        const sse = new EventSource(url);
        sseInstances.push(sse);

        sse.onopen = () => {
          activeStreams.add(url);
          setIsCloudConnected(true);
        };

        sse.onerror = () => {
          activeStreams.delete(url);
          if (activeStreams.size === 0) {
            setIsCloudConnected(false);
          }
        };

        sse.addEventListener('message', (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.attachment?.url) {
              fetchConfigFromUrl(payload.attachment.url, true);
              return;
            }
            if (payload.event === 'message' && payload.message) {
              const cmd = JSON.parse(payload.message);
              if (!cmd._cmdId && payload.id) cmd._cmdId = payload.id;
              handleRemoteCommand(cmd, 'Смартфон');
            }
          } catch {}
        });
      } catch {}
    });

    // Fetch latest config from Supabase cloud database on mount
    fetchMenuConfigFromSupabase().then((cloudCfg) => {
      if (cloudCfg) {
        const local = loadTvConfig();
        if (!local.updatedAt || cloudCfg.updatedAt >= local.updatedAt) {
          setBoardConfig(cloudCfg);
          saveTvConfigLocal(cloudCfg);
        }
      }
    }).catch(() => {});

    return () => {
      channel?.close();
      window.removeEventListener('storage', handleStorage);
      sseInstances.forEach((s) => s.close());
    };
  }, []);

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

  // Auto-advance showcase slides every 7 seconds
  useEffect(() => {
    if (isPaused || slides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        handleToggleFullscreen();
      } else if (e.key === 'ArrowRight' && slides.length > 0) {
        setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
      } else if (e.key === 'ArrowLeft' && slides.length > 0) {
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

  const safeSlideIdx = currentSlideIndex < slides.length ? currentSlideIndex : 0;
  const activeSlide = slides[safeSlideIdx] || boardConfig.slides[0];
  const activeSlideImgSrc =
    activeSlide.image.startsWith('data:') || activeSlide.image.startsWith('http')
      ? activeSlide.image
      : `${baseUrl}${activeSlide.image}`;

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
      {/* FLASH SALE TOP MARQUEE */}
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

        <div className="flex items-center gap-3">
          {remoteToast ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/90 text-indigo-200 border border-indigo-400 text-xs font-bold shadow-lg shadow-indigo-950/50 animate-in fade-in zoom-in-95">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              <span>{remoteToast}</span>
            </div>
          ) : (
            <div className="hidden xl:flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-xl bg-stone-950/60 border border-stone-800 text-stone-400">
              <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
              <span>{isCloudConnected ? 'Облако: Админ подключен' : 'Автономный режим'}</span>
            </div>
          )}
        </div>

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

        <div className="flex items-center gap-2">
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
            >
              RO⇄RU
            </button>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700 transition"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700 transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-amber-400" />}
          </button>

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
                      {boardConfig.coffeeHeader[lang]}
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/20">
                    {boardConfig.coffeeBadge}
                  </span>
                </div>

                <div className="space-y-1.5 xl:space-y-2">
                  {visibleCoffeeItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-2xl hover:bg-stone-800/50 transition group"
                    >
                      <div className="pr-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-base xl:text-lg 2xl:text-xl text-white group-hover:text-amber-300 transition tracking-tight">
                            {item.name[lang]}
                          </span>
                          {item.badge && (
                            <span className="text-[10px] xl:text-xs font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              {item.badge[lang]}
                            </span>
                          )}
                          <span className="text-xs xl:text-sm text-stone-400 font-mono font-semibold">
                            {item.volume}
                          </span>
                        </div>
                        <p className="text-xs xl:text-sm text-stone-300/90 font-medium line-clamp-1 mt-0.5">
                          {item.notes[lang]}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-lg xl:text-2xl font-black text-amber-400 font-mono tracking-tight whitespace-nowrap">
                          {item.secondPrice ? `${item.price} / ${item.secondPrice}` : item.price}{' '}
                          <span className="text-xs xl:text-sm font-bold text-amber-300/80">MDL</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between text-[11px] text-stone-400 font-medium">
                <span>{boardConfig.coffeeFooterNote[lang]}</span>
                <span className="font-mono text-amber-400/90 font-bold">{boardConfig.coffeeFooterPrice}</span>
              </div>
            </div>

            {/* COLUMN 2: FOODBERRY BAKERY & DESSERTS */}
            <div
              className={`rounded-3xl border p-4 flex flex-col justify-between shadow-xl backdrop-blur-sm transition-all duration-500 ${
                isFlashSaleActive
                  ? 'bg-gradient-to-br from-rose-950/40 via-stone-900/80 to-amber-950/40 border-rose-500/50 shadow-rose-950/40 ring-1 ring-rose-500/40'
                  : 'bg-stone-900/60 border-stone-800/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-800">
                  <div className="flex items-center gap-2">
                    <span
                      className={`p-1.5 rounded-xl ${
                        isFlashSaleActive ? 'bg-rose-500/30 text-rose-300' : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <h2 className="font-extrabold text-white text-base tracking-wide uppercase font-serif">
                      {boardConfig.dessertHeader[lang]}
                    </h2>
                  </div>

                  {isFlashSaleActive ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse shadow-md">
                      -30% REDUCERE
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {boardConfig.dessertBadge}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 xl:space-y-2">
                  {visibleDessertItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-2xl hover:bg-stone-800/50 transition group"
                    >
                      <div className="pr-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-base xl:text-lg 2xl:text-xl text-white group-hover:text-amber-300 transition tracking-tight">
                            {item.name[lang]}
                          </span>
                          {item.badge && !isFlashSaleActive && (
                            <span className="text-[10px] xl:text-xs font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              {item.badge[lang]}
                            </span>
                          )}
                          {item.volume && (
                            <span className="text-xs xl:text-sm text-stone-400 font-mono font-semibold">
                              {item.volume}
                            </span>
                          )}
                        </div>
                        <p className="text-xs xl:text-sm text-stone-300/90 font-medium line-clamp-1 mt-0.5">
                          {item.desc[lang]}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        {isFlashSaleActive ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm xl:text-base text-stone-500 line-through font-mono">
                              {item.price}
                            </span>
                            <span className="text-lg xl:text-2xl font-black text-rose-400 font-mono animate-bounce">
                              {item.discountPrice}{' '}
                              <span className="text-xs xl:text-sm font-bold text-rose-300">L</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg xl:text-2xl font-black text-amber-400 font-mono tracking-tight whitespace-nowrap">
                            {item.secondPrice ? `${item.price} / ${item.secondPrice}` : item.price}{' '}
                            <span className="text-xs xl:text-sm font-bold text-amber-300/80">MDL</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between text-[11px] text-stone-400 font-medium">
                <span className="flex items-center gap-1 text-emerald-300">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>{boardConfig.dessertFooterNote[lang]}</span>
                </span>
                <span className="text-stone-400 font-semibold">{boardConfig.dessertFooterBrand}</span>
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
          {/* Progress bar at top of slider (supports arbitrary number of slides) */}
          <div className="flex gap-1.5 p-3 absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-stone-950/80 to-transparent">
            {slides.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm cursor-pointer"
                onClick={() => setCurrentSlideIndex(i)}
              >
                <div
                  className={`h-full bg-amber-400 transition-all duration-300 ${
                    i <= safeSlideIdx ? 'w-full' : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="relative flex-1 overflow-hidden bg-stone-950">
            <img
              src={activeSlideImgSrc}
              alt={activeSlide.title[lang]}
              className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent"></div>

            <div className="absolute top-10 left-4 z-10 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-stone-950/80 text-amber-300 border border-amber-500/40 backdrop-blur-md shadow-lg flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeSlide.badge[lang]}</span>
              </span>

              {activeSlide.priceTag && (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-600/90 text-white shadow-lg backdrop-blur-md">
                  {activeSlide.priceTag[lang]}
                </span>
              )}
            </div>

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

      {/* ================= BOTTOM BAR: GIANT QR CODE + HOSPITALITY HIGHLIGHTS ================= */}
      <footer className="bg-stone-900/95 border-t border-stone-800 px-6 py-3 flex items-center justify-between gap-6 shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-4 shrink-0 bg-stone-950/80 p-2.5 rounded-2xl border border-amber-500/30 shadow-lg">
          <div className="w-14 h-14 bg-white p-1 rounded-xl shrink-0 shadow-md flex items-center justify-center">
            <img
              src={`${baseUrl}amika_qr.svg`}
              alt="Scan QR"
              className="w-full h-full object-contain"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'ro' ? 'Card de Fidelitate Digital & Precomandă' : 'Электронная Карта Гостя и Предзаказ'}</span>
            </div>
            <div className="text-sm font-black text-white">
              {lang === 'ro' ? 'A 6-a cafea este CADOU! ☕' : '6-я чашка кофе в ПОДАРОК! ☕'}
            </div>
            <p className="text-[11px] text-stone-400">
              {lang === 'ro'
                ? 'Scanează camera telefonului • Comandă rapidă fără coadă'
                : 'Наведи камеру телефона • Заказ с собой без очередей'}
            </p>
          </div>
        </div>

        {/* Center: Cafe Hospitality & Freshness Guarantees */}
        <div className="flex-1 bg-stone-950/60 rounded-2xl border border-stone-800/80 p-3 px-6 hidden lg:flex items-center justify-around gap-4">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 font-black text-xs">
              100% ARABICA
            </span>
            <span className="text-xs font-bold text-stone-200">
              {lang === 'ro' ? 'Prăjire proaspătă artizanală Briksa' : 'Свежая крафтовая обжарка Briksa'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 font-black text-xs">
              FOODBERRY
            </span>
            <span className="text-xs font-bold text-stone-200">
              {lang === 'ro' ? 'Deserturi naturale fără conservanți' : 'Натуральные десерты без консервантов'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 font-black text-xs">
              08:00 – 21:00
            </span>
            <span className="text-xs font-bold text-stone-200">
              {lang === 'ro' ? 'Vă așteptăm zilnic cu drag!' : 'Ждем вас каждый день с любовью!'}
            </span>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end text-right shrink-0">
          <div className="text-[10px] text-stone-400 uppercase tracking-wider font-bold flex items-center gap-1">
            <span>Amika Digital Menu</span>
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
