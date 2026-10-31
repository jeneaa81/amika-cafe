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

// Astronomical solar calculator for Cricova (47.139° N, 28.862° E)
// Accounts for Moldova Winter Time (EET / UTC+2) and Summer Time (EEST / UTC+3)
function getMoldovaOffsetHours(utcMs: number): number {
  const d = new Date(utcMs);
  const y = d.getUTCFullYear();
  const marLastSun = 31 - new Date(Date.UTC(y, 2, 31)).getUTCDay();
  const octLastSun = 31 - new Date(Date.UTC(y, 9, 31)).getUTCDay();
  const dstStart = Date.UTC(y, 2, marLastSun, 1, 0, 0);
  const dstEnd = Date.UTC(y, 9, octLastSun, 1, 0, 0);
  return utcMs >= dstStart && utcMs < dstEnd ? 3 : 2;
}

function isDaytimeInCricova(nowDate: Date): boolean {
  const utcMs = nowDate.getTime();
  const offset = getMoldovaOffsetHours(utcMs);
  const md = new Date(utcMs + offset * 3600000);
  const y = md.getUTCFullYear();
  const m = md.getUTCMonth();
  const day = md.getUTCDate();
  const startOfYear = Date.UTC(y, 0, 1);
  const curDayUtc = Date.UTC(y, m, day);
  const doy = Math.floor((curDayUtc - startOfYear) / 86400000) + 1;
  const gamma = (2 * Math.PI / 365) * (doy - 1 + 0.5);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
  const lat = 47.139 * Math.PI / 180;
  const lon = 28.862;
  const zenith = 90.833 * Math.PI / 180;
  let cosHA = (Math.cos(zenith) / (Math.cos(lat) * Math.cos(decl))) - Math.tan(lat) * Math.tan(decl);
  cosHA = Math.max(-1, Math.min(1, cosHA));
  const haDeg = Math.acos(cosHA) * 180 / Math.PI;
  const sunriseUtcMin = 720 - 4 * (lon + haDeg) - eqTime;
  const sunsetUtcMin = 720 - 4 * (lon - haDeg) - eqTime;
  const sunriseLocalMin = Math.round(sunriseUtcMin + offset * 60);
  const sunsetLocalMin = Math.round(sunsetUtcMin + offset * 60);
  const nowLocalMin = md.getUTCHours() * 60 + md.getUTCMinutes();
  // Transition to evening lounge theme 15 minutes before sunset
  return nowLocalMin >= sunriseLocalMin && nowLocalMin < (sunsetLocalMin - 15);
}

