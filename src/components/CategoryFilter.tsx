import { Sparkles, Coffee, Cake, CupSoda, Utensils } from 'lucide-react';
import type { Category, Language } from '../types';
import { CATEGORIES } from '../data/categories';

interface CategoryFilterProps {
  activeCategory: Category;
  onSelectCategory: (category: Category) => void;
  language: Language;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-4 h-4" />,
  Coffee: <Coffee className="w-4 h-4" />,
  Cake: <Cake className="w-4 h-4" />,
  CupSoda: <CupSoda className="w-4 h-4" />,
  Utensils: <Utensils className="w-4 h-4" />,
};

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  activeCategory,
  onSelectCategory,
  language,
}) => {
  return (
    <div className="w-full overflow-x-auto scrollbar-none py-2 px-4">
      <div className="flex gap-2 min-w-max max-w-md mx-auto">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 border ${
                isActive
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-900/40 ring-1 ring-amber-400/40'
                  : 'bg-stone-800/80 text-stone-300 border-stone-700/60 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <span className={isActive ? 'text-amber-100' : 'text-amber-500'}>
                {ICON_MAP[cat.icon]}
              </span>
              <span>{cat.name[language]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
