import React from 'react';
import { Plus, ImageOff } from 'lucide-react';
import { MenuItem, AppSettings } from '../types';

interface MenuGridProps {
  items: MenuItem[];
  settings: AppSettings;
  onAddToCart: (item: MenuItem) => void;
}

export const MenuGrid: React.FC<MenuGridProps> = ({ items, settings, onAddToCart }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <ImageOff size={48} className="mb-4 opacity-50" />
        <p>No items found in this category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
      {items.map((item) => (
        <div key={item.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full">
          <div className="relative h-48 overflow-hidden bg-gray-100">
            <img 
              src={item.image} 
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
              }}
            />
            {!item.available && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Sold Out</span>
              </div>
            )}
          </div>
          
          <div className="p-4 flex flex-col flex-grow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-primary-600 transition-colors line-clamp-2">
                {item.name}
              </h3>
              <span className="font-semibold text-gray-900 bg-gray-50 px-2 py-1 rounded-lg ml-2 whitespace-nowrap">
                {settings.currency}{item.price.toFixed(2)}
              </span>
            </div>
            
            <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-grow">
              {item.description}
            </p>
            
            <button
              onClick={() => item.available && onAddToCart(item)}
              disabled={!item.available}
              className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                item.available 
                  ? 'bg-gray-900 text-white hover:bg-primary-600 shadow-lg shadow-gray-200 hover:shadow-primary-500/25' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Plus size={18} strokeWidth={2.5} />
              {item.available ? 'Add to Order' : 'Unavailable'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
