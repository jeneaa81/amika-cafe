import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  Search,
  Coffee,
  Sparkles,
  Award,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Plus,
  RotateCcw,
} from 'lucide-react';
import type { Language, LoyaltyCard } from '../types';
import {
  fetchLoyaltyCardByCardNumber,
  fetchAllLoyaltyCardsFromSupabase,
  saveLoyaltyCardToSupabase,
} from '../utils/supabaseClient';
import { playMelodicChime } from '../utils/audio';

function playBeep(freq = 783.99) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch {}
}

interface BaristaLoyaltyScannerProps {
  language: Language;
}

export const BaristaLoyaltyScanner: React.FC<BaristaLoyaltyScannerProps> = ({ language }) => {
  const [activeCard, setActiveCard] = useState<LoyaltyCard | null>(null);
  const [recentCards, setRecentCards] = useState<LoyaltyCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualQuery, setManualQuery] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef<boolean>(false);

  // Load recent cards from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    fetchAllLoyaltyCardsFromSupabase().then((cards) => {
      if (isMounted && cards.length > 0) {
        setRecentCards(cards);
      }
    });
    return () => {
      isMounted = false;
      stopCamera();
    };
  }, []);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Extract clean card number from QR string or URL
  const extractCardNumber = (raw: string): string => {
    const match = raw.match(/AMIKA-[A-Za-z0-9_-]+/i);
    if (match) return match[0].toUpperCase();
    return raw.trim().toUpperCase();
  };

  // Handle scanned or searched card
  const handleProcessCardNumber = async (rawCode: string) => {
    const cardNumber = extractCardNumber(rawCode);
    if (!cardNumber) return;

    setIsLoading(true);
    setCameraError(null);
    try {
      let card = await fetchLoyaltyCardByCardNumber(cardNumber);
      if (!card) {
        // Search in recent local list
        const found = recentCards.find(
          (c) =>
            c.cardNumber.toUpperCase() === cardNumber ||
            c.cardNumber.toUpperCase().includes(cardNumber)
        );
        if (found) card = found;
      }

      if (card) {
        setActiveCard(card);
        playBeep(880);
        showToast(
          language === 'ro'
            ? `Card găsit: ${card.customerName || card.cardNumber}`
            : `Карта найдена: ${card.customerName || card.cardNumber}`
        );
      } else {
        // If not found in DB, offer to register on-the-fly
        const newCard: LoyaltyCard = {
          cardNumber,
          telegramUserId: 0,
          customerName: language === 'ro' ? 'Oaspete VIP' : 'Гость VIP',
          currentStamps: 0,
          totalFreeCoffeesEarned: 0,
          lastUpdated: new Date().toISOString(),
        };
        setActiveCard(newCard);
        await saveLoyaltyCardToSupabase(newCard);
        showToast(
          language === 'ro'
            ? `Card nou activat: ${cardNumber}`
            : `Новая карта активирована: ${cardNumber}`
        );
      }
    } catch (err) {
      console.warn('Error fetching loyalty card:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Camera Management
  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('barista-qr-box');
      }

      if (isScanningRef.current) {
        await scannerRef.current.stop();
        isScanningRef.current = false;
      }

      await scannerRef.current.start(
        { facingMode: facing },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Success Callback
          handleProcessCardNumber(decodedText);
        },
        () => {
          // Frame scan error (ignore normal no-code frames)
        }
      );

      isScanningRef.current = true;
      setIsCameraActive(true);
      setCameraFacing(facing);
    } catch (err: unknown) {
      console.warn('Camera start error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setCameraError(
        language === 'ro'
          ? `Nu s-a putut porni camera (${errMsg}). Verificați permisiunile camerei în browser sau introduceți numărul cardului manual.`
          : `Не удалось включить камеру (${errMsg}). Проверьте доступ к камере в браузере или введите номер карты вручную.`
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      isScanningRef.current = false;
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacing = async () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    await stopCamera();
    await startCamera(nextFacing);
  };

  // Add stamps to active card
  const handleAddStamps = async (count: number) => {
    if (!activeCard) return;

    const nextStamps = activeCard.currentStamps + count;
    const isNowFree = nextStamps >= 6;

    const updated: LoyaltyCard = {
      ...activeCard,
      currentStamps: nextStamps,
      lastUpdated: new Date().toISOString(),
    };

    setActiveCard(updated);
    if (isNowFree) {
      playMelodicChime();
    } else {
      playBeep(784);
    }

    await saveLoyaltyCardToSupabase(updated);
    showToast(
      language === 'ro'
        ? `+${count} cafea adăugată! (${Math.min(nextStamps, 6)}/6)`
        : `+${count} чашка начислена! (${Math.min(nextStamps, 6)}/6)`
    );

    // Refresh recent cards list
    fetchAllLoyaltyCardsFromSupabase().then((cards) => setRecentCards(cards));
  };

  // Redeem free coffee (6th cup)
  const handleRedeemFreeCoffee = async () => {
    if (!activeCard || activeCard.currentStamps < 6) return;

    const updated: LoyaltyCard = {
      ...activeCard,
      currentStamps: 0,
      totalFreeCoffeesEarned: (activeCard.totalFreeCoffeesEarned || 0) + 1,
      lastUpdated: new Date().toISOString(),
    };

    setActiveCard(updated);
    playMelodicChime();
    await saveLoyaltyCardToSupabase(updated);
    showToast(
      language === 'ro'
        ? '🎁 Cafea gratuită oferită oaspetelui! Cardul a fost resetat pentru următoarele 6 cafele.'
        : '🎁 Бесплатный кофе выдан гостю! Карта обнулена для следующих 6 чашек.'
    );

    fetchAllLoyaltyCardsFromSupabase().then((cards) => setRecentCards(cards));
  };

  // Manual reset to 0
  const handleResetCard = async () => {
    if (!activeCard) return;

    const updated: LoyaltyCard = {
      ...activeCard,
      currentStamps: 0,
      lastUpdated: new Date().toISOString(),
    };

    setActiveCard(updated);
    await saveLoyaltyCardToSupabase(updated);
    showToast(
      language === 'ro'
        ? 'Cardul a fost resetat la 0.'
        : 'Карта сброшена на 0 чашек.'
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-400 text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-2xl animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Banner Info */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-950/60 via-stone-900 to-stone-900 border border-amber-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white font-serif">
              {language === 'ro'
                ? '📷 Scaner Carduri Fidelitate 5+1'
                : '📷 Сканер Карт Лояльности 5+1'}
            </h3>
            <p className="text-xs text-stone-400">
              {language === 'ro'
                ? 'Scanați codul QR de pe telefonul oaspetelui pentru a-i adăuga ștampila în timp real.'
                : 'Сканируйте QR-код с экрана телефона гостя для моментального начисления чашек.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isCameraActive ? (
            <button
              onClick={() => startCamera()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm flex items-center gap-2 transition active:scale-95 shadow-lg cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>
                {language === 'ro' ? 'Pornește Camera' : 'Включить камеру'}
              </span>
            </button>
          ) : (
            <>
              <button
                onClick={toggleCameraFacing}
                className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="Comută camera față / spate"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  {cameraFacing === 'environment'
                    ? language === 'ro'
                      ? 'Camera Față'
                      : 'Фронтальная'
                    : language === 'ro'
                    ? 'Camera Spate'
                    : 'Основная'}
                </span>
              </button>
              <button
                onClick={stopCamera}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <CameraOff className="w-3.5 h-3.5" />
                <span>{language === 'ro' ? 'Oprește' : 'Остановить'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main 2-Column Responsive Layout for Tablet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================= LEFT COLUMN: CAMERA VIEWFINDER & MANUAL SEARCH ================= */}
        <div className="space-y-4">
          {/* Camera Viewfinder Box */}
          <div className="p-4 sm:p-5 rounded-3xl bg-stone-900 border border-stone-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-xs sm:text-sm font-bold text-stone-300">
              <span className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span>
                  {language === 'ro'
                    ? 'Vizor Cameră Tabletă'
                    : 'Видоискатель камеры планшета'}
                </span>
              </span>
              {isCameraActive && (
                <span className="text-[11px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  LIVE
                </span>
              )}
            </div>

            {/* Video container element for html5-qrcode */}
            <div className="relative w-full aspect-square max-h-[360px] bg-black rounded-2xl overflow-hidden border border-stone-800 flex items-center justify-center">
              <div id="barista-qr-box" className="w-full h-full" />

              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-stone-950/90 z-10">
                  <div className="w-16 h-16 rounded-2xl bg-stone-900 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white font-serif">
                      {language === 'ro'
                        ? 'Camera este oprită'
                        : 'Камера отключена'}
                    </p>
                    <p className="text-xs text-stone-400 max-w-xs mt-1">
                      {language === 'ro'
                        ? 'Apasă butonul de mai jos pentru a scana codul QR de pe ecranul oaspetelui.'
                        : 'Нажмите кнопку ниже, чтобы включить сканирование QR-кодов гостей.'}
                    </p>
                  </div>
                  <button
                    onClick={() => startCamera()}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>
                      {language === 'ro' ? 'Activează Camera' : 'Включить камеру'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Manual Search Fallback */}
            <div className="pt-2 border-t border-stone-800 space-y-2">
              <label className="text-xs text-stone-400 font-medium block">
                {language === 'ro'
                  ? 'Sau introduceți manual numărul cardului / numele oaspetelui:'
                  : 'Или введите вручную номер карты / имя гостя:'}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleProcessCardNumber(manualQuery);
                    }}
                    placeholder="AMIKA-2268 / Eugeniu / Ion..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  onClick={() => handleProcessCardNumber(manualQuery)}
                  disabled={!manualQuery.trim() || isLoading}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-amber-600 hover:text-white text-stone-300 font-bold text-xs sm:text-sm transition cursor-pointer disabled:opacity-50"
                >
                  {language === 'ro' ? 'Caută' : 'Найти'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick List of Recent Regular Guests */}
          <div className="p-4 rounded-3xl bg-stone-900 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-400 font-bold">
              <span>
                {language === 'ro'
                  ? 'Oaspeți recenți (Selectare rapidă):'
                  : 'Недавние гости (Быстрый выбор):'}
              </span>
              <span className="font-mono">{recentCards.length}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {recentCards.map((c) => (
                <button
                  key={c.cardNumber}
                  onClick={() => setActiveCard(c)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                    activeCard?.cardNumber === c.cardNumber
                      ? 'bg-amber-500/20 border-amber-500/60 text-white'
                      : 'bg-stone-950 hover:bg-stone-800 border-stone-800 text-stone-300'
                  }`}
                >
                  <div>
                    <p className="font-bold text-white">
                      {c.customerName || 'Oaspete VIP'}
                    </p>
                    <p className="font-mono text-[10px] text-amber-400">
                      {c.cardNumber}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-stone-800 font-black text-xs text-amber-300">
                    {c.currentStamps}/6
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: GUEST PROFILE & ACTIONS ================= */}
        <div className="space-y-4">
          {activeCard ? (
            <div className="p-5 sm:p-6 rounded-3xl bg-stone-900 border border-amber-500/40 shadow-2xl space-y-5 animate-in fade-in duration-200">
              {/* Guest Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 inline-block mb-1">
                    Card Activ Amika VIP
                  </span>
                  <h4 className="text-xl sm:text-2xl font-bold text-white font-serif">
                    {activeCard.customerName || 'Oaspete Amika'}
                  </h4>
                  <p className="font-mono text-xs text-amber-400 mt-0.5 font-bold">
                    {activeCard.cardNumber}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                    {activeCard.currentStamps} <span className="text-stone-500 text-base">/ 6</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-semibold block">
                    {activeCard.totalFreeCoffeesEarned || 0}{' '}
                    {language === 'ro' ? 'cadouri primite' : 'подарков получено'}
                  </span>
                </div>
              </div>

              {/* 6 Stamps Visual Board for Tablet */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((slot) => {
                    const isCollected = slot <= activeCard.currentStamps;
                    const isSixth = slot === 6;

                    return (
                      <div
                        key={slot}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center p-1 border transition-all duration-300 ${
                          isCollected
                            ? isSixth
                              ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 border-amber-300 shadow-lg scale-105 font-black'
                              : 'bg-amber-600 text-stone-950 border-amber-400 font-bold'
                            : 'bg-stone-900 text-stone-600 border-stone-800 border-dashed'
                        }`}
                      >
                        <Coffee className={`w-5 h-5 ${isCollected ? 'stroke-[2.5]' : 'opacity-30'}`} />
                        <span className="text-[10px] mt-0.5 font-bold">
                          {isSixth ? '🎁' : `#${slot}`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Status Message */}
                <div className="text-center pt-2">
                  {activeCard.currentStamps >= 6 ? (
                    <div className="p-3 bg-amber-500/20 border border-amber-400 rounded-xl text-amber-200">
                      <p className="text-sm font-extrabold text-amber-300 flex items-center justify-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                        <span>
                          {language === 'ro'
                            ? '6-A CAFEA ESTE CADOU! (OFERĂ GRATUIT)'
                            : '6-Й КОФЕ В ПОДАРОК! (ВЫДАЙТЕ БЕСПЛАТНО)'}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-300 font-medium">
                      {language === 'ro'
                        ? `Mai sunt necesare ${6 - activeCard.currentStamps} cafele până la băutura gratuită.`
                        : `Осталось ${6 - activeCard.currentStamps} чашек до бесплатного кофе.`}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons for Barista */}
              <div className="space-y-3">
                {activeCard.currentStamps >= 6 ? (
                  <button
                    onClick={handleRedeemFreeCoffee}
                    className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] active:scale-[0.98] transition cursor-pointer animate-pulse"
                  >
                    <Award className="w-5 h-5" />
                    <span>
                      {language === 'ro'
                        ? '🎁 Oferă Cafeaua Gratuită & Resetează la 0'
                        : '🎁 Выдать бесплатный кофе и обнулить'}
                    </span>
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAddStamps(1)}
                      className="py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-5 h-5" />
                      <span>
                        {language === 'ro' ? '+1 Cafea' : '+1 Чашка'}
                      </span>
                    </button>

                    <button
                      onClick={() => handleAddStamps(2)}
                      className="py-4 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-5 h-5" />
                      <span>
                        {language === 'ro' ? '+2 Cafele' : '+2 Чашки'}
                      </span>
                    </button>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleResetCard}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {language === 'ro' ? 'Resetează la 0' : 'Сбросить в 0'}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveCard(null)}
                    className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-white text-xs font-semibold transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] rounded-3xl bg-stone-900/60 border border-stone-800/80 p-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-stone-900 text-stone-600 flex items-center justify-center">
                <Coffee className="w-8 h-8" />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-stone-200 font-serif">
                {language === 'ro'
                  ? 'Niciun card selectat'
                  : 'Карта не выбрана'}
              </h4>
              <p className="text-xs sm:text-sm text-stone-400 max-w-sm">
                {language === 'ro'
                  ? 'Scanați codul QR cu camera tabletei sau alegeți un oaspete din lista recentă pentru a-i acorda cafeaua.'
                  : 'Наведите камеру планшета на QR-код гостя или выберите гостя из недавнего списка для начисления чашек.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
