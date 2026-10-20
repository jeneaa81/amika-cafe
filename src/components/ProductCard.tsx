import { Plus, SlidersHorizontal } from 'lucide-react';
import type { Product, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface ProductCardProps {
  product: Product;
  language: Language;
  onSelect: (product: Product) => void;
  quantityInCart: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  language,
  onSelect,
  quantityInCart,
}) => {
  const t = TRANSLATIONS[language];
  const hasOptions = !!(product.options?.milk || product.options?.syrup || product.options?.temperature);

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative bg-stone-900/90 rounded-2xl border border-stone-800/80 hover:border-amber-500/50 overflow-hidden shadow-lg hover:shadow-amber-950/20 transition-all duration-300 flex flex-col cursor-pointer active:scale-[0.98]"
    >
      {/* Product Image */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-950">
        <img
          src={product.image}
          alt={product.name[language]}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/20 to-transparent"></div>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          {product.badge && (
            <span
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-sm ${
                product.isFoodberry
                  ? 'bg-rose-950/90 text-rose-300 border border-rose-500/40 backdrop-blur-sm'
                  : 'bg-amber-600/90 text-amber-100 border border-amber-500/40 backdrop-blur-sm'
              }`}
            >
              {product.badge[language]}
            </span>
          )}
        </div>

        {/* Volume tag if any */}
        {product.volume && (
          <span className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-900/80 text-stone-300 border border-stone-700/50 backdrop-blur-sm">
            {product.volume}
          </span>
        )}

        {/* In-cart indicator badge */}
        {quantityInCart > 0 && (
          <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-emerald-500 text-stone-950 font-black text-xs flex items-center justify-center shadow-lg ring-2 ring-stone-900">
            {quantityInCart}
          </span>
        )}
      </div>

      {/* Info Body */}
      <div className="p-3.5 flex flex-col justify-between flex-1 gap-2">
        <div>
          <h3 className="font-bold text-sm text-stone-100 group-hover:text-amber-400 transition-colors leading-snug">
            {product.name[language]}
          </h3>
          <p className="text-stone-400 text-xs line-clamp-2 mt-1 leading-relaxed">
            {product.description[language]}
          </p>
        </div>

        {/* Price & Add Action */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-800/80 mt-auto">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-extrabold text-amber-400">
              {product.price}
            </span>
            <span className="text-[11px] font-semibold text-stone-400">
              {t.mdl}
            </span>
          </div>

          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-500 text-amber-400 hover:text-stone-950 border border-amber-500/40 text-xs font-bold transition-all duration-200 active:scale-95"
          >
            {hasOptions ? (
              <>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{t.customize}</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t.addToCart}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
