import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Save, Trash2, Plus, Edit2, Utensils, Sliders, X, Loader2, ToggleLeft, ToggleRight, Check, ChevronDown, List, ArrowUp, ArrowDown } from 'lucide-react';
import { MenuItem, AppSettings, Category } from '../types';
import toast from 'react-hot-toast';

interface AdminDashboardProps {
  menu: MenuItem[];
  categories: Category[]; // New Prop
  settings: AppSettings;
  onUpsertItem: (item: MenuItem) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onUpdateSettings: (settings: AppSettings) => Promise<void>;
  // Category Actions
  onAddCategory: (name: string) => Promise<void>;
  onRenameCategory: (oldName: string, newName: string) => Promise<void>;
  onDeleteCategory: (categoryName: string) => Promise<void>;
  onReorderCategories: (categories: Category[]) => Promise<void>;
  
  onLogout: () => void;
  onExit: () => void;
  loading: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  menu,
  categories,
  settings,
  onUpsertItem,
  onDeleteItem,
  onUpdateSettings,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onReorderCategories,
  onLogout,
  onExit,
  loading: parentLoading
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'categories' | 'settings'>('menu');
  
  // Menu Editing State
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Settings State
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  // Category Tab State
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  // Handlers
  const handleSaveItem = async () => {
    if (!editingItem || !editingItem.name || !editingItem.price) {
        toast.error('Name and Price are required');
        return;
    }

    setIsSaving(true);
    const newItem: MenuItem = {
      id: editingItem.id || crypto.randomUUID(),
      name: editingItem.name,
      description: editingItem.description || '',
      price: Number(editingItem.price),
      // Fallback to first category if current is invalid, or 'Uncategorized' if list is empty
      category: editingItem.category || (categories.length > 0 ? categories[0].name : 'Uncategorized'),
      image: editingItem.image || `https://picsum.photos/400/300?random=${Date.now()}`,
      available: editingItem.available ?? true,
    };

    try {
      await onUpsertItem(newItem);
      toast.success(editingItem.id ? 'Item updated' : 'Item added');
      setEditingItem(null);
      setIsFormOpen(false);
    } catch (error) {
      toast.error('Failed to save item');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickToggle = async (item: MenuItem) => {
    try {
      await onUpsertItem({ ...item, available: !item.available });
      toast.success(`${item.name} is now ${!item.available ? 'Available' : 'Sold Out'}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (window.confirm('Are you sure you want to delete this item?')) {
      setDeletingId(id);
      try {
        await onDeleteItem(id);
        toast.success('Item deleted');
      } catch (error) {
        console.error("Delete failed:", error);
        toast.error('Failed to delete item');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await onUpdateSettings(localSettings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Category Handlers ---
  const handleAddCategory = async () => {
    if(!newCatName.trim()) return;
    setIsSaving(true);
    try {
      await onAddCategory(newCatName.trim());
      setNewCatName('');
      toast.success('Category added');
    } catch(e) {
      toast.error('Failed to add category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRenameCat = async (cat: Category) => {
    if (!editingCatName.trim() || editingCatName === cat.name) {
      setEditingCatId(null);
      return;
    }
    try {
      await onRenameCategory(cat.name, editingCatName.trim());
      toast.success('Renamed successfully');
    } catch (e) {
      toast.error('Rename failed');
    } finally {
      setEditingCatId(null);
    }
  };

  const handleDeleteCatClick = async (cat: Category) => {
    if(window.confirm(`Delete "${cat.name}"? Items will become 'Uncategorized'.`)) {
      setDeletingCatId(cat.id);
      try {
        await onDeleteCategory(cat.name);
        toast.success('Category deleted');
      } catch (e) {
        toast.error('Failed to delete category');
      } finally {
        setDeletingCatId(null);
      }
    }
  };

  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    const newCats = [...categories];
    if (direction === 'up' && index > 0) {
      [newCats[index], newCats[index - 1]] = [newCats[index - 1], newCats[index]];
    } else if (direction === 'down' && index < newCats.length - 1) {
      [newCats[index], newCats[index + 1]] = [newCats[index + 1], newCats[index]];
    } else {
      return;
    }

    // Update sort_order based on new index
    const updatedCats = newCats.map((cat, idx) => ({ ...cat, sort_order: idx }));
    
    // Optimistic UI update could happen here in parent, but we await mostly for DB
    try {
      await onReorderCategories(updatedCats);
      // Parent should refresh categories
    } catch(e) {
      toast.error('Failed to reorder');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Admin Header */}
      <header className="bg-white shadow-sm z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onExit} className="text-gray-500 hover:text-gray-900 p-1">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            {parentLoading && <Loader2 className="animate-spin text-primary-600" size={20} />}
          </div>
          <button onClick={onLogout} className="text-red-600 font-medium text-sm hover:underline">
            Log Out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex gap-8">
          <button
            onClick={() => setActiveTab('menu')}
            className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'menu' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Utensils size={18} />
            Menu
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'categories' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <List size={18} />
            Categories
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'settings' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sliders size={18} />
            Settings
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h2 className="text-lg font-semibold text-gray-700">All Items ({menu.length})</h2>
               <button 
                onClick={() => {
                  setEditingItem({ 
                    category: categories.length > 0 ? categories[0].name : 'Uncategorized', 
                    available: true 
                  });
                  setIsFormOpen(true);
                }}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors"
               >
                 <Plus size={18} />
                 Add New Item
               </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Item</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Price</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">Status</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {menu.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                            <div>
                              <div className="font-medium text-gray-900">{item.name}</div>
                              <div className="text-xs text-gray-400 truncate max-w-[200px]">{item.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">{item.category}</td>
                        <td className="p-4 text-sm font-medium text-gray-900">{settings.currency}{item.price.toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <button 
                            type="button"
                            onClick={() => handleQuickToggle(item)}
                            className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full transition-all active:scale-95 ${
                            item.available 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}>
                            {item.available ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                            {item.available ? 'Active' : 'Sold Out'}
                          </button>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <div className="flex justify-end gap-2">
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingItem(item);
                                setIsFormOpen(true);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Item"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              type="button"
                              disabled={deletingId === item.id}
                              onClick={(e) => handleDeleteItem(item.id, e)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete Item"
                            >
                              {deletingId === item.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
           <div className="max-w-3xl mx-auto space-y-6">
             <div className="flex justify-between items-center">
               <h2 className="text-lg font-semibold text-gray-700">Manage Categories</h2>
             </div>
             
             {/* Add New */}
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-2">
               <input 
                  type="text" 
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="New Category Name..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
               />
               <button 
                  onClick={handleAddCategory}
                  disabled={!newCatName.trim() || isSaving}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
               >
                 {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                 Add
               </button>
             </div>

             {/* List */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase w-16 text-center">Order</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Category Name</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {categories.map((cat, index) => (
                      <tr key={cat.id} className="hover:bg-gray-50/50 group">
                         <td className="p-4 text-center">
                            <div className="flex flex-col items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                               <button 
                                disabled={index === 0}
                                onClick={() => handleMoveCategory(index, 'up')}
                                className="hover:text-primary-600 disabled:opacity-30"
                               >
                                 <ArrowUp size={16} />
                               </button>
                               <button 
                                disabled={index === categories.length - 1}
                                onClick={() => handleMoveCategory(index, 'down')}
                                className="hover:text-primary-600 disabled:opacity-30"
                               >
                                 <ArrowDown size={16} />
                               </button>
                            </div>
                         </td>
                         <td className="p-4">
                            {editingCatId === cat.id ? (
                               <div className="flex gap-2 max-w-sm">
                                  <input 
                                    autoFocus
                                    className="flex-1 px-2 py-1 border border-primary-300 rounded outline-none"
                                    value={editingCatName}
                                    onChange={(e) => setEditingCatName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRenameCat(cat)}
                                  />
                                  <button onClick={() => handleRenameCat(cat)} className="text-green-600"><Check size={20} /></button>
                                  <button onClick={() => setEditingCatId(null)} className="text-gray-400"><X size={20} /></button>
                               </div>
                            ) : (
                               <span className="font-medium text-gray-900">{cat.name}</span>
                            )}
                         </td>
                         <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                               <button 
                                onClick={() => {
                                  setEditingCatId(cat.id);
                                  setEditingCatName(cat.name);
                                }}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Rename"
                               >
                                 <Edit2 size={18} />
                               </button>
                               <button 
                                disabled={deletingCatId === cat.id}
                                onClick={() => handleDeleteCatClick(cat)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                title="Delete"
                               >
                                 {deletingCatId === cat.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                               </button>
                            </div>
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
           </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">General Settings</h3>
                <p className="text-sm text-gray-500">Configure your restaurant identity.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                  <input
                    type="text"
                    value={localSettings.restaurantName}
                    onChange={(e) => setLocalSettings({...localSettings, restaurantName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={localSettings.currency}
                    onChange={(e) => setLocalSettings({...localSettings, currency: e.target.value})}
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Telegram Integration</h3>
                <p className="text-sm text-gray-500 mb-4">Configure the bot to receive orders.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bot Token</label>
                    <input
                      type="password"
                      value={localSettings.telegramBotToken}
                      onChange={(e) => setLocalSettings({...localSettings, telegramBotToken: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                      placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chat ID</label>
                    <input
                      type="text"
                      value={localSettings.telegramChatId}
                      onChange={(e) => setLocalSettings({...localSettings, telegramChatId: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                      placeholder="-100123456789"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit/Add Modal */}
      {isFormOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                {editingItem.id ? 'Edit Item' : 'New Item'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editingItem.name || ''}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.price || ''}
                    onChange={(e) => setEditingItem({...editingItem, price: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                {/* Category Selector with Safe Fallback */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                   <select 
                     value={editingItem.category}
                     onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                   >
                     {/* Ensure the current category is always an option, even if missing from list */}
                     {editingItem.category && !categories.some(c => c.name === editingItem.category) && (
                       <option value={editingItem.category}>{editingItem.category} (Legacy)</option>
                     )}
                     
                     {categories.map(cat => (
                       <option key={cat.id} value={cat.name}>{cat.name}</option>
                     ))}
                   </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="text"
                  value={editingItem.image || ''}
                  onChange={(e) => setEditingItem({...editingItem, image: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="https://..."
                />
              </div>
               <div className="flex items-center gap-3 py-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={editingItem.available}
                    onChange={(e) => setEditingItem({...editingItem, available: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-900">Available</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsFormOpen(false)}
                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveItem}
                disabled={isSaving}
                className="px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 shadow-lg shadow-primary-500/30 flex items-center gap-2"
              >
                {isSaving && <Loader2 className="animate-spin" size={16} />}
                Save Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
