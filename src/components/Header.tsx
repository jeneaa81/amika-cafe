import { useState, useEffect } from 'react';
import { MapPin, Sparkles, Tv, Settings } from 'lucide-react';
import type { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

export type AppViewMode = 'client' | 'barista' | 'admin';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  viewMode: AppViewMode;
  onChangeViewMode: (mode: AppViewMode) => void;
  onOpenLoyalty: () => void;
  onOpenTvMode: () => void;
  stampsCount: number;
}

// Check if cafe is currently open (08:00 - 21:00 local time)
function checkIsCafeOpen(now: Date): boolean {
  const hour = now.getHours();
  return hour >= 8 && hour < 21;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  viewMode,
  onChangeViewMode,
  onOpenLoyalty,
  onOpenTvMode,
  stampsCount,
}) => {
  const t = TRANSLATIONS[language];
  const baseUrl = import.meta.env.BASE_URL;

  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const isOpen = checkIsCafeOpen(now);
  const currentTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const openStatusLabel = isOpen
    ? language === 'ro'
      ? `Deschis acum (${currentTimeStr}) • 08:00 - 21:00`
      : `Открыто сейчас (${currentTimeStr}) • 08:00 - 21:00`
    : language === 'ro'
    ? `Închis acum (${currentTimeStr}) • Deschidem la 08:00`
    : `Сейчас закрыто (${currentTimeStr}) • Открытие в 08:00`;

  const containerWidthClass =
    viewMode === 'admin' || viewMode === 'barista' ? 'max-w-7xl' : 'max-w-md';

  return (
    <header className="sticky top-0 z-30 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-stone-100 px-4 py-3 shadow-lg transition-all">
      <div className={`${containerWidthClass} mx-auto flex items-center justify-between gap-2`}>
        {/* Brand with authentic Amika Café logo */}
        <div
          onClick={() => onChangeViewMode('client')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-amber-500/40 group-hover:ring-amber-400 shadow-md shadow-amber-950/40 shrink-0 transition">
            <img
              src={`${baseUrl}amika_logo_round.png`}
              alt="Amika Café"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white font-serif">
                {t.cafeName}
              </h1>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Specialty
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-stone-400 font-medium">
              <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
              <span>{t.locationShort}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {/* TV Screen Button */}
          <button
            onClick={onOpenTvMode}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-stone-800 hover:bg-amber-600/20 text-stone-300 hover:text-amber-400 border border-stone-700/80 text-xs font-semibold transition active:scale-95"
            title={language === 'ro' ? 'Mod Televizor / TV Menu Board' : 'Режим ТВ Меню-Борд'}
          >
            <Tv className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">TV</span>
          </button>

          {/* Loyalty quick pill */}
          {viewMode === 'client' && (
            <button
              onClick={onOpenLoyalty}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-semibold transition active:scale-95"
              title={t.loyaltyTitle}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{stampsCount}/6</span>
            </button>
          )}

          {/* Language Switcher */}
          <div className="flex bg-stone-800/90 rounded-xl p-0.5 border border-stone-700/60 text-xs font-semibold">
            <button
              onClick={() => onLanguageChange('ro')}
              className={`px-2 py-1 rounded-lg transition ${
                language === 'ro'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              RO
            </button>
            <button
              onClick={() => onLanguageChange('ru')}
              className={`px-2 py-1 rounded-lg transition ${
                language === 'ru'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              RU
            </button>
          </div>

          {/* Separate Admin Cabinet Button (Hidden in Barista mode per user request) */}
          {viewMode !== 'barista' && (
            <button
              onClick={() => onChangeViewMode(viewMode === 'admin' ? 'client' : 'admin')}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition active:scale-95 ${
                viewMode === 'admin'
                  ? 'bg-amber-600 text-stone-950 border-amber-400 shadow-md shadow-amber-900/30 font-extrabold'
                  : 'bg-stone-800 text-stone-300 border-stone-700 hover:text-white'
              }`}
              title={
                language === 'ro'
                  ? 'Cabinet Administrator (Editare Meniu & Foto)'
                  : 'Кабинет Администратора (Планшет / ПК)'
              }
            >
              <Settings
                className={`w-3.5 h-3.5 ${
                  viewMode === 'admin' ? 'text-stone-950' : 'text-amber-400'
                }`}
              />
              <span>{language === 'ro' ? 'Admin' : 'Админ'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-bar indicator with REAL-TIME Open/Closed status */}
      <div className={`${containerWidthClass} mx-auto mt-2 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px]`}>
        <div
          className={`flex items-center gap-1.5 font-medium ${
            isOpen ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOpen ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'
            }`}
          ></span>
          <span>{openStatusLabel}</span>
        </div>
        <div className="text-stone-400 font-medium">
          {viewMode === 'admin' ? (
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              {language === 'ro' ? 'Cabinet Administrator (Tabletă / PC)' : 'Кабинет Администратора (Планшет / ПК)'}
            </span>
          ) : viewMode === 'barista' ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {t.roleBarista}
            </span>
          ) : (
            <span>Partener Foodberry Bakery</span>
          )}
        </div>
      </div>
    </header>
  );
};
export default Header;
