import { MenuItem, AppSettings } from './types';

export const INITIAL_SETTINGS: AppSettings = {
  restaurantName: 'Gourmet Bistro',
  telegramBotToken: '',
  telegramChatId: '',
  currency: '$',
};

export const INITIAL_MENU: MenuItem[] = [
  {
    id: '1',
    name: 'Classic Cheeseburger',
    description: 'Angus beef patty, cheddar, lettuce, tomato, house sauce.',
    price: 12.99,
    category: 'Mains',
    image: 'https://picsum.photos/400/300?random=1',
    available: true,
  },
  {
    id: '2',
    name: 'Truffle Fries',
    description: 'Crispy shoestring fries tossed in truffle oil and parmesan.',
    price: 6.50,
    category: 'Sides',
    image: 'https://picsum.photos/400/300?random=2',
    available: true,
  },
  {
    id: '3',
    name: 'Caesar Salad',
    description: 'Romaine hearts, garlic croutons, shaved parmesan.',
    price: 10.00,
    category: 'Starters',
    image: 'https://picsum.photos/400/300?random=3',
    available: true,
  },
  {
    id: '4',
    name: 'Grilled Salmon',
    description: 'Fresh salmon fillet with asparagus and lemon butter.',
    price: 18.50,
    category: 'Mains',
    image: 'https://picsum.photos/400/300?random=4',
    available: true,
  },
  {
    id: '5',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with a molten center, served with vanilla ice cream.',
    price: 8.00,
    category: 'Desserts',
    image: 'https://picsum.photos/400/300?random=5',
    available: true,
  },
  {
    id: '6',
    name: 'Iced Lemon Tea',
    description: 'House-brewed black tea with fresh lemon slices.',
    price: 4.50,
    category: 'Drinks',
    image: 'https://picsum.photos/400/300?random=6',
    available: true,
  },
];

export const CATEGORIES = ['All', 'Mains', 'Starters', 'Sides', 'Desserts', 'Drinks'];
