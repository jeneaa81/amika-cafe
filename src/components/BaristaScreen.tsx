import { useState } from 'react';
import type { Order, OrderStatus, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { Clock, CheckCircle, Send, Cake, Coffee, Tv } from 'lucide-react';
import { PRODUCTS } from '../data/products';

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
  const [activeTab, setActiveTab] = useState<'orders' | 'flash_sale'>('orders');
  const [selectedDessertId, setSelectedDessertId] = useState<string>('fb-01');
  const [discountPercent, setDiscountPercent] = useState<number>(30);
  const [broadcastSent, setBroadcastSent] = useState<boolean>(false);

  // Filter only desserts for flash sale
  const desserts = PRODUCTS.filter((p) => p.category === 'foodberry');
  const selectedDessert = PRODUCTS.find((p) => p.id === selectedDessertId) || desserts[0];
  const discountedPrice = Math.round(selectedDessert.price * (1 - discountPercent / 100));

  const handleSendBroadcast = () => {
    setBroadcastSent(true);
    setTimeout(() => {
      // Auto-hide alert after 8 seconds
    }, 8000);
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
      <div className="grid grid-cols-2 gap-2 bg-stone-950 p-1.5 rounded-2xl border border-stone-800">
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'orders'
              ? 'bg-amber-600 text-stone-950 shadow-md font-extrabold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>
            {t.tabLiveOrders} ({orders.filter((o) => o.status !== 'completed').length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('flash_sale')}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'flash_sale'
              ? 'bg-rose-600 text-white shadow-md font-extrabold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Cake className="w-4 h-4" />
          <span>{t.tabFlashSale}</span>
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
                        onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95"
                      >
                        <span>{t.btnAccept}</span>
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        onClick={() => onUpdateOrderStatus(order.id, 'ready')}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{t.btnReady}</span>
                      </button>
                    )}

                    {isReady && (
                      <button
                        onClick={() => onUpdateOrderStatus(order.id, 'completed')}
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
    </div>
  );
};
