export type Language = 'ro' | 'ru';

export type Category = 'all' | 'coffee' | 'matcha_tea' | 'foodberry' | 'breakfast';

export interface ProductOption {
  id: string;
  name: Record<Language, string>;
  extraPrice: number;
}

export interface Product {
  id: string;
  name: Record<Language, string>;
  description: Record<Language, string>;
  price: number;
  secondPrice?: number;
  category: Category;
  image: string;
  badge?: Record<Language, string>;
  volume?: string;
  secondVolume?: string;
  isFoodberry?: boolean;
  options?: {
    milk?: boolean;
    syrup?: boolean;
    temperature?: boolean;
    dose?: boolean;
  };
}

export interface CartItemOption {
  milk?: string;
  syrup?: string;
  temperature?: 'hot' | 'iced';
  dose?: 'single' | 'double';
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  options: CartItemOption;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PaymentMethod = 'pickup' | 'mia';

export interface Order {
  id: string;
  telegramUserId?: number;
  items: CartItem[];
  totalAmount: number;
  pickupTime: string;
  paymentMethod: PaymentMethod;
  customerName: string;
  customerPhone: string;
  notes?: string;
  status: OrderStatus;
  createdAt: string;
}

export interface LoyaltyCard {
  cardNumber: string;
  telegramUserId?: number;
  customerName?: string;
  currentStamps: number; // 0 to 6
  totalFreeCoffeesEarned: number;
  lastUpdated: string;
}

export interface FlashSaleCampaign {
  id: string;
  productId: string;
  productName: Record<Language, string>;
  discountPercent: number;
  originalPrice: number;
  salePrice: number;
  activeUntil: string;
  subscribersNotifiedCount: number;
}
