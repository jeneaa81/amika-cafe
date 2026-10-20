import { useState } from 'react';
import type { Order, OrderStatus, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { Clock, CheckCircle, Send, Cake, Coffee, Tv, Flame, Bell, Volume2, ExternalLink, Sparkles } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { playMelodicChime } from '../utils/audio';
import { sendTvCommand } from '../utils/tvSync';

interface BaristaScreenProps {
  language: Language;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, nextStatus: OrderStatus) => void;
  onExitBaristaMode: () => void;
  onOpenTvMode?: () => void;
}

export const BaristaScreen: React.FC<BaristaScreenProps> = ({
  language,
  orders,
  onUpdateOrderStatus,
  onExitBaristaMode,
  onOpenTvMode,
}) => {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'orders' | 'flash_sale' | 'tv_remote'>('orders');
  const [selectedDessertId, setSelectedDessertId] = useState<string>('fb-01');
  const [discountPercent, setDiscountPercent] = useState<number>(30);
  const [broadcastSent, setBroadcastSent] = useState<boolean>(false);
  const [tvCommandToast, setTvCommandToast] = useState<string | null>(null);
  const [remoteLangMode, setRemoteLangMode] = useState<'auto' | 'ro' | 'ru'>('auto');

  const handleUpdateStatus = (orderId: string, nextStatus: OrderStatus) => {
    onUpdateOrderStatus(orderId, nextStatus);
    const order = orders.find((o) => o.id === orderId);
    const updatedOrders = orders.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o));

    if (nextStatus === 'ready') {
      playMelodicChime();
      sendTvCommand(
        {
          type: 'CALL_ORDER',
          orderId,
          customerName: order?.customerName || 'Oaspete',
        },
        setTvCommandToast,
        `🔔 Заказ ${orderId} (${order?.customerName || 'Гость'}) вызван на экран ТВ!`
      );
    } else {
      sendTvCommand(
        {
          type: 'ORDER_STATUS_UPDATE',
          orderId,
          status: nextStatus,
        },
        setTvCommandToast,
        `Статус заказа ${orderId}: ${nextStatus}`
      );
    }

    sendTvCommand({ type: 'ORDERS_SYNC', orders: updatedOrders });
  };

  // Filter only desserts for flash sale
  const desserts = PRODUCTS.filter((p) => p.category === 'foodberry');
  const selectedDessert = PRODUCTS.find((p) => p.id === selectedDessertId) || desserts[0];
  const discountedPrice = Math.round(selectedDessert.price * (1 - discountPercent / 100));

  const handleSendBroadcast = () => {
    setBroadcastSent(true);
    sendTvCommand(
      { type: 'SET_FLASH_SALE', mode: 'active' },
      setTvCommandToast,
      '🔥 Flash-распродажа отправлена на ТВ и в Telegram!'
    );
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-950 via-stone-900 to-stone-900 border border-emerald-500/40 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{t.baristaScreenTitle}</span>
          </div>
          <h2 className="text-lg font-bold text-white font-serif mt-0.5">
            Amika Live Terminal
          </h2>
          <p className="text-[11px] text-stone-400">
            Cricova • str. Drumul Viilor 10
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenTvMode && (
            <button
              onClick={onOpenTvMode}
              className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              title="Afișează pe televizor / TV Menu Board"
            >
              <Tv className="w-3.5 h-3.5 text-amber-400" />
              <span>TV Board</span>
            </button>
          )}

          <button
            onClick={onExitBaristaMode}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700 text-xs font-semibold transition active:scale-95"
          >
            {language === 'ro' ? 'Ieșire' : 'Назад к меню'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1.5 bg-stone-950 p-1.5 rounded-2xl border border-stone-800">
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-2 px-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition ${
            activeTab === 'orders'
              ? 'bg-amber-600 text-stone-950 shadow-md font-extrabold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span className="truncate">
            {t.tabLiveOrders} ({orders.filter((o) => o.status !== 'completed').length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('flash_sale')}
          className={`py-2 px-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition ${
            activeTab === 'flash_sale'
              ? 'bg-rose-600 text-white shadow-md font-extrabold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Cake className="w-3.5 h-3.5" />
          <span>Flash (-30%)</span>
        </button>

        <button
          onClick={() => setActiveTab('tv_remote')}
          className={`py-2 px-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition ${
            activeTab === 'tv_remote'
              ? 'bg-indigo-600 text-white shadow-md font-extrabold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Пульт ТВ</span>
        </button>
      </div>

      {/* TAB 1: LIVE ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-stone-950/60 border border-stone-800/80 p-6 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-stone-900 text-stone-600 flex items-center justify-center mx-auto">
                <Coffee className="w-6 h-6" />
              </div>
              <p className="text-stone-300 text-sm font-bold">{t.noActiveOrders}</p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                {language === 'ro'
                  ? 'Fă o comandă de probă din meniu pentru a vedea cum apare pe ecranul barmanului în timp real.'
                  : 'Сделайте тестовый предзаказ из меню, чтобы увидеть, как он мгновенно появляется на экране бариста.'}
              </p>
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
                  {/* Order Head */}
                  <div className="flex items-center justify-between pb-2 border-b border-stone-800/80">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-amber-400">
                        {order.id}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {order.customerName}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        ({order.customerPhone})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-bold text-amber-400">
                        {order.pickupTime}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5 text-xs">
                    {order.items.map((item) => (
                      <div
                        key={item.cartItemId}
                        className="flex items-center justify-between text-stone-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-400">
                            {item.quantity}x
                          </span>
                          <span className="font-medium">
                            {item.product.name[language]}
                          </span>
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

                  {/* Payment & Total */}
                  <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs">
                    <span className="text-stone-400">
                      {order.paymentMethod === 'mia'
                        ? 'MIA Instant (Achitat)'
                        : 'Achitare la casă'}
                    </span>
                    <span className="text-sm font-black text-white">
                      {order.totalAmount} {t.mdl}
                    </span>
                  </div>

                  {/* Workflow Actions */}
                  <div className="pt-1 flex gap-2">
                    {isNew && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95"
                      >
                        <span>{t.btnAccept}</span>
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{t.btnReady}</span>
                      </button>
                    )}

                    {isReady && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        className="flex-1 py-2 px-3 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        <span>{t.btnComplete}</span>
                      </button>
                    )}

                    {isCompleted && (
                      <span className="w-full text-center py-1 text-xs text-stone-500 font-semibold">
                        {t.orderStatusCompleted}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: FLASH SALE FOODBERRY */}
      {activeTab === 'flash_sale' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-950/60 via-stone-900 to-stone-900 border border-rose-500/30 shadow-xl space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block mb-1">
                Lichidare Stoc de Seară
              </span>
              <h3 className="text-base font-bold text-white font-serif">
                {t.flashSaleTitle}
              </h3>
              <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                {t.flashSaleDesc}
              </p>
            </div>

            {/* Select Dessert */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300">
                {t.selectDessertLabel}
              </label>
              <select
                value={selectedDessertId}
                onChange={(e) => setSelectedDessertId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-700 text-xs font-semibold text-white outline-none focus:border-rose-500"
              >
                {desserts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name[language]} ({d.price} MDL)
                  </option>
                ))}
              </select>
            </div>

            {/* Select Discount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300">
                {t.selectDiscountLabel}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[20, 30, 50].map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    onClick={() => setDiscountPercent(percent)}
                    className={`py-2 rounded-xl text-xs font-black transition border ${
                      discountPercent === percent
                        ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                        : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-900'
                    }`}
                  >
                    -{percent}%
                  </button>
                ))}
              </div>
            </div>

            {/* Price Preview */}
            <div className="p-3 rounded-2xl bg-stone-950/80 border border-stone-800 flex items-center justify-between text-xs">
              <span className="text-stone-400">Preț redus pentru oaspeți:</span>
              <div className="flex items-baseline gap-2">
                <span className="line-through text-stone-500 font-mono">
                  {selectedDessert.price} MDL
                </span>
                <span className="text-base font-black text-rose-400 font-mono">
                  {discountedPrice} MDL
                </span>
              </div>
            </div>

            {/* Broadcast Action */}
            <button
              onClick={handleSendBroadcast}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 transition active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>{t.btnBroadcast}</span>
            </button>
          </div>

          {/* Broadcast Simulation Output */}
          {broadcastSent && (
            <div className="p-4 rounded-3xl bg-stone-950 border border-emerald-500/40 shadow-xl space-y-3 animate-in slide-in-from-bottom-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckCircle className="w-4 h-4" />
                <span>{t.broadcastSuccessTitle}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-stone-400 border-b border-stone-800 pb-1.5">
                  <span className="font-bold text-white">Amika Café Bot 🤖</span>
                  <span>Acum</span>
                </div>
                <p className="text-stone-200 leading-relaxed font-sans">
                  ⚡ <b>Ofertă de seară la Amika Café (Cricova)!</b>
                  <br />
                  Pe vitrina noastră au rămas câteva porții proaspete de{' '}
                  <span className="text-amber-400 font-bold">
                    {selectedDessert.name[language]}
                  </span>{' '}
                  de la Foodberry cu reducere de{' '}
                  <span className="text-rose-400 font-bold">-{discountPercent}%</span>!
                  <br />
                  <br />
                  💰 Preț promo: <b>{discountedPrice} MDL</b> (în loc de {selectedDessert.price} MDL).
                  <br />
                  📍 Str. Drumul Viilor 10 (lângă Linella) până la 22:00.
                </p>
              </div>

              <p className="text-[11px] text-stone-400 text-center italic">
                {language === 'ro'
                  ? 'Astfel proprietarul nu aruncă deserturile scumpe, ci le vinde garantat înainte de închidere!'
                  : 'Так владелец не списывает дорогие десерты в мусорку, а гарантированно продает их до закрытия смены!'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TV REMOTE CONTROL (ПУЛЬТ УПРАВЛЕНИЯ ТЕЛЕВИЗОРОМ) */}
      {activeTab === 'tv_remote' && (
        <div className="space-y-4">
          {/* Toast feedback */}
          {tvCommandToast && (
            <div className="p-3 rounded-2xl bg-indigo-950 border border-indigo-400 text-indigo-200 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 shadow-xl">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
              <span>{tvCommandToast}</span>
            </div>
          )}

          {/* Quick link & preview */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-stone-900 to-stone-900 border border-indigo-500/30 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                  <Tv className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {language === 'ro' ? 'Telecomandă TV Menu-Board' : 'Пульт управления ТВ экраном'}
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    {language === 'ro' ? 'Controlează televizorul direct de pe telefon' : 'Управляйте экраном на стене прямо с телефона'}
                  </p>
                </div>
              </div>

              {onOpenTvMode && (
                <button
                  onClick={onOpenTvMode}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition active:scale-95"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{language === 'ro' ? 'Deschide TV' : 'Открыть ТВ'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-500/30 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{language === 'ro' ? 'Canal sincronizare TV: ' : 'Канал связи: '}<b>amika_cricova_tv_control (Мульти-кластер)</b></span>
            </div>

            <p className="text-xs text-stone-300 bg-stone-950/60 p-2.5 rounded-xl border border-stone-800">
              💡 <b>{language === 'ro' ? 'Cum funcționează:' : 'Как это работает:'}</b> {language === 'ro' ? 'Dacă pe televizor este deschisă pagina de TV, apăsarea butoanelor de mai jos va comuta instantaneu ecranul fără fire!' : 'Когда в браузере телевизора открыта ссылка ТВ, кнопки ниже мгновенно переключают экран без проводов!'}
            </p>
          </div>

          {/* 1. Flash Sale Controls */}
          <div className="p-4 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-2.5">
            <span className="text-xs font-extrabold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-500" />
              <span>{language === 'ro' ? 'Regim Flash Sale (-30%) pe TV' : 'Режим Flash-распродажи (-30%) на ТВ'}</span>
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() =>
                  sendTvCommand(
                    { type: 'SET_FLASH_SALE', mode: 'active' },
                    setTvCommandToast,
                    '🔥 Включен режим Flash-распродажи на ТВ'
                  )
                }
                className="py-2.5 px-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition active:scale-95 text-center"
              >
                🔥 Включить (-30%)
              </button>
              <button
                onClick={() =>
                  sendTvCommand(
                    { type: 'SET_FLASH_SALE', mode: 'auto' },
                    setTvCommandToast,
                    '⏰ Включен авто-режим (активация в 20:00)'
                  )
                }
                className="py-2.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition active:scale-95 text-center"
              >
                ⏰ Авто (20:00)
              </button>
              <button
                onClick={() =>
                  sendTvCommand(
                    { type: 'SET_FLASH_SALE', mode: 'inactive' },
                    setTvCommandToast,
                    'Обычный дневной режим на ТВ'
                  )
                }
                className="py-2.5 px-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700 text-xs font-semibold transition active:scale-95 text-center"
              >
                Выключить
              </button>
            </div>
          </div>

          {/* 2. Slide Selector */}
          <div className="p-4 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-2.5">
            <span className="text-xs font-extrabold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{language === 'ro' ? 'Comută Fotografia pe TV' : 'Переключить слайд на ТВ'}</span>
            </span>

            <div className="grid grid-cols-1 gap-2">
              {[
                { title: '🥐 1. Deserturi Artizanale Foodberry (Витрина)', idx: 0 },
                { title: '☕ 2. Зерно недели: 100% Arabica Ethiopia Guji', idx: 1 },
                { title: '👨‍👦 3. „Ajutorul meu” — Семья Amika Café', idx: 2 },
                { title: '🏠 4. Барная стойка Amika & Закат в Крикова', idx: 3 },
                { title: '🍵 5. Церемониальная Матча & Cold Brew', idx: 4 },
              ].map((s) => (
                <button
                  key={s.idx}
                  onClick={() =>
                    sendTvCommand(
                      { type: 'SET_SLIDE', index: s.idx },
                      setTvCommandToast,
                      `Слайд переключен: ${s.title}`
                    )
                  }
                  className="py-2.5 px-3 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-200 border border-stone-800 text-xs font-medium text-left flex items-center justify-between transition active:scale-98"
                >
                  <span>{s.title}</span>
                  <span className="text-[10px] text-amber-400 font-mono">№{s.idx + 1}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Language & Melodic Audio Chime */}
          <div className="p-4 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-3">
            <span className="text-xs font-extrabold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ro' ? 'Sunet Melodios & Limbă pe TV' : 'Звук и Язык на ТВ'}</span>
            </span>

            {/* Melodic Gong button */}
            <button
              onClick={() => {
                playMelodicChime();
                sendTvCommand({ type: 'CHIME' }, setTvCommandToast, '🔔 Мелодичный гонг воспроизведен на ТВ!');
              }}
              className="w-full py-3 px-3 rounded-2xl bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/50 text-xs font-bold transition active:scale-98 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
            >
              <Bell className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span>🔔 Гонг ТВ (Мелодичный звон бутика)</span>
            </button>

            {/* Language Selection: RO / RU / Auto RO⇄RU */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-stone-400 flex items-center justify-between">
                <span>{language === 'ro' ? 'Regim limbă ecran:' : 'Режим отображения языка на ТВ:'}</span>
                <span className="text-amber-400 font-bold uppercase">{remoteLangMode}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setRemoteLangMode('ro');
                    sendTvCommand({ type: 'SET_LANG_MODE', mode: 'ro' }, setTvCommandToast, '🌐 Язык на ТВ: Română');
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
                    sendTvCommand({ type: 'SET_LANG_MODE', mode: 'ru' }, setTvCommandToast, '🌐 Язык на ТВ: Русский');
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
                      '🔄 Авто-смена языка каждые 15 сек (RO ⇄ RU)'
                    );
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition active:scale-95 border ${
                    remoteLangMode === 'auto'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md font-extrabold animate-pulse'
                      : 'bg-stone-800 hover:bg-stone-750 text-emerald-400 border-stone-700'
                  }`}
                  title="Автоматическая смена языка каждые 15 секунд"
                >
                  🔄 RO ⇄ RU (Авто)
                </button>
              </div>
            </div>
          </div>

          {/* 4. Live Order Calling on TV */}
          <div className="p-4 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-emerald-400" />
                <span>{language === 'ro' ? 'Apel Comenzi pe TV' : 'Вызов заказов на экран ТВ'}</span>
              </span>
              <button
                onClick={() =>
                  sendTvCommand(
                    { type: 'CLEAR_READY_ORDERS' },
                    setTvCommandToast,
                    '✨ Выданные заказы очищены на экране ТВ'
                  )
                }
                className="text-[11px] text-amber-400/90 hover:text-amber-300 underline font-medium"
              >
                {language === 'ro' ? 'Curăță panoul' : 'Очистить табло'}
              </button>
            </div>

            <div className="space-y-1.5">
              {orders.filter((o) => o.status !== 'completed').map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    playMelodicChime();
                    sendTvCommand(
                      { type: 'CALL_ORDER', orderId: o.id, customerName: o.customerName },
                      setTvCommandToast,
                      `🔔 Вызов заказа ${o.id} (${o.customerName}) отправлен на ТВ!`
                    );
                  }}
                  className="w-full py-2.5 px-3 rounded-2xl bg-stone-950 hover:bg-stone-850 text-stone-200 border border-stone-800 text-xs font-semibold flex items-center justify-between transition active:scale-98 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-amber-400">{o.id}</span>
                    <span className="text-white font-bold">{o.customerName}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        o.status === 'ready'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {o.status === 'ready' ? 'ГОТОВ' : 'В РАБОТЕ'}
                    </span>
                  </div>
                  <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/60 px-2 py-1 rounded-xl border border-emerald-500/30">
                    <Bell className="w-3.5 h-3.5" />
                    <span>Позвать на ТВ</span>
                  </span>
                </button>
              ))}

              {/* Demo test call button */}
              <button
                onClick={() => {
                  playMelodicChime();
                  sendTvCommand(
                    { type: 'CALL_ORDER', orderId: '#104', customerName: 'Elena' },
                    setTvCommandToast,
                    '🔔 Демо-вызов #104 Elena отправлен на ТВ!'
                  );
                }}
                className="w-full py-2.5 px-3 rounded-2xl bg-stone-950/40 hover:bg-stone-900 text-stone-400 hover:text-stone-200 border border-dashed border-stone-700 text-xs font-medium flex items-center justify-center gap-1.5 transition active:scale-98"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Тест: позвать заказ #104 (Elena)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
