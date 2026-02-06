export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface AppSettings {
  restaurantName: string;
  telegramBotToken: string;
  telegramChatId: string;
  currency: string;
}

export type ViewState = 'waiter' | 'admin_login' | 'admin_dashboard';
