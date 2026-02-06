import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Settings, Search, Utensils, Loader2 } from 'lucide-react';
import { MenuItem, CartItem, ViewState, AppSettings, Category } from './types';
import { INITIAL_SETTINGS } from './constants';
import * as DataService from './services/dataService';
import * as Telegram from './services/telegramService';

// Components
import { MenuGrid } from './components/MenuGrid';
import { CartSheet } from './components/CartSheet';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';

function App() {
  // Global State
  const [view, setView] = useState<ViewState>('waiter');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  
  // Waiter View State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Initialize
  const refreshData = async () => {
    try {
      const [menuData, categoryData, settingsData] = await Promise.all([
        DataService.getMenu(),
        DataService.getCategories(),
        DataService.getSettings()
      ]);
      setMenu(menuData);
      setCategories(categoryData);
      setSettings(settingsData);
    } catch (error) {
      toast.error('Failed to load restaurant data.');
      console.error(error);
    }
  };

  useEffect(() => {
    const init = async () => {
      await refreshData();
      setIsLoading(false);
    };
    init();
  }, []);

  // Update Page Title when Restaurant Name changes
  useEffect(() => {
    if (settings.restaurantName) {
      document.title = settings.restaurantName;
    }
  }, [settings.restaurantName]);

  // -- Handlers: Admin --
  const handleAdminLoginSuccess = () => {
    setView('admin_dashboard');
  };

  const handleUpsertItem = async (item: MenuItem) => {
    await DataService.upsertMenuItem(item);
    await refreshData();
  };

  const handleDeleteItem = async (id: string) => {
    await DataService.deleteMenuItem(id);
    setMenu(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    await DataService.saveSettings(newSettings);
    setSettings(newSettings);
  };

  // Category Actions
  const handleAddCategory = async (name: string) => {
    await DataService.addCategory(name);
    await refreshData();
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    await DataService.updateCategoryName(oldName, newName);
    await refreshData();
  };

  const handleDeleteCategory = async (categoryName: string) => {
    await DataService.deleteCategory(categoryName);
    await refreshData();
  };

  const handleReorderCategories = async (newCategories: Category[]) => {
    setCategories(newCategories); // Optimistic UI update
    await DataService.updateCategoryOrder(newCategories);
  };

  // -- Handlers: Waiter --
  const handleAddToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`Added ${item.name}`);
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const handlePlaceOrder = async (tableNumber: string) => {
    setIsProcessingOrder(true);
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    try {
      await Telegram.sendOrderToTelegram(cart, tableNumber, total, settings);
      toast.custom((t) => (
        <div className="bg-green-600 text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <Utensils size={20} />
          </div>
          <div>
            <h3 className="font-bold">Order Sent to Kitchen!</h3>
            <p className="text-sm opacity-90">Table {tableNumber}</p>
          </div>
        </div>
      ), { duration: 4000 });
      setCart([]);
    } catch (error) {
      toast.error('Failed to send order. Check internet or settings.');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // -- Render Logic --

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mb-4 text-primary-600" size={48} />
        <p className="font-medium">Loading Menu...</p>
      </div>
    );
  }

  if (view === 'admin_login') {
    return <AdminLogin onLogin={handleAdminLoginSuccess} onBack={() => setView('waiter')} />;
  }

  if (view === 'admin_dashboard') {
    return (
      <>
        <Toaster position="top-right" />
        <AdminDashboard 
          menu={menu}
          categories={categories}
          settings={settings}
          onUpsertItem={handleUpsertItem}
          onDeleteItem={handleDeleteItem}
          onUpdateSettings={handleUpdateSettings}
          onAddCategory={handleAddCategory}
          onRenameCategory={handleRenameCategory}
          onDeleteCategory={handleDeleteCategory}
          onReorderCategories={handleReorderCategories}
          onLogout={() => setView('admin_login')}
          onExit={() => setView('waiter')}
          loading={false}
        />
      </>
    );
  }

  // Filtered Menu
  const filteredItems = menu.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-900">
      <Toaster position="top-center" />
      
      {/* Navbar */}
      <nav className="bg-white sticky top-0 z-20 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary-600 text-white p-2 rounded-lg">
              <Utensils size={20} />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-gray-900">{settings.restaurantName}</h1>
          </div>
          <button 
            onClick={() => setView('admin_login')}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
            aria-label="Admin Settings"
          >
            <Settings size={22} />
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* Search & Header */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Categories (Ordered from DB) */}
        <div className="mb-8 overflow-x-auto no-scrollbar pb-2">
          <div className="flex gap-2">
            <button
                onClick={() => setSelectedCategory('All')}
                className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-semibold transition-all ${
                  selectedCategory === 'All'
                    ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-semibold transition-all ${
                  selectedCategory === cat.name
                    ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <MenuGrid 
          items={filteredItems}
          settings={settings}
          onAddToCart={handleAddToCart}
        />
      </main>

      {/* Cart Sheet */}
      <CartSheet 
        cart={cart}
        settings={settings}
        onUpdateQuantity={handleUpdateCartQuantity}
        onClearCart={() => setCart([])}
        onPlaceOrder={handlePlaceOrder}
        isProcessing={isProcessingOrder}
      />
    </div>
  );
}

export default App;