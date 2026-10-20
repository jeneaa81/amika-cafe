import { useState } from 'react';
import type { Order, OrderStatus, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import {
  Clock,
  CheckCircle,
  Send,
  Coffee,
  Tv,
  Flame,
  Bell,
  Volume2,
  ExternalLink,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { playMelodicChime } from '../utils/audio';
import { sendTvCommand } from '../utils/tvSync';
import { type TvBoardConfig, loadTvConfig } from '../utils/menuStore';

interface BaristaScreenProps {
  language: Language;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, nextStatus: OrderStatus) => void;
  onExitBaristaMode: () => void;
  onOpenTvMode?: () => void;
}

const BARISTA_I18N = {
  ro: {
    topBadge: 'Postul de lucru Barista',
    topTitle: 'Precomenzi & Telecomandă TV',
    topSub: 'Cricova • str. Drumul Viilor 10 (fără setări admin)',
    openTvBtn: 'Ecran TV',
    exitBtn: 'La vitrină',
    tabOrders: 'Precomenzi',
    tabTvRemote: 'Telecomandă TV & -30%',
    notifSentTitle: 'Notificare trimisă clientului în Telegram!',
    notifOrderReady: 'Precomanda dvs.',
    notifReadySuffix: 'este gata!',
    notifItems: 'Conținut:',
    notifWaitAtBar: 'Vă așteptăm la barul Amika Café fără coadă! ❤️',
    noOrdersHint:
      'Când un oaspete plasează o precomandă în aplicație, aceasta apare aici cu semnal sonor.',
    paidMia: 'MIA Instant (Achitat)',
    payOnPickup: 'Plata la preluare',
    btnAcceptOrder: 'Preia în lucru',
    btnReadyNotify: '🔔 Gata — Anunță clientul!',
    btnHandedOut: 'Comandă predată oaspetelui',
    statusCompleted: '✓ Predată',
    remoteCardTitle: 'Telecomandă Ecran TV',
    remoteCardSub: 'Comutare la distanță a regimurilor fără cabluri',
    openTvShort: 'Deschide TV',
    tvBrowserUrlLabel: 'Adresa pentru browserul televizorului (LG webOS / Smart TV):',
    flashSaleSectionTitle: 'Reducere de seară Flash Sale (-30%) pe TV',
    flashBtnOn: '🔥 Activează (-30%)',
    flashBtnAuto: '⏰ Auto (20:00)',
    flashBtnOff: 'Oprește',
    toastFlashOn: '🔥 Regimul Flash Sale (-30%) a fost activat pe TV',
    toastFlashAuto: '⏰ Regimul Auto activat (pornire la 20:00)',
    toastFlashOff: 'Regim obișnuit de zi pe TV',
    toastBroadcastSent: '🔥 Flash Sale activat pe TV și trimis oaspeților în Telegram!',
    notifySubscribersLabel: 'Anunță abonații botului despre reducerea de seară:',
    sendBroadcastBtn: 'Trimite',
    sentTelegramPrefix: '✅ Trimis în Telegram:',
    sentTelegramMid: 'la preț special',
    switchSlideTitle: 'Schimbă slide-ul pe TV',
    activeWord: 'active',
    toastSlideSwitched: 'Slide schimbat:',
    langAndSoundTitle: 'Limba pe TV și Semnal Sonor',
    toastLangRo: '🌐 Limba pe TV: Română',
    toastLangRu: '🌐 Limba pe TV: Rusă',
    toastLangAuto: '🔄 Schimbare automată a limbii la fiecare 15 sec (RO ⇄ RU)',
    toastChimePlayed: '🔔 Gong melodic redat pe TV!',
    testSoundBtn: '🔔 Testează sunetul pe TV (Gong melodic)',
  },
  ru: {
    topBadge: 'Рабочее место Бариста',
    topTitle: 'Предзаказы & Пульт ТВ',
    topSub: 'Cricova • str. Drumul Viilor 10 (без настроек админки)',
    openTvBtn: 'TV Экран',
    exitBtn: 'К витрине',
    tabOrders: 'Предзаказы',
    tabTvRemote: 'Пульт ТВ & Скидка -30%',
    notifSentTitle: 'Уведомление отправлено клиенту в Telegram!',
    notifOrderReady: 'Ваш предзаказ',
    notifReadySuffix: 'готов!',
    notifItems: 'Состав:',
    notifWaitAtBar: 'Ждём вас на барной стойке Amika Café без очереди! ❤️',
    noOrdersHint:
      'Когда гость оформляет предзаказ в приложении, он появляется здесь со звуковым сигналом.',
    paidMia: 'MIA Instant (Оплачено)',
    payOnPickup: 'Оплата при получении',
    btnAcceptOrder: 'Принять в работу',
    btnReadyNotify: '🔔 Готов — Уведомить клиента!',
    btnHandedOut: 'Заказ выдан гостю',
    statusCompleted: '✓ Выдан',
    remoteCardTitle: 'Пульт управления ТВ экраном',
    remoteCardSub: 'Дистанционное переключение режимов без проводов',
    openTvShort: 'Открыть ТВ',
    tvBrowserUrlLabel: 'Адрес для браузера телевизора (LG webOS / Smart TV):',
    flashSaleSectionTitle: 'Вечерняя распродажа Flash Sale (-30%) на ТВ',
    flashBtnOn: '🔥 Включить (-30%)',
    flashBtnAuto: '⏰ Авто (20:00)',
    flashBtnOff: 'Выключить',
    toastFlashOn: '🔥 Включен режим Flash-распродажи (-30%) на ТВ',
    toastFlashAuto: '⏰ Включен авто-режим (активация в 20:00)',
    toastFlashOff: 'Обычный дневной режим на ТВ',
    toastBroadcastSent: '🔥 Flash-распродажа включена на ТВ и отправлена гостям в Telegram!',
    notifySubscribersLabel: 'Уведомить подписчиков бота о вечерней скидке:',
    sendBroadcastBtn: 'Рассылка',
    sentTelegramPrefix: '✅ Отправлено в Telegram:',
    sentTelegramMid: 'по спеццене',
    switchSlideTitle: 'Переключить слайд на ТВ',
    activeWord: 'активных',
    toastSlideSwitched: 'Слайд переключен:',
    langAndSoundTitle: 'Язык на ТВ и Звуковой сигнал',
    toastLangRo: '🌐 Язык на ТВ: Română',
    toastLangRu: '🌐 Язык на ТВ: Русский',
    toastLangAuto: '🔄 Авто-смена языка каждые 15 сек (RO ⇄ RU)',
    toastChimePlayed: '🔔 Мелодичный гонг воспроизведен на ТВ!',
    testSoundBtn: '🔔 Проверить звук на ТВ (Мелодичный гонг)',
  },
};

export const BaristaScreen: React.FC<BaristaScreenProps> = ({
  language,
  orders,
  onUpdateOrderStatus,
  onExitBaristaMode,
  onOpenTvMode,
}) => {
  const t = TRANSLATIONS[language];
  const B = BARISTA_I18N[language];
  const [activeTab, setActiveTab] = useState<'orders' | 'tv_remote'>('orders');
  const [tvConfig] = useState<TvBoardConfig>(() => loadTvConfig());

  const [selectedDessertId, setSelectedDessertId] = useState<string>('fb-01');
  const discountPercent = 30;
  const [broadcastSent, setBroadcastSent] = useState<boolean>(false);
  const [tvCommandToast, setTvCommandToast] = useState<string | null>(null);
  const [remoteLangMode, setRemoteLangMode] = useState<'auto' | 'ro' | 'ru'>('auto');
  const [notifiedOrderClient, setNotifiedOrderClient] = useState<{
    id: string;
    name: string;
    phone: string;
    itemsSummary: string;
  } | null>(null);

  // Update pre-order status & notify customer directly (without cluttering TV screen)
  const handleUpdateStatus = (orderId: string, nextStatus: OrderStatus) => {
    onUpdateOrderStatus(orderId, nextStatus);
    const order = orders.find((o) => o.id === orderId);

    if (nextStatus === 'ready' && order) {
      playMelodicChime();
      const summary = order.items
        .map((i) => `${i.quantity}x ${i.product.name[language]}`)
        .join(', ');
      setNotifiedOrderClient({
        id: order.id,
        name: order.customerName,
        phone: order.customerPhone,
        itemsSummary: summary,
      });
    }
  };

  // Filter desserts for flash sale
  const desserts = PRODUCTS.filter((p) => p.category === 'foodberry');
  const selectedDessert = PRODUCTS.find((p) => p.id === selectedDessertId) || desserts[0];
  const discountedPrice = Math.round(selectedDessert.price * (1 - discountPercent / 100));

  const handleSendBroadcast = () => {
    setBroadcastSent(true);
    sendTvCommand(
      { type: 'SET_FLASH_SALE', mode: 'active' },
      setTvCommandToast,
      B.toastBroadcastSent
    );
  };

  const visibleSlides = tvConfig.slides.filter((s) => s.visible !== false);

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* Top Header Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-950 via-stone-900 to-stone-900 border border-emerald-500/40 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{B.topBadge}</span>
          </div>
          <h2 className="text-lg font-bold text-white font-serif mt-0.5">{B.topTitle}</h2>
          <p className="text-[11px] text-stone-400">{B.topSub}</p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenTvMode && (
            <button
              onClick={onOpenTvMode}
              className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            >
              <Tv className="w-3.5 h-3.5 text-amber-400" />
              <span>{B.openTvBtn}</span>
            </button>
          )}

          <button
            onClick={onExitBaristaMode}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700 text-xs font-semibold transition active:scale-95"
          >
            {B.exitBtn}
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs (Strictly Barista tools: Pre-orders & TV Remote) */}
      <div className="grid grid-cols-2 gap-2 bg-stone-950 p-1.5 rounded-2xl border border-stone-800">
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'orders'
              ? 'bg-emerald-600 text-white shadow-md font-extrabold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span className="truncate">
            {B.tabOrders} ({orders.filter((o) => o.status !== 'completed').length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tv_remote')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'tv_remote'
              ? 'bg-indigo-600 text-white shadow-md font-extrabold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span className="truncate">{B.tabTvRemote}</span>
        </button>
      </div>

      {/* ================= TAB 1: PRE-ORDERS & CLIENT NOTIFICATION ================= */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {/* Client Notification Confirmation Box */}
          {notifiedOrderClient && (
            <div className="p-4 rounded-3xl bg-emerald-950/80 border border-emerald-400/60 shadow-xl space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300 text-xs font-extrabold">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>{B.notifSentTitle}</span>
                </div>
                <button
                  onClick={() => setNotifiedOrderClient(null)}
                  className="text-[11px] text-stone-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-stone-950/90 border border-stone-800 text-xs space-y-1">
                <div className="text-[11px] text-amber-400 font-bold">
                  🤖 Amika Café Bot ➜ {notifiedOrderClient.name} ({notifiedOrderClient.phone})
                </div>
                <p className="text-stone-200 leading-relaxed">
                  ☕{' '}
                  <b>
                    {B.notifOrderReady} {notifiedOrderClient.id} {B.notifReadySuffix}
                  </b>
                  <br />
                  {B.notifItems} {notifiedOrderClient.itemsSummary}.
                  <br />
                  {B.notifWaitAtBar}
                </p>
              </div>
            </div>
          )}

          {orders.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-stone-950/60 border border-stone-800/80 p-6 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-stone-900 text-stone-600 flex items-center justify-center mx-auto">
                <Coffee className="w-6 h-6" />
              </div>
              <p className="text-stone-300 text-sm font-bold">{t.noActiveOrders}</p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">{B.noOrdersHint}</p>
            </div>
          ) : (
            orders.map((order) => {
              const isNew = order.status === 'new';
              const isPreparing = order.status === 'preparing';
              const isReady = order.status === 'ready';
              const isCompleted = order.status === 'completed';

              return (
                <div
                  key={order.id}
                  className={`p-4 rounded-3xl border transition-all duration-300 space-y-3 ${
                    isNew
                      ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/40'
                      : isPreparing
                      ? 'bg-sky-950/30 border-sky-500/60'
                      : isReady
                      ? 'bg-emerald-950/30 border-emerald-500/60'
                      : 'bg-stone-950/40 border-stone-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-stone-800/80">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-amber-400">
                        {order.id}
                      </span>
                      <span className="text-xs font-bold text-white">{order.customerName}</span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        ({order.customerPhone})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-bold text-amber-400">{order.pickupTime}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {order.items.map((item) => (
                      <div
                        key={item.cartItemId}
                        className="flex items-center justify-between text-stone-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-400">{item.quantity}x</span>
                          <span className="font-medium">{item.product.name[language]}</span>
                          {item.options.milk && item.options.milk !== 'regular' && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-300">
                              {item.options.milk}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-stone-400">
                          {item.totalPrice} {t.mdl}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs">
                    <span className="text-stone-400">
                      {order.paymentMethod === 'mia' ? B.paidMia : B.payOnPickup}
                    </span>
                    <span className="text-sm font-black text-white">
                      {order.totalAmount} {t.mdl}
                    </span>
                  </div>

                  <div className="pt-1 flex gap-2">
                    {isNew && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95"
                      >
                        <span>{B.btnAcceptOrder}</span>
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{B.btnReadyNotify}</span>
                      </button>
                    )}

                    {isReady && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        className="flex-1 py-2 px-3 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        <span>{B.btnHandedOut}</span>
                      </button>
                    )}

                    {isCompleted && (
                      <span className="w-full text-center py-1 text-xs text-stone-500 font-semibold">
                        {B.statusCompleted}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ================= TAB 2: TV REMOTE CONTROL & FLASH SALE ================= */}
      {activeTab === 'tv_remote' && (
        <div className="space-y-4">
          {tvCommandToast && (
            <div className="p-3 rounded-2xl bg-indigo-950 border border-indigo-400 text-indigo-200 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 shadow-xl">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
              <span>{tvCommandToast}</span>
            </div>
          )}

          {/* TV Link Card */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-stone-900 to-stone-900 border border-indigo-500/30 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                  <Tv className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm">{B.remoteCardTitle}</h3>
                  <p className="text-[11px] text-stone-400">{B.remoteCardSub}</p>
                </div>
              </div>

              {onOpenTvMode && (
                <button
                  onClick={onOpenTvMode}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition active:scale-95"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{B.openTvShort}</span>
                </button>
              )}
            </div>

            <div className="text-xs text-amber-200 bg-stone-950/80 p-2.5 rounded-xl border border-amber-500/30 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-400">
                <Tv className="w-3.5 h-3.5" />
                <span>{B.tvBrowserUrlLabel}</span>
              </div>
              <div className="font-mono text-[11px] select-all bg-black/60 p-1.5 rounded text-amber-300 break-all font-semibold">
                https://jeneaa81.github.io/amika-cafe/tv.html
              </div>
            </div>
          </div>

          {/* 1. Flash Sale Controls */}
          <div className="p-4 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-3">
            <span className="text-xs font-extrabold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-500" />
              <span>{B.flashSaleSectionTitle}</span>
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() =>
                  sendTvCommand(
                    { type: 'SET_FLASH_SALE', mode: 'active' },
                    setTvCommandToast,
                    B.toastFlashOn
                  )
                }
                className="py-2.5 px-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition active:scale-95 text-center"
              >
                {B.flashBtnOn}
              </button>
              <button
                onClick={() =>
                  sendTvCommand(
                    { type: 'SET_FLASH_SALE', mode: 'auto' },
                    setTvCommandToast,
                    B.toastFlashAuto
                  )
                }
                className="py-2.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition active:scale-95 text-center"
              >
                {B.flashBtnAuto}
              </button>
              <button
                onClick={() =>
                  sendTvCommand(
                    { type: 'SET_FLASH_SALE', mode: 'inactive' },
                    setTvCommandToast,
                    B.toastFlashOff
                  )
                }
                className="py-2.5 px-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700 text-xs font-semibold transition active:scale-95 text-center"
              >
                {B.flashBtnOff}
              </button>
            </div>

            {/* Telegram Broadcast Simulation */}
            <div className="pt-2 border-t border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-stone-400">
                <span>{B.notifySubscribersLabel}</span>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedDessertId}
                  onChange={(e) => setSelectedDessertId(e.target.value)}
                  className="flex-1 p-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white"
                >
                  {desserts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name[language]} ({d.price} MDL)
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSendBroadcast}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{B.sendBroadcastBtn}</span>
                </button>
              </div>

              {broadcastSent && (
                <div className="p-3 rounded-2xl bg-stone-950 border border-emerald-500/40 text-[11px] text-stone-300">
                  {B.sentTelegramPrefix} <b>{selectedDessert.name[language]}</b> {B.sentTelegramMid}{' '}
                  <b className="text-rose-400">{discountedPrice} MDL</b>!
                </div>
              )}
            </div>
          </div>

          {/* 2. Dynamic Slide Selector */}
          <div className="p-4 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-2.5">
            <span className="text-xs font-extrabold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>
                {B.switchSlideTitle} ({visibleSlides.length} {B.activeWord})
              </span>
            </span>

            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
              {visibleSlides.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() =>
                    sendTvCommand(
                      { type: 'SET_SLIDE', index: idx },
                      setTvCommandToast,
                      `${B.toastSlideSwitched} #${idx + 1} (${s.title[language]})`
                    )
                  }
                  className="py-2.5 px-3 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-200 border border-stone-800 text-xs font-medium text-left flex items-center justify-between transition active:scale-98"
                >
                  <span className="truncate pr-2">
                    📸 {idx + 1}. {s.title[language] || s.title.ro}
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono shrink-0">#{idx + 1}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Language & Melodic Audio Chime */}
          <div className="p-4 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-3">
            <span className="text-xs font-extrabold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>{B.langAndSoundTitle}</span>
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setRemoteLangMode('ro');
                  sendTvCommand(
                    { type: 'SET_LANG_MODE', mode: 'ro' },
                    setTvCommandToast,
                    B.toastLangRo
                  );
                }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition active:scale-95 border ${
                  remoteLangMode === 'ro'
                    ? 'bg-amber-600 text-stone-950 border-amber-400 shadow-md font-extrabold'
                    : 'bg-stone-800 hover:bg-stone-750 text-stone-200 border-stone-700'
                }`}
              >
                🇷🇴 RO
              </button>

              <button
                onClick={() => {
                  setRemoteLangMode('ru');
                  sendTvCommand(
                    { type: 'SET_LANG_MODE', mode: 'ru' },
                    setTvCommandToast,
                    B.toastLangRu
                  );
                }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition active:scale-95 border ${
                  remoteLangMode === 'ru'
                    ? 'bg-amber-600 text-stone-950 border-amber-400 shadow-md font-extrabold'
                    : 'bg-stone-800 hover:bg-stone-750 text-stone-200 border-stone-700'
                }`}
              >
                🇷🇺 RU
              </button>

              <button
                onClick={() => {
                  setRemoteLangMode('auto');
                  sendTvCommand(
                    { type: 'SET_LANG_MODE', mode: 'auto' },
                    setTvCommandToast,
                    B.toastLangAuto
                  );
                }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition active:scale-95 border ${
                  remoteLangMode === 'auto'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md font-extrabold'
                    : 'bg-stone-800 hover:bg-stone-750 text-emerald-400 border-stone-700'
                }`}
              >
                🔄 RO ⇄ RU
              </button>
            </div>

            <button
              onClick={() => {
                playMelodicChime();
                sendTvCommand({ type: 'CHIME' }, setTvCommandToast, B.toastChimePlayed);
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition active:scale-98 flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4 text-emerald-400" />
              <span>{B.testSoundBtn}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
