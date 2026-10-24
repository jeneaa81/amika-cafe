import { useState, useEffect } from 'react';
import { X, Sparkles, Coffee, QrCode, CheckCircle2, RotateCcw, Award } from 'lucide-react';
import QRCode from 'qrcode';
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
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!loyaltyCard.cardNumber) return;
    QRCode.toDataURL(loyaltyCard.cardNumber, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#1c1917',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.warn('QR gen error:', err));
  }, [loyaltyCard.cardNumber]);

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

          {/* Real Scannable Dynamic QR Code */}
          <div className="p-4 rounded-3xl bg-stone-950 border border-stone-800 text-center flex flex-col items-center space-y-3 shadow-xl">
            <p className="text-xs text-stone-400 font-medium">{t.scanHint}</p>

            <div className="relative p-2.5 bg-white rounded-2xl shadow-2xl ring-4 ring-amber-500/25">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR ${loyaltyCard.cardNumber}`}
                  className="w-44 h-44 object-contain rounded-lg block"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center bg-stone-100 rounded-lg text-stone-400">
                  <QrCode className="w-12 h-12 animate-pulse" />
                </div>
              )}
              {/* Corner targeting reticle styling */}
              <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 border-amber-500 rounded-tl pointer-events-none" />
              <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 border-amber-500 rounded-tr pointer-events-none" />
              <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-2 border-l-2 border-amber-500 rounded-bl pointer-events-none" />
              <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-2 border-r-2 border-amber-500 rounded-br pointer-events-none" />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="font-mono text-xs font-black text-amber-400 bg-stone-900 px-3 py-1 rounded-xl border border-stone-800 tracking-wider">
                {loyaltyCard.cardNumber}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Card Activ</span>
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
