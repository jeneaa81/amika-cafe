import { useState } from 'react';
import { X, Sparkles, Coffee, QrCode, CheckCircle2, RotateCcw, Award } from 'lucide-react';
import type { Language, LoyaltyCard } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface LoyaltyModalProps {
  language: Language;
  onClose: () => void;
  loyaltyCard: LoyaltyCard;
  onAddStamp: () => void;
  onResetCard: () => void;
}

export const LoyaltyModal: React.FC<LoyaltyModalProps> = ({
  language,
  onClose,
  loyaltyCard,
  onAddStamp,
  onResetCard,
}) => {
  const t = TRANSLATIONS[language];
  const isComplete = loyaltyCard.currentStamps >= 6;
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSimulateStamp = () => {
    onAddStamp();
    try {
      const tg = (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred: (s: string) => void; notificationOccurred: (s: string) => void } } } }).Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        if (loyaltyCard.currentStamps + 1 >= 6) {
          tg.HapticFeedback.notificationOccurred('success');
        } else {
          tg.HapticFeedback.impactOccurred('medium');
        }
      }
    } catch {
      // ignore
    }
    setToastMessage(t.stampAddedToast);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative max-h-[92vh]">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="absolute top-4 left-4 right-4 z-20 bg-emerald-600 text-white px-3.5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-3">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="p-5 bg-gradient-to-br from-amber-950/80 via-stone-900 to-stone-900 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-serif">
                {t.loyaltyTitle}
              </h3>
              <p className="text-[11px] text-amber-400 font-semibold tracking-wide">
                AMIKA VIP • {loyaltyCard.cardNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-stone-800/80 text-stone-400 hover:text-white border border-stone-700/60 transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Main Stamp Card Container */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-stone-800 via-stone-850 to-stone-900 border border-amber-500/30 shadow-xl relative overflow-hidden">
            {/* Subtle Coffee Bean / Cup Background Pattern */}
            <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none text-white">
              <Coffee className="w-44 h-44" />
            </div>

            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 block">
                  {t.qrLabel}
                </span>
                <span className="text-sm font-bold text-white">
                  6-a cafea este CADOU
                </span>
              </div>
              <div className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-black">
                {loyaltyCard.currentStamps} / 6
              </div>
            </div>

            {/* 6 Stamps Grid */}
            <div className="grid grid-cols-3 gap-3 my-4">
              {[1, 2, 3, 4, 5, 6].map((slot) => {
                const isCollected = slot <= loyaltyCard.currentStamps;
                const isSixth = slot === 6;

                return (
                  <div
                    key={slot}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 relative transition-all duration-300 border ${
                      isCollected
                        ? isSixth
                          ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 border-amber-300 shadow-lg shadow-amber-500/30 scale-105'
                          : 'bg-amber-600 text-stone-950 border-amber-400 shadow-md shadow-amber-900/30'
                        : 'bg-stone-900/80 text-stone-600 border-stone-700/60 border-dashed'
                    }`}
                  >
                    {isCollected ? (
                      <>
                        <Coffee className="w-6 h-6 stroke-[2.2] animate-in zoom-in duration-300" />
                        <span className="text-[10px] font-black mt-1">
                          {isSixth ? 'FREE! 🎁' : `#${slot}`}
                        </span>
                      </>
                    ) : (
                      <>
                        <Coffee className="w-5 h-5 opacity-40" />
                        <span className="text-[10px] font-semibold text-stone-500 mt-1">
                          {isSixth ? 'Cadou' : `#${slot}`}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Status Message */}
            <div className="mt-4 pt-3 border-t border-stone-700/60 text-center">
              {isComplete ? (
                <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-200">
                  <div className="flex items-center justify-center gap-1.5 font-bold text-xs text-amber-300">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>{t.loyaltyCongrats}</span>
                  </div>
                  <div className="mt-1.5 text-xs font-mono bg-stone-900/80 py-1 px-3 rounded-lg inline-block text-white font-bold border border-amber-500/30">
                    AMIKA-FREE-{loyaltyCard.cardNumber.slice(-4)}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-300 font-medium">
                  Mai ai nevoie de{' '}
                  <span className="text-amber-400 font-bold">
                    {6 - loyaltyCard.currentStamps}
                  </span>{' '}
                  cafele pentru băutura gratuită!
                </p>
              )}
            </div>
          </div>

          {/* QR Code Presentation */}
          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 text-center flex flex-col items-center">
            <p className="text-xs text-stone-400 mb-3">{t.scanHint}</p>

            {/* Visual Simulated QR */}
            <div className="w-40 h-40 bg-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-xl ring-4 ring-amber-500/20 relative">
              <div className="w-full h-full bg-stone-100 rounded-lg flex items-center justify-center text-stone-900 p-2">
                <QrCode className="w-28 h-28 text-stone-900" />
              </div>
              <span className="text-[9px] font-mono text-stone-700 mt-1 font-bold">
                {loyaltyCard.cardNumber}
              </span>
            </div>
          </div>

          {/* Barista Simulation Trigger (Key for pitching!) */}
          <div className="p-3.5 rounded-2xl bg-amber-600/10 border border-amber-500/30 text-stone-200">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide block mb-1">
              {language === 'ro' ? 'Instrument de prezentare pentru proprietar:' : 'Инструмент показа для владельца:'}
            </span>
            <p className="text-xs text-stone-300 mb-3 leading-relaxed">
              {language === 'ro'
                ? 'Arată-i proprietarului cât de rapid adaugă barmanul o ștampilă la casă fără cartele de carton:'
                : 'Покажите владельцу, как бариста в 1 клик начисляет чашку без возни с бумажными штампами:'}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSimulateStamp}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t.simulateBaristaStamp}</span>
              </button>

              {loyaltyCard.currentStamps > 0 && (
                <button
                  type="button"
                  onClick={onResetCard}
                  className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-white border border-stone-700 transition"
                  title="Resetează"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