export const TvMenuBoard: React.FC<TvMenuBoardProps> = ({
  language: initialLanguage,
  onExitTvMode,
}) => {
  const baseUrl = import.meta.env.BASE_URL;

  // Dynamic Menu & Carousel Configuration (editable from Admin Cabinet)
  const [boardConfig, setBoardConfig] = useState<TvBoardConfig>(() => loadTvConfig());

  // Language state (default RO)
  const [lang] = useState<Language>(initialLanguage);

  // Theme mode: 'auto' | 'day' | 'night'
  const [themeMode, setThemeMode] = useState<'auto' | 'day' | 'night'>(() => {
    try {
      return (localStorage.getItem('amika_tv_theme_mode') as 'auto' | 'day' | 'night') || boardConfig.themeMode || 'auto';
    } catch {
      return boardConfig.themeMode || 'auto';
    }
  });

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
  const [_isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  const visibleSlides = boardConfig.slides.filter((s) => s.visible !== false);
  const slides = visibleSlides.length > 0 ? visibleSlides : boardConfig.slides;
  const visibleCoffeeItems = boardConfig.coffeeItems.filter((c) => c.visible !== false);
  const visibleDessertItems = boardConfig.dessertItems.filter((d) => d.visible !== false);

  const isDay = themeMode === 'day' ? true : themeMode === 'night' ? false : isDaytimeInCricova(currentTime);

  const triggerMelodicChime = () => {
    if (!soundEnabled) return;
    playMelodicChime();
  };

  const processedCmdIdsRef = useRef<Set<string>>(new Set());
  const lastFetchedUrlRef = useRef<string>('');

  const applyRemoteConfig = (cfg: TvBoardConfig, sourceLabel = 'Админ') => {
    if (!cfg || !Array.isArray(cfg.coffeeItems) || !Array.isArray(cfg.slides)) return;
    setBoardConfig(cfg);
    saveTvConfigLocal(cfg, true);
    if (cfg.themeMode && cfg.themeMode !== themeMode) {
      setThemeMode(cfg.themeMode);
    }
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
            saveTvConfigLocal(cfg, true);
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

    if (msg.type === 'SET_THEME' && typeof msg.theme === 'string') {
      const mode = msg.theme as 'auto' | 'day' | 'night';
      setThemeMode(mode);
      try {
        localStorage.setItem('amika_tv_theme_mode', mode);
      } catch {}
      setRemoteToast(
        mode === 'day' ? '☀️ Дневная тема' : mode === 'night' ? '🌙 Вечерняя тема' : '🌅 Авто-тема (по солнцу)'
      );
      return;
    } else if (msg.type === 'CONFIG_SUPABASE_SYNC') {
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
    } else if (msg.type === 'CHIME') {
      triggerMelodicChime();
      setRemoteToast(`🔔 ${source}: Мелодичный гонг`);
    }

    setTimeout(() => setRemoteToast(null), 3500);
  };

  // Clock ticker (Accounts for Moldova Winter Time / EET / UTC+2)
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
        setBoardConfig(cloudCfg);
        saveTvConfigLocal(cloudCfg, true);
        if (cloudCfg.themeMode) {
          setThemeMode(cloudCfg.themeMode);
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

  const cycleTheme = () => {
    setThemeMode((prev) => {
      const next = prev === 'auto' ? 'day' : prev === 'day' ? 'night' : 'auto';
      try {
        localStorage.setItem('amika_tv_theme_mode', next);
      } catch {}
      setRemoteToast(
        next === 'day' ? '☀️ Дневная тема (светлая)' : next === 'night' ? '🌙 Вечерняя тема (тёмная)' : '🌅 Авто-тема (по солнцу)'
      );
      setTimeout(() => setRemoteToast(null), 3000);
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        handleToggleFullscreen();
      } else if (e.key === 't' || e.key === 'T') {
        cycleTheme();
      } else if (e.key === 'ArrowRight' && slides.length > 0) {
        setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
      } else if (e.key === 'ArrowLeft' && slides.length > 0) {
        setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
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

  const slideTitle = (activeSlide.title?.[lang] || '').trim();
  const slideSubtitle = (activeSlide.subtitle?.[lang] || '').trim();
  const slideDetails = (activeSlide.details?.[lang] || '').trim();
  const slideHasText = Boolean(slideTitle || slideSubtitle || slideDetails);

  const utcMs = currentTime.getTime();
  const offset = getMoldovaOffsetHours(utcMs);
  const moldovaDate = new Date(utcMs + offset * 3600000);
  const h = String(moldovaDate.getUTCHours()).padStart(2, '0');
  const m = String(moldovaDate.getUTCMinutes()).padStart(2, '0');
  const s = String(moldovaDate.getUTCSeconds()).padStart(2, '0');
  const formattedTime = `${h}:${m}:${s}`;

  const days_ro = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
  const days_ru = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const months_ro = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
  const months_ru = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const dayName = (lang === 'ro' ? days_ro : days_ru)[moldovaDate.getUTCDay()];
  const monthName = (lang === 'ro' ? months_ro : months_ru)[moldovaDate.getUTCMonth()];
  const formattedDate = `${dayName}, ${moldovaDate.getUTCDate()} ${monthName}`;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col overflow-hidden select-none font-sans transition-colors duration-500 bg-cover bg-center ${
        isDay ? 'text-stone-900 bg-[#f7f2ea]' : 'text-stone-100 bg-[#120f0d]'
      }`}
      style={{
        backgroundImage: `url(${baseUrl}${isDay ? 'tv_bg_day.jpg' : 'tv_bg_night.jpg'})`,
      }}
    >
      {/* FLASH SALE TOP MARQUEE */}
      {isFlashSaleActive && (
        <div className="bg-gradient-to-r from-rose-700 via-amber-600 to-rose-700 text-white px-6 py-2 flex items-center justify-between shadow-2xl animate-pulse shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-1 rounded-lg bg-black/30">
              <Flame className="w-5 h-5 text-amber-300 animate-bounce" />
            </span>
            <span className="font-black text-sm md:text-base tracking-wider uppercase font-serif">
              {lang === 'ro'
                ? '🔥 FLASH SALE DE SEARĂ: -30% LA TOATĂ VITRINA DE DESERTURI FOODBERRY PÂNĂ LA ÎNCHIDERE!'
                : '🔥 ВЕЧЕРНЯЯ FLASH-РАСПРОДАЖА: -30% НА ВСЮ ВИТРИНУ ДЕСЕРТОВ FOODBERRY ДО ЗАКРЫТИЯ!'}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono font-bold text-xs bg-black/40 px-3 py-1 rounded-full border border-amber-300/40">
            <span>{lang === 'ro' ? 'Închidere la 21:00' : 'До закрытия в 21:00'}</span>
          </div>
        </div>
      )}

      {/* TOP HEADER BAR */}
      <header
        className={`px-6 py-2.5 flex items-center justify-between shrink-0 transition-colors duration-500 border-b ${
          isDay
            ? 'bg-[#fffdf9]/75 border-amber-900/10 backdrop-blur-md'
            : 'bg-stone-900/85 border-stone-800/80 backdrop-blur-md'
        }`}
      >
        {/* Brand Block */}
        <div className="flex items-center gap-3">
          <img
            src={`${baseUrl}amika_logo_round.png`}
            alt="Amika Logo"
            className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-500/60 shadow-md shadow-amber-950/20"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1
                className={`text-2xl font-black font-serif tracking-tight ${
                  isDay ? 'text-stone-900' : 'text-white'
                }`}
              >
                Amika CAFÈ
              </h1>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                  isDay
                    ? 'bg-[#556b2f]/14 text-[#556b2f] border border-[#556b2f]/35'
                    : 'bg-[#9bb155]/20 text-[#9bb155] border border-[#9bb155]/40'
                }`}
              >
                Specialty Coffee
              </span>
            </div>
            <p
              className={`text-[11px] font-semibold tracking-wide ${
                isDay ? 'text-stone-600' : 'text-stone-400'
              }`}
            >
              or. Cricova • str. Drumul Viilor 10
            </p>
          </div>
        </div>

        {/* Center Slogan */}
        <div
          className={`hidden md:block font-serif text-xs lg:text-sm font-bold tracking-[0.18em] uppercase ${
            isDay ? 'text-stone-600' : 'text-stone-400'
          }`}
        >
          GOOD COFFEE • GOOD MOOD • AMIKA CAFÉ ♡
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-2.5">
          {remoteToast && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-900/90 text-indigo-200 border border-indigo-400 text-xs font-bold shadow-lg">
              <Sparkles className="w-3 h-3 text-indigo-400 animate-spin" />
              <span>{remoteToast}</span>
            </div>
          )}

          <div
            className={`hidden lg:flex items-center gap-2 text-right px-3.5 py-1 rounded-xl border ${
              isDay
                ? 'bg-white/80 border-amber-900/15 text-stone-800'
                : 'bg-stone-950/60 border-stone-800 text-stone-300'
            }`}
          >
            <Clock className="w-4 h-4 text-[#74873f] shrink-0" />
            <div>
              <div
                className={`text-xl font-black font-mono tracking-tight leading-none ${
                  isDay ? 'text-[#556b2f]' : 'text-[#9bb155]'
                }`}
              >
                {formattedTime}
              </div>
              <div
                className={`text-[10px] capitalize font-medium ${
                  isDay ? 'text-[#6e7d4a]' : 'text-[#82944b]'
                }`}
              >
                {formattedDate}
              </div>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isDay
                ? 'bg-white/80 border-amber-900/15 text-stone-600 hover:text-stone-900'
                : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-500" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={handleToggleFullscreen}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isDay
                ? 'bg-white/80 border-amber-900/15 text-stone-600 hover:text-stone-900'
                : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
            }`}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4 text-amber-500" />
            )}
          </button>

          <button
            onClick={onExitTvMode}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
              isDay
                ? 'bg-white/80 border-amber-900/15 text-stone-700 hover:bg-rose-50 hover:text-rose-700'
                : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-rose-950/60 hover:text-rose-300'
            }`}
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">{lang === 'ro' ? 'Ieșire' : 'Назад'}</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA: 2 MENU COLUMNS + 9:16 INSTAGRAM VERTICAL SHOWCASE */}
      <main className="flex-1 flex gap-5 p-5 overflow-hidden min-h-0">
        {/* ================= LEFT SECTION: 2 DIGITAL MENU COLUMNS ================= */}
        <section className="flex-1 flex gap-4 overflow-hidden min-w-0">
          {/* COLUMN 1: SPECIALTY COFFEE WITH ILLY BADGE */}
          <div
            className={`flex-1 rounded-3xl border p-4 flex flex-col justify-between shadow-xl transition-colors duration-500 overflow-hidden ${
              isDay
                ? 'bg-[#fbf1e0]/95 border-amber-900/20 text-stone-900 shadow-stone-900/5'
                : 'bg-stone-900/85 border-stone-800/80 text-stone-100 shadow-black/40'
            }`}
          >
            <div className="flex-1 flex flex-col overflow-hidden">
              <div
                className={`flex items-center justify-between pb-3 mb-2 border-b shrink-0 ${
                  isDay ? 'border-amber-900/10' : 'border-stone-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-serif font-black italic text-xs tracking-tight shadow">
                    illy
                  </span>
                  <h2
                    className={`font-extrabold text-base tracking-wide uppercase font-serif ${
                      isDay ? 'text-stone-900' : 'text-white'
                    }`}
                  >
                    {(boardConfig.coffeeHeader?.[lang] || '').trim() ||
                      (boardConfig.coffeeHeader?.[lang === 'ro' ? 'ru' : 'ro'] || '').trim()}
                  </h2>
                </div>
                {(boardConfig.coffeeBadge || '').trim() && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isDay
                        ? 'text-amber-800 bg-amber-500/15 border-amber-500/30'
                        : 'text-amber-400 bg-amber-950/60 border-amber-500/20'
                    }`}
                  >
                    {boardConfig.coffeeBadge.trim()}
                  </span>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                {visibleCoffeeItems.map((item) => {
                  const matchingProd = boardConfig.storeProducts?.find((p) => p.id === item.id);
                  const resolvedVol = matchingProd
                    ? (matchingProd.volume && matchingProd.secondVolume
                        ? `${matchingProd.volume} / ${matchingProd.secondVolume}`
                        : matchingProd.volume || '')
                    : (item.volume || '');
                  const cleanedVol = resolvedVol.replace(/\s*\/\s*$/, '').trim();
                  const itemBadgeText = item.badge
                    ? (item.badge[lang] || '').trim() ||
                      (item.badge[lang === 'ro' ? 'ru' : 'ro'] || '').trim()
                    : '';
                  const noteText = (item.notes?.[lang] || '').trim();
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between py-1.5 px-2 rounded-2xl transition group ${
                        isDay ? 'hover:bg-amber-50/60' : 'hover:bg-stone-800/50'
                      }`}
                    >
                      <div className="pr-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-black tracking-tight leading-tight transition ${
                              visibleCoffeeItems.length >= 8
                                ? 'text-sm xl:text-base 2xl:text-lg'
                                : 'text-base xl:text-lg 2xl:text-xl'
                            } ${isDay ? 'text-stone-900 group-hover:text-amber-800' : 'text-white group-hover:text-amber-300'}`}
                          >
                            {(item.name?.[lang] || '').trim() ||
                              (item.name?.[lang === 'ro' ? 'ru' : 'ro'] || '').trim()}
                          </span>
                          {itemBadgeText && (
                            <span
                              className={`text-[10px] xl:text-xs font-black px-2 py-0.5 rounded-md border ${
                                isDay
                                  ? 'bg-amber-500/15 text-amber-800 border-amber-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              {itemBadgeText}
                            </span>
                          )}
                          {cleanedVol && (
                            <span
                              className={`text-xs xl:text-sm font-mono font-semibold ${
                                isDay ? 'text-stone-500' : 'text-stone-400'
                              }`}
                            >
                              {cleanedVol}
                            </span>
                          )}
                        </div>
                        {noteText && (
                          <p
                            className={`text-xs xl:text-sm font-medium line-clamp-1 mt-0.5 ${
                              isDay ? 'text-stone-600' : 'text-stone-300/90'
                            }`}
                          >
                            {noteText}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-lg xl:text-2xl font-black font-mono tracking-tight whitespace-nowrap ${
                            isDay ? 'text-stone-900' : 'text-[#9bb155]'
                          }`}
                        >
                          {item.secondPrice ? `${item.price} / ${item.secondPrice}` : item.price}{' '}
                          <span
                            className={`text-xs xl:text-sm font-bold ${
                              isDay ? 'text-stone-500' : 'text-[#c5d88f]'
                            }`}
                          >
                            MDL
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {((boardConfig.coffeeFooterNote?.[lang] || '').trim() ||
              (boardConfig.coffeeFooterPrice || '').trim()) && (
              <div
                className={`pt-2 mt-1 border-t flex items-center justify-between text-[11px] font-medium shrink-0 ${
                  isDay ? 'border-amber-900/10 text-stone-600' : 'border-stone-800/60 text-stone-400'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className={isDay ? 'text-[#556b2f]' : 'text-[#9bb155]'}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                    </svg>
                  </span>
                  <span>{(boardConfig.coffeeFooterNote?.[lang] || '').trim()}</span>
                </span>
                {(boardConfig.coffeeFooterPrice || '').trim() && (
                  <span
                    className={`font-mono font-bold ${
                      isDay ? 'text-stone-900' : 'text-[#9bb155]'
                    }`}
                  >
                    {boardConfig.coffeeFooterPrice.trim()}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* COLUMN 2: TEA & WARM DRINKS / DESSERTS */}
          <div
            className={`flex-1 rounded-3xl border p-4 flex flex-col justify-between shadow-xl transition-colors duration-500 overflow-hidden ${
              isFlashSaleActive
                ? 'bg-gradient-to-br from-rose-950/40 via-stone-900/80 to-amber-950/40 border-rose-500/50 shadow-rose-950/40 ring-1 ring-rose-500/40'
                : isDay
                ? 'bg-[#fbf1e0]/95 border-amber-900/20 text-stone-900 shadow-stone-900/5'
                : 'bg-stone-900/85 border-stone-800/80 text-stone-100 shadow-black/40'
            }`}
          >
            <div className="flex-1 flex flex-col overflow-hidden">
              <div
                className={`flex items-center justify-between pb-3 mb-2 border-b shrink-0 ${
                  isDay ? 'border-amber-900/10' : 'border-stone-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`p-1.5 rounded-xl ${
                      isFlashSaleActive
                        ? 'bg-rose-500/30 text-rose-300'
                        : isDay
                        ? 'bg-emerald-500/15 text-emerald-800'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h2
                    className={`font-extrabold text-base tracking-wide uppercase font-serif ${
                      isDay ? 'text-stone-900' : 'text-white'
                    }`}
                  >
                    {(boardConfig.dessertHeader?.[lang] || '').trim() ||
                      (boardConfig.dessertHeader?.[lang === 'ro' ? 'ru' : 'ro'] || '').trim()}
                  </h2>
                </div>

                {isFlashSaleActive ? (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse shadow-md">
                    -30% REDUCERE
                  </span>
                ) : (boardConfig.dessertBadge || '').trim() ? (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isDay
                        ? 'text-emerald-800 bg-emerald-500/15 border-emerald-500/30'
                        : 'text-emerald-400 bg-emerald-950/60 border-emerald-500/20'
                    }`}
                  >
                    {boardConfig.dessertBadge.trim()}
                  </span>
                ) : null}
              </div>

              <div
                className={`flex-1 flex flex-col overflow-hidden ${
                  visibleDessertItems.length >= 6 ? 'justify-between' : 'justify-start space-y-3'
                }`}
              >
                {visibleDessertItems.map((item) => {
                  const matchingProd = boardConfig.storeProducts?.find((p) => p.id === item.id);
                  const resolvedVol = matchingProd
                    ? (matchingProd.volume && matchingProd.secondVolume
                        ? `${matchingProd.volume} / ${matchingProd.secondVolume}`
                        : matchingProd.volume || '')
                    : (item.volume || '');
                  const cleanedVol = resolvedVol.replace(/\s*\/\s*$/, '').trim();
                  const itemBadgeText = item.badge
                    ? (item.badge[lang] || '').trim() ||
                      (item.badge[lang === 'ro' ? 'ru' : 'ro'] || '').trim()
                    : '';
                  const descText = (item.desc?.[lang] || '').trim();
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between py-1.5 px-2 rounded-2xl transition group ${
                        isDay ? 'hover:bg-amber-50/60' : 'hover:bg-stone-800/50'
                      }`}
                    >
                      <div className="pr-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-black tracking-tight leading-tight transition ${
                              visibleDessertItems.length >= 8
                                ? 'text-sm xl:text-base 2xl:text-lg'
                                : 'text-base xl:text-lg 2xl:text-xl'
                            } ${isDay ? 'text-stone-900 group-hover:text-amber-800' : 'text-white group-hover:text-amber-300'}`}
                          >
                            {(item.name?.[lang] || '').trim() ||
                              (item.name?.[lang === 'ro' ? 'ru' : 'ro'] || '').trim()}
                          </span>
                          {itemBadgeText && !isFlashSaleActive && (
                            <span
                              className={`text-[10px] xl:text-xs font-black px-2 py-0.5 rounded-md border ${
                                isDay
                                  ? 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              }`}
                            >
                              {itemBadgeText}
                            </span>
                          )}
                          {cleanedVol && (
                            <span
                              className={`text-xs xl:text-sm font-mono font-semibold ${
                                isDay ? 'text-stone-500' : 'text-stone-400'
                              }`}
                            >
                              {cleanedVol}
                            </span>
                          )}
                        </div>
                        {descText && (
                          <p
                            className={`text-xs xl:text-sm font-medium line-clamp-1 mt-0.5 ${
                              isDay ? 'text-stone-600' : 'text-stone-300/90'
                            }`}
                          >
                            {descText}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        {isFlashSaleActive ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm xl:text-base text-stone-500 line-through font-mono">
                              {item.price}
                            </span>
                            <span className="text-lg xl:text-2xl font-black text-rose-500 font-mono animate-bounce">
                              {item.discountPrice}{' '}
                              <span className="text-xs xl:text-sm font-bold text-rose-400">L</span>
                            </span>
                          </div>
                        ) : (
                          <span
                            className={`text-lg xl:text-2xl font-black font-mono tracking-tight whitespace-nowrap ${
                              isDay ? 'text-stone-900' : 'text-[#9bb155]'
                            }`}
                          >
                            {item.secondPrice ? `${item.price} / ${item.secondPrice}` : item.price}{' '}
                            <span
                              className={`text-xs xl:text-sm font-bold ${
                                isDay ? 'text-stone-500' : 'text-[#c5d88f]'
                              }`}
                            >
                              MDL
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {((boardConfig.dessertFooterNote?.[lang] || '').trim() ||
              (boardConfig.dessertFooterBrand || '').trim()) && (
              <div
                className={`pt-2 mt-1 border-t flex items-center justify-between text-[11px] font-medium shrink-0 ${
                  isDay ? 'border-amber-900/10 text-stone-600' : 'border-stone-800/60 text-stone-400'
                }`}
              >
                {(boardConfig.dessertFooterNote?.[lang] || '').trim() ? (
                  <span className={`flex items-center gap-1 ${isDay ? 'text-emerald-800' : 'text-emerald-300'}`}>
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    <span>{boardConfig.dessertFooterNote[lang].trim()}</span>
                  </span>
                ) : (
                  <span />
                )}
                {(boardConfig.dessertFooterBrand || '').trim() && (
                  <span className={`font-bold ${isDay ? 'text-stone-800' : 'text-emerald-400'}`}>
                    {boardConfig.dessertFooterBrand.trim()}
                  </span>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ================= RIGHT SECTION: 9:16 INSTAGRAM VERTICAL SHOWCASE ================= */}
        <section
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className={`w-[540px] shrink-0 flex flex-col rounded-3xl overflow-hidden border shadow-2xl relative group transition-colors duration-500 ${
            isDay
              ? 'bg-[#fbf1e0]/95 border-amber-900/20 shadow-stone-900/10'
              : 'bg-stone-900/85 border-stone-800 shadow-black/50'
          }`}
        >
          {/* Progress bar at top of slider */}
          <div className="flex gap-1.5 p-3 absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-black/60 to-transparent">
            {slides.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1 rounded-full overflow-hidden bg-white/30 backdrop-blur-sm cursor-pointer"
                onClick={() => setCurrentSlideIndex(i)}
              >
                <div
                  className={`h-full ${isDay ? 'bg-[#6e8438]' : 'bg-[#9bb155]'} transition-all duration-300 ${
                    i <= safeSlideIdx ? 'w-full' : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="relative flex-1 overflow-hidden bg-black">
            <img
              src={activeSlideImgSrc}
              alt={activeSlide.title[lang] || 'Amika Showcase'}
              className="w-full h-full object-cover object-center transform scale-100 transition-transform duration-1000 ease-out"
            />

            {/* Only show dark gradient and text overlay when there is actual text to display */}
            {slideHasText && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                {(activeSlide.badge?.[lang] || '').trim() && (
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
                )}

                <div className="absolute bottom-0 inset-x-0 p-6 z-10 space-y-2 pointer-events-none">
                  {slideTitle && (
                    <h3 className="text-2xl font-black text-white font-serif leading-tight drop-shadow-md">
                      {slideTitle}
                    </h3>
                  )}
                  {slideSubtitle && (
                    <p className="text-sm font-semibold text-amber-200/95 leading-snug drop-shadow">
                      {slideSubtitle}
                    </p>
                  )}
                  {slideDetails && (
                    <p className="text-xs text-stone-200/90 leading-relaxed drop-shadow line-clamp-2">
                      {slideDetails}
                    </p>
                  )}
                </div>
              </>
            )}

            <button
              onClick={() =>
                setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length)
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-950/60 text-white/70 hover:text-white hover:bg-stone-900 border border-white/10 transition backdrop-blur-sm opacity-0 group-hover:opacity-100 active:scale-95 z-20 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % slides.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-950/60 text-white/70 hover:text-white hover:bg-stone-900 border border-white/10 transition backdrop-blur-sm opacity-0 group-hover:opacity-100 active:scale-95 z-20 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TvMenuBoard;
