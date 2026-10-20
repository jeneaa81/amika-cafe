import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { ProductCustomizerModal } from './components/ProductCustomizerModal';
import { LoyaltyModal } from './components/LoyaltyModal';
import { CartModal } from './components/CartModal';
import { BaristaScreen } from './components/BaristaScreen';
import { TvMenuBoard } from './components/TvMenuBoard';
import { BottomNav } from './components/BottomNav';
import { PRODUCTS } from './data/products';
import { TRANSLATIONS } from './data/translations';
import type {
  Language,
  Category,
  Product,
  CartItem,
  CartItemOption,
  LoyaltyCard,
  Order,
  OrderStatus,
  PaymentMethod,
} from './types';
import { Search, Sparkles, Clock, HeartHandshake } from 'lucide-react';

// Soft audio chime using Web Audio API for interactive demos
function playChime(freq = 587.33) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // Audio context may be blocked by browser policy until interaction
  }
}

export function App() {
  const [language, setLanguage] = useState<Language>('ro');
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isBaristaMode, setIsBaristaMode] = useState<boolean>(false);
  const [isTvMode, setIsTvMode] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'tv' || window.location.hash === '#tv';
  });

  const handleOpenTvMode = () => {
    setIsTvMode(true);
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'tv');
    window.history.pushState(null, '', url.toString());
  };

  const handleExitTvMode = () => {
    setIsTvMode(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('mode');
    window.history.pushState(null, '', url.pathname + (url.search ? url.search : ''));
  };

  // Modals
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState<boolean>(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState<boolean>(false);

  // Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Loyalty Card (starts with 4/6 stamps for demonstration excitement!)
  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCard>({
    cardNumber: 'AMIKA-8492',
    currentStamps: 4,
    totalFreeCoffeesEarned: 1,
    lastUpdated: new Date().toISOString(),
  });

  // Orders queue (pre-seeded with 1 demo order for Cricova)
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '#102',
      items: [
        {
          cartItemId: 'item-demo-1',
          product: PRODUCTS[0], // Cappuccino
          quantity: 1,
          options: { milk: 'regular', temperature: 'hot' },
          unitPrice: 40,
          totalPrice: 40,
        },
        {
          cartItemId: 'item-demo-2',
          product: PRODUCTS[6], // Croissant Migdale Foodberry
          quantity: 1,
          options: {},
          unitPrice: 42,
          totalPrice: 42,
        },
      ],
      totalAmount: 82,
      pickupTime: 'Peste 5 min',
      paymentMethod: 'pickup',
      customerName: 'Mihai',
      customerPhone: '+373 68 554 112',
      status: 'new',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const t = TRANSLATIONS[language];

  // Initialize Telegram WebApp SDK if running inside Telegram
  useEffect(() => {
    const tg = (window as unknown as { Telegram?: { WebApp?: { ready: () => void; expand: () => void } } }).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, []);

  // Filter products
  const filteredProducts = PRODUCTS.filter((product) => {
    const matchesCategory =
      activeCategory === 'all' || product.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      product.name[language].toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description[language].toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cart operations
  const handleAddToCart = (product: Product, options: CartItemOption, unitPrice: number) => {
    playChime(659.25);
    const cartItemId = `${product.id}-${options.milk || 'def'}-${options.syrup || 'def'}-${options.temperature || 'def'}`;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.cartItemId === cartItemId
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          product,
          quantity: 1,
          options,
          unitPrice,
          totalPrice: unitPrice,
        },
      ];
    });
  };

  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    } else {
      setCartItems((prev) =>
        prev.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: newQty, totalPrice: newQty * item.unitPrice }
            : item
        )
      );
    }
  };

  const handleClearCart = () => setCartItems([]);

  // Loyalty Card operations
  const handleAddStamp = () => {
    playChime(880);
    setLoyaltyCard((prev) => {
      const nextStamps = prev.currentStamps >= 6 ? 1 : prev.currentStamps + 1;
      const freeCoffees =
        prev.currentStamps + 1 === 6
          ? prev.totalFreeCoffeesEarned + 1
          : prev.totalFreeCoffeesEarned;
      return {
        ...prev,
        currentStamps: nextStamps,
        totalFreeCoffeesEarned: freeCoffees,
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  const handleResetCard = () => {
    setLoyaltyCard((prev) => ({
      ...prev,
      currentStamps: 0,
      lastUpdated: new Date().toISOString(),
    }));
  };

  // Submit new order from Cart
  const handleSubmitOrder = (orderData: {
    pickupTime: string;
    paymentMethod: PaymentMethod;
    customerName: string;
    customerPhone: string;
    notes?: string;
  }): Order => {
    playChime(783.99);
    const maxId = orders.reduce((max, o) => {
      const num = parseInt(o.id.replace(/\D/g, ''), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 102);
    const newOrderId = `#${maxId + 1}`;
    const newOrder: Order = {
      id: newOrderId,
      items: [...cartItems],
      totalAmount: cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
      pickupTime: orderData.pickupTime,
      paymentMethod: orderData.paymentMethod,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      notes: orderData.notes,
      status: 'new',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  // Update order status in Barista Screen
  const handleUpdateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    playChime(523.25);
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order))
    );
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  if (isTvMode) {
    return (
      <TvMenuBoard
        language={language}
        onLanguageChange={setLanguage}
        orders={orders}
        onExitTvMode={handleExitTvMode}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans pb-24 selection:bg-amber-600 selection:text-white">
      {/* Sticky Header */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        isBaristaMode={isBaristaMode}
        onToggleBaristaMode={() => setIsBaristaMode(!isBaristaMode)}
        onOpenLoyalty={() => setIsLoyaltyModalOpen(true)}
        onOpenTvMode={handleOpenTvMode}
        stampsCount={loyaltyCard.currentStamps}
      />

      {/* VIEW: BARISTA TERMINAL vs CLIENT VIEW */}
      {isBaristaMode ? (
        <main className="flex-1">
          <BaristaScreen
            language={language}
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onExitBaristaMode={() => setIsBaristaMode(false)}
            onOpenTvMode={handleOpenTvMode}
          />
        </main>
      ) : (
        <main className="flex-1 max-w-md mx-auto w-full px-4 pt-3 space-y-4">
          {/* HERO PROMO CARD */}
          <div className="relative rounded-3xl p-5 overflow-hidden bg-gradient-to-br from-amber-950/80 via-stone-900 to-stone-900 border border-amber-500/30 shadow-2xl">
            {/* Background glow & elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white shadow-sm flex items-center gap-1">
                  <HeartHandshake className="w-3 h-3" />
                  <span>{t.badgePartner}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Cricova
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black text-white font-serif leading-tight">
                  {t.heroTitle}
                </h2>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                  {t.heroSubtitle}
                </p>
              </div>

              {/* Action Buttons in Hero */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={() => setIsLoyaltyModalOpen(true)}
                  className="flex-1 py-2.5 px-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/40 transition active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.btnLoyalty} ({loyaltyCard.currentStamps}/6)</span>
                </button>

                <button
                  onClick={() => setIsCartModalOpen(true)}
                  className="py-2.5 px-3.5 rounded-2xl bg-stone-800/90 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.btnOrderFast}</span>
                </button>
              </div>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-900 border border-stone-800 rounded-2xl text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* CATEGORIES HORIZONTAL SWIPER */}
          <div className="-mx-4">
            <CategoryFilter
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              language={language}
            />
          </div>

          {/* PRODUCT GRID */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-400 px-1">
              <span>
                {language === 'ro' ? 'Meniu Amika Cafe' : 'Меню Amika Cafe'} (
                {filteredProducts.length})
              </span>
              {activeCategory === 'foodberry' && (
                <span className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Livrări proaspete zilnic</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => {
                const quantityInCart = cartItems
                  .filter((item) => item.product.id === product.id)
                  .reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    language={language}
                    onSelect={(p) => setCustomizingProduct(p)}
                    quantityInCart={quantityInCart}
                  />
                );
              })}
            </div>
          </div>
        </main>
      )}

      {/* MODALS */}
      {/* 1. Product Customizer */}
      {customizingProduct && (
        <ProductCustomizerModal
          product={customizingProduct}
          language={language}
          onClose={() => setCustomizingProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* 2. Digital Loyalty Stamp Card */}
      {isLoyaltyModalOpen && (
        <LoyaltyModal
          language={language}
          loyaltyCard={loyaltyCard}
          onClose={() => setIsLoyaltyModalOpen(false)}
          onAddStamp={handleAddStamp}
          onResetCard={handleResetCard}
        />
      )}

      {/* 3. Cart & Pre-Order */}
      {isCartModalOpen && (
        <CartModal
          language={language}
          cartItems={cartItems}
          onClose={() => setIsCartModalOpen(false)}
          onUpdateQuantity={handleUpdateQuantity}
          onClearCart={handleClearCart}
          onSubmitOrder={handleSubmitOrder}
        />
      )}

      {/* BOTTOM MOBILE NAVIGATION BAR */}
      <BottomNav
        activeTab={
          isBaristaMode
            ? 'barista'
            : isCartModalOpen
            ? 'cart'
            : isLoyaltyModalOpen
            ? 'loyalty'
            : 'menu'
        }
        onChangeTab={(tab) => {
          if (tab === 'menu') {
            setIsBaristaMode(false);
            setIsCartModalOpen(false);
            setIsLoyaltyModalOpen(false);
          } else if (tab === 'loyalty') {
            setIsBaristaMode(false);
            setIsCartModalOpen(false);
            setIsLoyaltyModalOpen(true);
          } else if (tab === 'cart') {
            setIsBaristaMode(false);
            setIsLoyaltyModalOpen(false);
            setIsCartModalOpen(true);
          } else if (tab === 'barista') {
            setIsCartModalOpen(false);
            setIsLoyaltyModalOpen(false);
            setIsBaristaMode(true);
          }
        }}
        language={language}
        cartCount={cartCount}
        cartTotal={cartTotal}
        stampsCount={loyaltyCard.currentStamps}
        isBaristaMode={isBaristaMode}
      />
    </div>
  );
}
export default App;
