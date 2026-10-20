import { useState } from 'react';
import { X, Check, Plus } from 'lucide-react';
import type { Product, Language, CartItemOption } from '../types';
import { MILK_OPTIONS, SYRUP_OPTIONS } from '../data/products';
import { TRANSLATIONS } from '../data/translations';

interface ProductCustomizerModalProps {
  product: Product;
  language: Language;
  onClose: () => void;
  onAddToCart: (product: Product, options: CartItemOption, unitPrice: number) => void;
}

export const ProductCustomizerModal: React.FC<ProductCustomizerModalProps> = ({
  product,
  language,
  onClose,
  onAddToCart,
}) => {
  const t = TRANSLATIONS[language];
  const [selectedMilk, setSelectedMilk] = useState<string>('regular');
  const [selectedSyrup, setSelectedSyrup] = useState<string>('none');
  const [temperature, setTemperature] = useState<'hot' | 'iced'>('hot');

  // Calculate dynamic price
  const milkExtra = MILK_OPTIONS.find((m) => m.id === selectedMilk)?.extraPrice || 0;
  const syrupExtra = SYRUP_OPTIONS.find((s) => s.id === selectedSyrup)?.extraPrice || 0;
  const unitPrice = product.price + milkExtra + syrupExtra;

  const handleAdd = () => {
    onAddToCart(
      product,
      {
        milk: product.options?.milk ? selectedMilk : undefined,
        syrup: product.options?.syrup ? selectedSyrup : undefined,
        temperature: product.options?.temperature ? temperature : undefined,
      },
      unitPrice
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Image */}
        <div className="relative h-48 w-full bg-stone-950 shrink-0">
          <img
            src={product.image}
            alt={product.name[language]}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent"></div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-stone-900/80 text-stone-300 hover:text-white border border-stone-700/60 transition active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-600 text-white shadow-sm mb-1">
                {product.badge ? product.badge[language] : 'Specialty'}
              </span>
              <h3 className="text-xl font-bold text-white font-serif leading-tight">
                {product.name[language]}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-400">
                {unitPrice} <span className="text-sm font-semibold text-stone-300">{t.mdl}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Content options */}
        <div className="p-4 overflow-y-auto space-y-4">
          <p className="text-xs text-stone-300 leading-relaxed">
            {product.description[language]}
          </p>

          {/* Temperature Choice */}
          {product.options?.temperature && (
            <div className="space-y-1.5 pt-2 border-t border-stone-800">
              <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                {t.temperatureChoice}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTemperature('hot')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    temperature === 'hot'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                      : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-750'
                  }`}
                >
                  <span>{t.hot}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTemperature('iced')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    temperature === 'iced'
                      ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                      : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-750'
                  }`}
                >
                  <span>{t.iced}</span>
                </button>
              </div>
            </div>
          )}

          {/* Milk Options */}
          {product.options?.milk && (
            <div className="space-y-1.5 pt-2 border-t border-stone-800">
              <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                {t.milkChoice}
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {MILK_OPTIONS.map((milk) => {
                  const isSelected = selectedMilk === milk.id;
                  return (
                    <button
                      key={milk.id}
                      type="button"
                      onClick={() => setSelectedMilk(milk.id)}
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
                        isSelected
                          ? 'bg-amber-600/20 text-amber-200 border-amber-500/80 ring-1 ring-amber-500/40'
                          : 'bg-stone-800/60 text-stone-300 border-stone-700/60 hover:bg-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-amber-400 bg-amber-500 text-stone-900'
                              : 'border-stone-600'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span>{milk.name[language]}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-stone-400">
                        {milk.extraPrice > 0 ? `+${milk.extraPrice} ${t.mdl}` : 'Standard'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Syrup Options */}
          {product.options?.syrup && (
            <div className="space-y-1.5 pt-2 border-t border-stone-800">
              <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                {t.syrupChoice}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {SYRUP_OPTIONS.map((syrup) => {
                  const isSelected = selectedSyrup === syrup.id;
                  return (
                    <button
                      key={syrup.id}
                      type="button"
                      onClick={() => setSelectedSyrup(syrup.id)}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition ${
                        isSelected
                          ? 'bg-amber-600/20 text-amber-200 border-amber-500/80 ring-1 ring-amber-500/40'
                          : 'bg-stone-800/60 text-stone-300 border-stone-700/60 hover:bg-stone-800'
                      }`}
                    >
                      <span className="truncate">{syrup.name[language]}</span>
                      {syrup.extraPrice > 0 && (
                        <span className="text-[10px] text-amber-400 font-bold shrink-0 ml-1">
                          +{syrup.extraPrice}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="p-4 bg-stone-950/80 border-t border-stone-800 mt-auto">
          <button
            onClick={handleAdd}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 transition active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>
              {t.btnConfirmAdd} {unitPrice} {t.mdl}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
