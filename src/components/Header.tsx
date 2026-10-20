import { Coffee, MapPin, Sparkles, User, ShieldCheck } from 'lucide-react';
import type { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isBaristaMode: boolean;
  onToggleBaristaMode: () => void;
  onOpenLoyalty: () => void;
  stampsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  isBaristaMode,
  onToggleBaristaMode,
  onOpenLoyalty,
  stampsCount,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <header className="sticky top-0 z-30 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-stone-100 px-4 py-3 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 flex items-center justify-center text-white shadow-md shadow-amber-900/30 ring-1 ring-amber-500/30">
            <Coffee className="w-5 h-5 text-amber-100" />
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
        <div className="flex items-center gap-1.5">
          {/* Loyalty quick pill */}
          {!isBaristaMode && (
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

          {/* Barista Mode Switch */}
          <button
            onClick={onToggleBaristaMode}
            className={`p-2 rounded-xl border transition active:scale-95 ${
              isBaristaMode
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/30'
                : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
            }`}
            title={isBaristaMode ? t.roleBarista : t.roleClient}
          >
            {isBaristaMode ? (
              <ShieldCheck className="w-4 h-4 text-emerald-200" />
            ) : (
              <User className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Sub-bar indicator */}
      <div className="max-w-md mx-auto mt-2 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>{t.openStatus}</span>
        </div>
        <div className="text-stone-400 font-medium">
          {isBaristaMode ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {t.roleBarista}
            </span>
          ) : (
            <span>Партнер Foodberry Bakery</span>
          )}
        </div>
      </div>
    </header>
  );
};
