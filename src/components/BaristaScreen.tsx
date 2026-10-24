import { useState } from 'react';
import type { Order, OrderStatus, Language, Product, Category } from '../types';
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
  ShoppingBag,
  Search,
  X,
} from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { playMelodicChime } from '../utils/audio';
import { sendTvCommand, publishTvConfigToCloud } from '../utils/tvSync';
import {
  type TvBoardConfig,
  type TvSlideItem,
  loadTvConfig,
  saveTvConfigLocal,
  getDefaultStoreProducts,
} from '../utils/menuStore';

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
    topSub: 'Terminal Tabletă Barista • Cricova, str. Drumul Viilor 10',
    openTvBtn: 'Ecran TV',
    exitBtn: 'La vitrină',
    tabOrders: 'Precomenzi',
    tabTvRemote: 'Telecomandă TV & -30%',
    notifSentTitle: 'Notificare trimisă clientului în Telegram (RO + RU)!',
    notifSentTag: 'Trimis în Telegram',
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
    topSub: 'Планшетный терминал Бариста • Cricova, str. Drumul Viilor 10',
    openTvBtn: 'TV Экран',
    exitBtn: 'К витрине',
    tabOrders: 'Предзаказы',
    tabTvRemote: 'Пульт ТВ & Скидка -30%',
    notifSentTitle: 'Уведомление отправлено клиенту в Telegram (RO + RU)!',
    notifSentTag: 'Отправлено в Telegram',
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
  const [activeTab, setActiveTab] = useState<'orders' | 'stop_list' | 'tv_remote'>('orders');
  const [baristaConfig, setBaristaConfig] = useState<TvBoardConfig>(() => loadTvConfig());
  const [stopListFilterCat, setStopListFilterCat] = useState<Category>('all');
  const [stopListSearch, setStopListSearch] = useState<string>('');

  const baristaProducts: Product[] =
    Array.isArray(baristaConfig.storeProducts) && baristaConfig.storeProducts.length > 0
      ? baristaConfig.storeProducts
      : getDefaultStoreProducts();

  const handleBaristaToggleStopList = async (productId: string) => {
    const currentProds =
      Array.isArray(baristaConfig.storeProducts) && baristaConfig.storeProducts.length > 0
        ? baristaConfig.storeProducts
        : getDefaultStoreProducts();

    const target = currentProds.find((p) => p.id === productId);
    if (!target) return;

    const nextVis = target.visible === false ? true : false;
    const updatedProds = currentProds.map((p) =>
      p.id === productId ? { ...p, visible: nextVis } : p
    );

    const nextCoffee = baristaConfig.coffeeItems.map((c) =>
      c.id === productId ? { ...c, visible: nextVis } : c
    );
    const nextDesserts = baristaConfig.dessertItems.map((d) =>
      d.id === productId ? { ...d, visible: nextVis } : d
    );

    const updatedConfig: TvBoardConfig = {
      ...baristaConfig,
      updatedAt: Date.now(),
      storeProducts: updatedProds,
      coffeeItems: nextCoffee,
      dessertItems: nextDesserts,
    };

    setBaristaConfig(updatedConfig);
    saveTvConfigLocal(updatedConfig);
    await publishTvConfigToCloud(updatedConfig);
    playMelodicChime();

    const msg =
      language === 'ro'
        ? `${target.name.ro}: ${nextVis ? '🟢 În stoc (activat în bot)' : '🔴 Stop-list (ascuns din bot)'}`
        : `${target.name.ru}: ${nextVis ? '🟢 В наличии (доступен в боте)' : '🔴 Стоп-лист (скрыт в боте)'}`;
    setTvCommandToast(msg);
    setTimeout(() => setTvCommandToast(null), 3500);
  };

  const [selectedDessertId, setSelectedDessertId] = useState<string>('fb-01');
  const discountPercent = 30;
  const [broadcastSent, setBroadcastSent] = useState<boolean>(false);
  const [tvCommandToast, setTvCommandToast] = useState<string | null>(null);
  const [remoteLangMode, setRemoteLangMode] = useState<'auto' | 'ro' | 'ru'>('auto');
  const [notifiedOrderClient, setNotifiedOrderClient] = useState<{
    id: string;
    name: string;
    phone: string;
    itemsSummaryRo: string;
    itemsSummaryRu: string;
  } | null>(null);

  // Update pre-order status & notify customer directly (without cluttering TV screen)
  const handleUpdateStatus = (orderId: string, nextStatus: OrderStatus) => {
    onUpdateOrderStatus(orderId, nextStatus);
    const order = orders.find((o) => o.id === orderId);

    if (nextStatus === 'ready' && order) {
      playMelodicChime();
      const summaryRo = (order.items || [])
        .map(
          (i) =>
            `${i.quantity || 1}x ${
              i.product?.name?.ro ||
              i.product?.name?.ru ||
              'Produs'
            }`
        )
        .join(', ');

      const summaryRu = (order.items || [])
        .map(
          (i) =>
            `${i.quantity || 1}x ${
              i.product?.name?.ru ||
              i.product?.name?.ro ||
              'Товар'
            }`
        )
        .join(', ');

      setNotifiedOrderClient({
        id: order.id,
        name: order.customerName || 'Oaspete',
        phone: order.customerPhone || '',
        itemsSummaryRo: summaryRo || 'Cafea / Desert',
        itemsSummaryRu: summaryRu || 'Кофе / Десерт',
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

  const visibleSlides: TvSlideItem[] = (baristaConfig.slides || []).filter(
    (s: TvSlideItem) => s.visible !== false
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Card */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-950 via-stone-900 to-stone-900 border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-bold uppercase tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{B.topBadge}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-serif mt-1">{B.topTitle}</h2>
          <p className="text-xs sm:text-sm text-stone-400">{B.topSub}</p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenTvMode && (
            <button
              onClick={onOpenTvMode}
              className="px-4 py-2 sm:py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-bold flex items-center gap-2 transition active:scale-95 shadow-sm cursor-pointer"
            >
              <Tv className="w-4 h-4 text-amber-400" />
              <span>{B.openTvBtn}</span>
            </button>
          )}

          <button
            onClick={onExitBaristaMode}
            className="px-4 py-2 sm:py-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700 text-xs sm:text-sm font-semibold transition active:scale-95 cursor-pointer"
          >
            {B.exitBtn}
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs (Strictly Barista tools: Pre-orders, 1-Click Stop-List & TV Remote) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-stone-950 p-1.5 sm:p-2 rounded-2xl border border-stone-800 shadow-md">
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 sm:py-3.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-emerald-600 text-white shadow-lg font-extrabold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span className="truncate">
            {B.tabOrders} ({orders.filter((o) => o.status !== 'completed').length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('stop_list')}
          className={`py-3 sm:py-3.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'stop_list'
              ? 'bg-amber-500 text-stone-950 shadow-lg font-black'
              : 'text-amber-400/80 hover:text-amber-300'
          }`}
        >
          <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span className="truncate">
            {language === 'ro' ? 'Stop-List' : 'Стоп-лист'} (
            {baristaProducts.filter((p) => p.visible === false).length}
            )
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tv_remote')}
          className={`py-3 sm:py-3.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'tv_remote'
              ? 'bg-indigo-600 text-white shadow-lg font-extrabold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Tv className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span className="truncate">{B.tabTvRemote}</span>
        </button>
      </div>

      {/* ================= TAB 1: PRE-ORDERS & CLIENT NOTIFICATION ================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Client Notification Confirmation Box */}
          {notifiedOrderClient && (
            <div className="p-4 sm:p-5 rounded-3xl bg-emerald-950/80 border border-emerald-400/60 shadow-xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300 text-sm font-extrabold">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>{B.notifSentTitle}</span>
                </div>
                <button
                  onClick={() => setNotifiedOrderClient(null)}
                  className="text-xs text-stone-400 hover:text-white px-2 py-1 rounded bg-stone-900 border border-stone-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-stone-950/90 border border-stone-800 text-xs sm:text-sm space-y-3">
                <div className="text-xs sm:text-sm text-amber-400 font-bold flex items-center justify-between">
                  <span>
                    🤖 Amika Café Bot ➜ {notifiedOrderClient.name}{' '}
                    {notifiedOrderClient.phone ? `(${notifiedOrderClient.phone})` : ''}
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold">{B.notifSentTag}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Romanian notification card */}
                  <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs sm:text-sm leading-relaxed space-y-1.5">
                    <p className="font-bold text-amber-300">
                      ☕ Precomanda dvs. {notifiedOrderClient.id} este gata!
                    </p>
                    <p className="text-stone-300">
                      📦 <b>Conținut:</b> {notifiedOrderClient.itemsSummaryRo}.
                    </p>
                    <p className="text-stone-400 text-xs">
                      ✨ Vă așteptăm la barul Amika Café (Cricova) fără coadă! ❤️
                    </p>
                  </div>

                  {/* Russian notification card */}
                  <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs sm:text-sm leading-relaxed space-y-1.5">
                    <p className="font-bold text-amber-300">
                      ☕ Ваш предзаказ {notifiedOrderClient.id} готов!
                    </p>
                    <p className="text-stone-300">
                      📦 <b>Состав:</b> {notifiedOrderClient.itemsSummaryRu}.
                    </p>
                    <p className="text-stone-400 text-xs">
                      ✨ Ждём вас на барной стойке Amika Café без очереди! ❤️
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {orders.length === 0 ? (
            <div className="py-20 text-center rounded-3xl bg-stone-950/60 border border-stone-800/80 p-8 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-stone-900 text-stone-600 flex items-center justify-center mx-auto">
                <Coffee className="w-8 h-8" />
              </div>
              <p className="text-stone-200 text-base sm:text-lg font-bold">{t.noActiveOrders}</p>
              <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">{B.noOrdersHint}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {orders.map((order) => {
                const isNew = order.status === 'new';
                const isPreparing = order.status === 'preparing';
                const isReady = order.status === 'ready';
                const isCompleted = order.status === 'completed';

                return (
                  <div
                    key={order.id}
                    className={`p-4 sm:p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between gap-3 shadow-lg ${
                      isNew
                        ? 'bg-amber-950/40 border-amber-500/80 shadow-amber-950/30 ring-2 ring-amber-500/40'
                        : isPreparing
                        ? 'bg-sky-950/30 border-sky-500/60'
                        : isReady
                        ? 'bg-emerald-950/30 border-emerald-500/60'
                        : 'bg-stone-950/40 border-stone-800 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2.5 border-b border-stone-800/80">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-black text-amber-400">
                            {order.id}
                          </span>
                          <span className="text-sm font-bold text-white">{order.customerName}</span>
                          <span className="text-xs text-stone-400 font-mono">
                            ({order.customerPhone})
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                          <Clock className="w-4 h-4 text-amber-500" />
                          <span className="font-bold text-amber-400">{order.pickupTime}</span>
                        </div>
                      </div>

                      <div className="space-y-2 py-3 text-xs sm:text-sm">
                        {(order.items || []).map((item, idx) => (
                          <div
                            key={item.cartItemId || `item-${idx}`}
                            className="flex items-center justify-between text-stone-200"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-amber-400">{item.quantity || 1}x</span>
                              <span className="font-medium">
                                {item.product?.name?.[language] ||
                                  item.product?.name?.ro ||
                                  item.product?.name?.ru ||
                                  'Produs'}
                              </span>
                              {item.options?.dose && (
                                <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                  {item.options.dose === 'double'
                                    ? item.product?.secondVolume || (language === 'ro' ? 'Dublu' : 'Двойной')
                                    : item.product?.volume || (language === 'ro' ? 'Solo' : 'Одинарный')}
                                </span>
                              )}
                              {item.options?.milk && item.options.milk !== 'regular' && (
                                <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">
                                  {item.options.milk}
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-stone-400 shrink-0 font-semibold">
                              {item.totalPrice || item.unitPrice || 0} {t.mdl}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="pt-2.5 pb-3 border-t border-stone-800 flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-stone-400 font-medium">
                          {order.paymentMethod === 'mia' ? B.paidMia : B.payOnPickup}
                        </span>
                        <span className="text-base font-black text-white font-mono">
                          {order.totalAmount} {t.mdl}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {isNew && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'preparing')}
                            className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                          >
                            <span>{B.btnAcceptOrder}</span>
                          </button>
                        )}

                        {isPreparing && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'ready')}
                            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>{B.btnReadyNotify}</span>
                          </button>
                        )}

                        {isReady && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                            className="flex-1 py-3 px-4 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                          >
                            <span>{B.btnHandedOut}</span>
                          </button>
                        )}

                        {isCompleted && (
                          <span className="w-full text-center py-2 text-xs sm:text-sm text-stone-500 font-semibold">
                            {B.statusCompleted}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: 1-CLICK FAST STOP-LIST (TRK-014) ================= */}
      {activeTab === 'stop_list' && (
        <div className="space-y-4 sm:space-y-6">
          {tvCommandToast && (
            <div className="p-4 rounded-2xl bg-amber-950 border border-amber-400 text-amber-200 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in duration-200 shadow-xl">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{tvCommandToast}</span>
            </div>
          )}

          {/* Barista Stop-List Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-stone-900 border border-amber-500/30 space-y-3 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white font-serif">
                  {language === 'ro'
                    ? '⚡ 1-Click Stop-List Barista'
                    : '⚡ 1-Click Стоп-Лист Бариста'}
                </h3>
                <p className="text-xs sm:text-sm text-stone-400">
                  {language === 'ro'
                    ? 'Atingeți orice poziție pentru a o ascunde sau activa instantaneu în botul oaspeților.'
                    : 'Нажмите на любую позицию, чтобы мгновенно скрыть или вернуть её в бот гостей.'}
                </p>
              </div>
            </div>

            {/* Quick counters */}
            <div className="flex items-center gap-3 text-xs sm:text-sm pt-2 border-t border-stone-800">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                🟢 {language === 'ro' ? 'În stoc:' : 'В наличии:'}{' '}
                {baristaProducts.filter((p) => p.visible !== false).length}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                🔴 {language === 'ro' ? 'În stop-list:' : 'В стоп-листе:'}{' '}
                {baristaProducts.filter((p) => p.visible === false).length}
              </span>
            </div>
          </div>

          {/* Category Filter & Search Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-stone-950/60 p-3 sm:p-4 rounded-2xl border border-stone-800/80">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-wrap sm:flex-nowrap">
              {[
                { id: 'all', ro: 'Toate', ru: 'Все' },
                { id: 'coffee', ro: '☕ Cafea', ru: '☕ Кофе' },
                { id: 'foodberry', ro: '🍰 Foodberry', ru: '🍰 Десерты' },
                { id: 'matcha_tea', ro: '🍵 Ceai', ru: '🍵 Чаи' },
                { id: 'breakfast', ro: '🥪 Gustări', ru: '🥪 Сэндвичи' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setStopListFilterCat(c.id as Category)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
                    stopListFilterCat === c.id
                      ? 'bg-amber-500 text-stone-950 font-black shadow-md'
                      : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                  }`}
                >
                  {c[language]}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px] md:w-72 shrink-0">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={stopListSearch}
                onChange={(e) => setStopListSearch(e.target.value)}
                placeholder={language === 'ro' ? 'Caută produs...' : 'Поиск товара...'}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
              {stopListSearch && (
                <button
                  type="button"
                  onClick={() => setStopListSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Product Cards Grid for Barista (Optimized for Tablet) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
            {baristaProducts
              .filter((p) => {
                const matchesCat =
                  stopListFilterCat === 'all' || p.category === stopListFilterCat;
                const q = stopListSearch.toLowerCase().trim();
                const matchesSearch =
                  !q ||
                  p.name.ro.toLowerCase().includes(q) ||
                  p.name.ru.toLowerCase().includes(q);
                return matchesCat && matchesSearch;
              })
              .map((prod) => {
                const isInStock = prod.visible !== false;
                return (
                  <div
                    key={prod.id}
                    onClick={() => handleBaristaToggleStopList(prod.id)}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 shadow-md cursor-pointer select-none active:scale-[0.98] ${
                      isInStock
                        ? 'bg-stone-900/90 border-stone-800 hover:border-emerald-500/60 hover:bg-stone-850'
                        : 'bg-stone-950 border-rose-900/70 opacity-85 hover:border-rose-700'
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden shrink-0 border border-stone-800 bg-stone-950">
                        <img
                          src={prod.image}
                          alt={prod.name[language]}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 inline-block mb-1">
                          {prod.category}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white font-serif line-clamp-2 leading-tight">
                          {prod.name[language]}
                        </h4>
                        <span className="text-xs sm:text-sm font-black text-amber-400 block mt-1">
                          {prod.price} MDL {prod.volume ? `• ${prod.volume}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Touch Button for Barista */}
                    <button
                      type="button"
                      className={`w-full py-2.5 sm:py-3 px-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition pointer-events-none shadow ${
                        isInStock
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-600 text-white font-extrabold shadow-rose-950/60 border border-rose-500'
                      }`}
                    >
                      {isInStock ? (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>
                            {language === 'ro'
                              ? '🟢 În Stoc (Apasă pt Stop)'
                              : '🟢 В НАЛИЧИИ (В стоп)'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full bg-white" />
                          <span>
                            {language === 'ro'
                              ? '🔴 STOP-LIST (Activează)'
                              : '🔴 В СТОП-ЛИСТЕ (Вернуть)'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ================= TAB 3: TV REMOTE CONTROL & FLASH SALE ================= */}
      {activeTab === 'tv_remote' && (
        <div className="space-y-4 sm:space-y-6">
          {tvCommandToast && (
            <div className="p-4 rounded-2xl bg-indigo-950 border border-indigo-400 text-indigo-200 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in duration-200 shadow-xl">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
              <span>{tvCommandToast}</span>
            </div>
          )}

          {/* 2-Column Responsive Layout for Tablet */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column: TV Link & Flash Sale */}
            <div className="space-y-4 sm:space-y-6">
              {/* TV Link Card */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-stone-900 to-stone-900 border border-indigo-500/30 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300">
                      <Tv className="w-5 h-5 sm:w-6 sm:h-6" />
                    </span>
                    <div>
                      <h3 className="font-bold text-white text-sm sm:text-base">{B.remoteCardTitle}</h3>
                      <p className="text-xs text-stone-400">{B.remoteCardSub}</p>
                    </div>
                  </div>

                  {onOpenTvMode && (
                    <button
                      onClick={onOpenTvMode}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition active:scale-95 shadow cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>{B.openTvShort}</span>
                    </button>
                  )}
                </div>

                <div className="text-xs sm:text-sm text-amber-200 bg-stone-950/80 p-3 rounded-xl border border-amber-500/30 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-amber-400">
                    <Tv className="w-4 h-4" />
                    <span>{B.tvBrowserUrlLabel}</span>
                  </div>
                  <div className="font-mono text-xs select-all bg-black/60 p-2 rounded text-amber-300 break-all font-semibold">
                    https://jeneaa81.github.io/amika-cafe/tv.html
                  </div>
                </div>
              </div>

              {/* 1. Flash Sale Controls */}
              <div className="p-4 sm:p-5 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-3 sm:space-y-4 shadow-lg">
                <span className="text-xs sm:text-sm font-extrabold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
                  <span>{B.flashSaleSectionTitle}</span>
                </span>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <button
                    onClick={() =>
                      sendTvCommand(
                        { type: 'SET_FLASH_SALE', mode: 'active' },
                        setTvCommandToast,
                        B.toastFlashOn
                      )
                    }
                    className="py-3 px-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs sm:text-sm font-bold transition active:scale-95 text-center cursor-pointer"
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
                    className="py-3 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-bold transition active:scale-95 text-center cursor-pointer"
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
                    className="py-3 px-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700 text-xs sm:text-sm font-semibold transition active:scale-95 text-center cursor-pointer"
                  >
                    {B.flashBtnOff}
                  </button>
                </div>

                {/* Telegram Broadcast Simulation */}
                <div className="pt-3 border-t border-stone-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm text-stone-400">
                    <span>{B.notifySubscribersLabel}</span>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedDessertId}
                      onChange={(e) => setSelectedDessertId(e.target.value)}
                      className="flex-1 p-2.5 rounded-xl bg-stone-950 border border-stone-700 text-xs sm:text-sm text-white"
                    >
                      {desserts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name[language]} ({d.price} MDL)
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleSendBroadcast}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shrink-0 cursor-pointer shadow"
                    >
                      <Send className="w-4 h-4" />
                      <span>{B.sendBroadcastBtn}</span>
                    </button>
                  </div>

                  {broadcastSent && (
                    <div className="p-3.5 rounded-2xl bg-stone-950 border border-emerald-500/40 text-xs sm:text-sm text-stone-300">
                      {B.sentTelegramPrefix} <b>{selectedDessert.name[language]}</b> {B.sentTelegramMid}{' '}
                      <b className="text-rose-400">{discountedPrice} MDL</b>!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Slide Selector & Sound/Language */}
            <div className="space-y-4 sm:space-y-6">
              {/* 2. Dynamic Slide Selector */}
              <div className="p-4 sm:p-5 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-3 shadow-lg">
                <span className="text-xs sm:text-sm font-extrabold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  <span>
                    {B.switchSlideTitle} ({visibleSlides.length} {B.activeWord})
                  </span>
                </span>

                <div className="grid grid-cols-1 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {visibleSlides.map((s: TvSlideItem, idx: number) => (
                    <button
                      key={s.id}
                      onClick={() =>
                        sendTvCommand(
                          { type: 'SET_SLIDE', index: idx },
                          setTvCommandToast,
                          `${B.toastSlideSwitched} #${idx + 1} (${s.title[language]})`
                        )
                      }
                      className="py-3 px-3.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-200 border border-stone-800 text-xs sm:text-sm font-medium text-left flex items-center justify-between transition active:scale-98 cursor-pointer"
                    >
                      <span className="truncate pr-2">
                        📸 {idx + 1}. {s.title[language] || s.title.ro}
                      </span>
                      <span className="text-xs text-amber-400 font-mono shrink-0 font-bold">#{idx + 1}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Language & Melodic Audio Chime */}
              <div className="p-4 sm:p-5 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-3 sm:space-y-4 shadow-lg">
                <span className="text-xs sm:text-sm font-extrabold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                  <span>{B.langAndSoundTitle}</span>
                </span>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setRemoteLangMode('ro');
                      sendTvCommand(
                        { type: 'SET_LANG_MODE', mode: 'ro' },
                        setTvCommandToast,
                        B.toastLangRo
                      );
                    }}
                    className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 border cursor-pointer ${
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
                    className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 border cursor-pointer ${
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
                    className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 border cursor-pointer ${
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
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs sm:text-sm font-bold transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <span>{B.testSoundBtn}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
