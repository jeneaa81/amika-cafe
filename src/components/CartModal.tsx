import { useState } from 'react';
import { X, Trash2, Plus, Minus, Clock, CreditCard, Banknote, CheckCircle, ArrowRight, Smartphone } from 'lucide-react';
import type { CartItem, Language, PaymentMethod, Order } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface CartModalProps {
  language: Language;
  cartItems: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onClearCart: () => void;
  onSubmitOrder: (orderData: {
    pickupTime: string;
    paymentMethod: PaymentMethod;
    customerName: string;
    customerPhone: string;
    notes?: string;
  }) => Order;
}

export const CartModal: React.FC<CartModalProps> = ({
  language,
  cartItems,
  onClose,
  onUpdateQuantity,
  onClearCart,
  onSubmitOrder,
}) => {
  const t = TRANSLATIONS[language];
  const [pickupTime, setPickupTime] = useState<string>('in_10');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pickup');

  const tgWebApp = typeof window !== 'undefined'
    ? (window as unknown as {
        Telegram?: {
          WebApp?: {
            initDataUnsafe?: {
              user?: { id?: number; first_name?: string; last_name?: string };
            };
            requestContact?: (callback: (shared: boolean, res?: any) => void) => void;
          };
        };
      }).Telegram?.WebApp
    : null;

  const tgUser = tgWebApp?.initDataUnsafe?.user;

  const getInitialPhone = (): string => {
    try {
      const stored = localStorage.getItem('amika_customer_phone');
      if (stored && stored.trim()) return stored.trim();
    } catch {}
    return '';
  };

  const getInitialName = (): string => {
    try {
      const stored = localStorage.getItem('amika_customer_name');
      if (stored && stored.trim()) return stored.trim();
    } catch {}
    if (tgUser?.first_name) {
      return `${tgUser.first_name} ${tgUser.last_name || ''}`.trim();
    }
    return language === 'ro' ? 'Oaspete' : 'Гость';
  };

  const [customerName, setCustomerName] = useState<string>(getInitialName);
  const [customerPhone, setCustomerPhone] = useState<string>(getInitialPhone);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // If no phone stored yet, attempt to request contact or check Telegram
  const handleRequestContact = () => {
    try {
      if (tgWebApp?.requestContact) {
        tgWebApp.requestContact((shared: boolean, res?: any) => {
          if (shared && res) {
            let phone = '';
            if (typeof res === 'object') {
              phone = res.responseUnsafe?.contact?.phone_number || res.contact?.phone_number || '';
            }
            if (phone) {
              if (!phone.startsWith('+')) {
                phone = '+' + phone;
              }
              setCustomerPhone(phone);
              try {
                localStorage.setItem('amika_customer_phone', phone);
              } catch {}
            }
          }
        });
      }
    } catch (err) {
      console.warn('Telegram requestContact error:', err);
    }
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const getPickupLabel = (timeKey: string): string => {
    switch (timeKey) {
      case 'in_5':
        return t.pickupIn5;
      case 'in_10':
        return t.pickupIn10;
      case 'in_15':
        return t.pickupIn15;
      default:
        return t.pickupIn10;
    }
  };

  const handleSendOrder = () => {
    if (cartItems.length === 0) return;

    const order = onSubmitOrder({
      pickupTime: getPickupLabel(pickupTime),
      paymentMethod,
      customerName: customerName.trim() || (language === 'ro' ? 'Oaspete' : 'Гость'),
      customerPhone: customerPhone.trim() || '+373 60 000 000',
      notes: orderNotes.trim() || undefined,
    });

    try {
      if (customerPhone.trim()) {
        localStorage.setItem('amika_customer_phone', customerPhone.trim());
      }
      if (customerName.trim()) {
        localStorage.setItem('amika_customer_name', customerName.trim());
      }
    } catch {}

    setCreatedOrder(order);
    onClearCart();

    // Trigger Telegram Mini App Haptic feedback if opened inside Telegram
    try {
      const tg = (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: { notificationOccurred: (s: string) => void } } } }).Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
    } catch {
      // ignore outside Telegram
    }
  };

  // If order was created successfully, show confirmation screen
  if (createdOrder) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
        <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 text-center shadow-2xl space-y-5 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
            <CheckCircle className="w-9 h-9" />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              {t.orderNumberLabel} {createdOrder.id}
            </span>
            <h3 className="text-xl font-bold text-white font-serif mt-1">
              {t.orderSuccessTitle}
            </h3>
            <p className="text-xs text-stone-300 mt-2 leading-relaxed">
              {t.orderSuccessDesc}
            </p>
          </div>

          {/* Details summary */}
          <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 text-left text-xs space-y-2">
            <div className="flex justify-between text-stone-300">
              <span className="text-stone-400">{t.orderPickupEst}</span>
              <span className="font-bold text-amber-400">{createdOrder.pickupTime}</span>
            </div>
            <div className="flex justify-between text-stone-300">
              <span className="text-stone-400">{t.paymentMethodTitle}</span>
              <span className="font-medium text-white">
                {createdOrder.paymentMethod === 'mia' ? 'MIA Plăți Instant' : 'Numerar / Card la casă'}
              </span>
            </div>
            <div className="flex justify-between border-t border-stone-800 pt-2 text-sm font-bold text-white">
              <span>{t.orderSummary}</span>
              <span className="text-amber-400">{createdOrder.totalAmount} {t.mdl}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm shadow-md transition active:scale-95"
          >
            {language === 'ro' ? 'Am înțeles, revin la meniu' : 'Понятно, вернуться в меню'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-stone-950/80 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-white text-base font-serif">
              {t.cartTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-stone-850 text-stone-400 hover:text-white border border-stone-700/60 transition active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {cartItems.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-stone-300 font-bold text-sm">{t.emptyCartTitle}</p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                {t.emptyCartDesc}
              </p>
            </div>
          ) : (
            <>
              {/* Item List */}
              <div className="space-y-2.5">
                {cartItems.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800/80 flex items-center gap-3"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name[language]}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {item.product.name[language]}
                      </h4>
                      {/* Modifiers info */}
                      <div className="text-[10px] text-stone-400 space-x-1.5 truncate">
                        {item.options.dose && (
                          <span className="text-amber-400 font-bold bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                            {item.options.dose === 'double'
                              ? (item.product.secondVolume || (language === 'ro' ? 'Dublu' : 'Двойной'))
                              : (item.product.volume || (language === 'ro' ? 'Solo' : 'Одинарный'))}
                          </span>
                        )}
                        {item.options.temperature && (
                          <span className="text-amber-300">
                            {item.options.temperature === 'hot' ? 'Fierbinte' : 'Rece'}
                          </span>
                        )}
                        {item.options.milk && item.options.milk !== 'regular' && (
                          <span>• {item.options.milk}</span>
                        )}
                        {item.options.syrup && item.options.syrup !== 'none' && (
                          <span>• {item.options.syrup}</span>
                        )}
                      </div>
                      <div className="text-xs font-extrabold text-amber-400 mt-1">
                        {item.totalPrice} {t.mdl}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-700/60 rounded-xl p-1">
                      <button
                        onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition active:scale-90"
                      >
                        {item.quantity === 1 ? (
                          <Trash2 className="w-3 h-3 text-rose-400" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition active:scale-90"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pickup Time Choice */}
              <div className="pt-3 border-t border-stone-800 space-y-2">
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t.pickupTimeTitle}</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'in_5', label: '5 min' },
                    { id: 'in_10', label: '10 min ⭐' },
                    { id: 'in_15', label: '15 min' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setPickupTime(btn.id)}
                      className={`py-2 px-2 rounded-xl border text-center font-semibold transition ${
                        pickupTime === btn.id
                          ? 'bg-amber-600 text-stone-950 border-amber-400 font-bold shadow-md'
                          : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-750'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="pt-2 border-t border-stone-800 space-y-2">
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t.paymentMethodTitle}</span>
                </label>
                <div className="space-y-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pickup')}
                    className={`w-full p-2.5 rounded-xl border flex items-center gap-2.5 transition text-left ${
                      paymentMethod === 'pickup'
                        ? 'bg-amber-600/20 border-amber-500 text-amber-200'
                        : 'bg-stone-800/60 border-stone-700/60 text-stone-300'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="flex-1 font-medium">{t.paymentPickup}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mia')}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition text-left ${
                      paymentMethod === 'mia'
                        ? 'bg-amber-600/20 border-amber-500 text-amber-200'
                        : 'bg-stone-800/60 border-stone-700/60 text-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-medium">{t.paymentMia}</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Instant
                    </span>
                  </button>
                </div>
              </div>

              {/* Contact Data */}
              <div className="pt-2 border-t border-stone-800 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">
                    {t.customerNameLabel}
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-xl text-white font-medium focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-stone-400">
                      {t.customerPhoneLabel}
                    </label>
                    {tgWebApp?.requestContact && (
                      <button
                        type="button"
                        onClick={handleRequestContact}
                        className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer"
                        title={language === 'ro' ? 'Autocompletare număr din Telegram' : 'Вставить номер из Telegram'}
                      >
                        <Smartphone className="w-3 h-3 text-amber-400" />
                        <span>{language === 'ro' ? 'Nr. Telegram' : 'Номер Telegram'}</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="tel"
                    placeholder="+373 69 000 000"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      try {
                        localStorage.setItem('amika_customer_phone', e.target.value);
                      } catch {}
                    }}
                    className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-xl text-white font-medium focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Order Notes */}
              <div>
                <label className="text-[10px] text-stone-400 block mb-1">
                  {t.orderNotesLabel}
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder={language === 'ro' ? 'Ex: fără zahăr, puțin mai fierbinte' : 'Например: без сахара, погорячее'}
                  className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-xl text-white text-xs outline-none focus:border-amber-500"
                />
              </div>
            </>
          )}
        </div>

        {/* Action Footer */}
        {cartItems.length > 0 && (
          <div className="p-4 bg-stone-950 border-t border-stone-800 mt-auto flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-stone-400 block uppercase tracking-wider">
                {t.orderSummary}
              </span>
              <span className="text-xl font-black text-amber-400">
                {totalAmount} <span className="text-xs font-semibold text-stone-300">{t.mdl}</span>
              </span>
            </div>

            <button
              onClick={handleSendOrder}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-stone-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 transition active:scale-95"
            >
              <span>{t.btnSendOrder}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
