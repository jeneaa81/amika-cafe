import { Coffee, Sparkles, ShoppingBag, ShieldCheck } from 'lucide-react';
import type { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface BottomNavProps {
  activeTab: 'menu' | 'loyalty' | 'cart' | 'barista';
  onChangeTab: (tab: 'menu' | 'loyalty' | 'cart' | 'barista') => void;
  language: Language;
  cartCount: number;
  cartTotal: number;
  stampsCount: number;
  isBaristaMode: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  language,
  cartCount,
  cartTotal,
  stampsCount,
  isBaristaMode,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-stone-950/95 backdrop-blur-md border-t border-stone-800/90 py-2 px-4 shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Menu Tab */}
        <button
          onClick={() => onChangeTab('menu')}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 transition ${
            activeTab === 'menu' && !isBaristaMode
              ? 'text-amber-400 font-bold'
              : 'text-stone-400 hover:text-stone-200 font-medium'
          }`}
        >
          <Coffee className="w-5 h-5" />
          <span className="text-[11px]">{t.navMenu}</span>
        </button>

        {/* Loyalty Tab */}
        <button
          onClick={() => onChangeTab('loyalty')}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 relative transition ${
            activeTab === 'loyalty' && !isBaristaMode
              ? 'text-amber-400 font-bold'
              : 'text-stone-400 hover:text-stone-200 font-medium'
          }`}
        >
          <div className="relative">
            <Sparkles className="w-5 h-5" />
            <span className="absolute -top-1 -right-2 px-1 rounded-full bg-amber-600 text-stone-950 text-[9px] font-black">
              {stampsCount}/6
            </span>
          </div>
          <span className="text-[11px]">{t.navLoyalty}</span>
        </button>

        {/* Cart Tab */}
        <button
          onClick={() => onChangeTab('cart')}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 relative transition ${
            activeTab === 'cart'
              ? 'text-amber-400 font-bold'
              : 'text-stone-400 hover:text-stone-200 font-medium'
          }`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-emerald-500 text-stone-950 text-[10px] font-black animate-pulse">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[11px]">
            {cartCount > 0 ? `${cartTotal} ${t.mdl}` : t.navCart}
          </span>
        </button>

        {/* Barista Mode Tab */}
        <button
          onClick={() => onChangeTab('barista')}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 transition ${
            isBaristaMode
              ? 'text-emerald-400 font-bold'
              : 'text-stone-400 hover:text-stone-200 font-medium'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[11px]">{t.navBarista}</span>
        </button>
      </div>
    </div>
  );
};
