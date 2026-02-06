import React, { useState } from 'react';
import { ShoppingCart, X, UtensilsCrossed, ChevronUp, Trash2 } from 'lucide-react';
import { CartItem, AppSettings } from '../types';

interface CartSheetProps {
  cart: CartItem[];
  settings: AppSettings;
  onUpdateQuantity: (id: string, delta: number) => void;
  onClearCart: () => void;
  onPlaceOrder: (tableNumber: string) => Promise<void>;
  isProcessing: boolean;
}

export const CartSheet: React.FC<CartSheetProps> = ({
  cart,
  settings,
  onUpdateQuantity,
  onClearCart,
  onPlaceOrder,
  isProcessing
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [tableNumber, setTableNumber] = useState('');

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (cart.length === 0) return null;

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber) return;
    await onPlaceOrder(tableNumber);
    setIsConfirming(false);
    setIsOpen(false);
    setTableNumber('');
  };

  if (isConfirming) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Confirm Order</h3>
              <button onClick={() => setIsConfirming(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              You are placing an order for <span className="font-semibold">{totalItems} items</span> totaling <span className="font-semibold text-primary-600">{settings.currency}{totalPrice.toFixed(2)}</span>.
            </p>

            <form onSubmit={handleOrderSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Table Number</label>
                <input
                  type="text" // using text to allow alphanumerics if needed
                  inputMode="numeric"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg text-center font-mono tracking-widest"
                  placeholder="e.g. 5"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <UtensilsCrossed size={20} />
                    Send to Kitchen
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop when expanded */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Bottom Sheet */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white z-40 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-out border-t border-gray-100 ${
          isOpen ? 'translate-y-0' : 'translate-y-0' // Always visible as bar, expands up
        }`}
      >
        {/* Toggle Bar / Sticky Footer */}
        <div 
          className="p-4 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="bg-primary-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md">
                   {isOpen ? <ChevronUp className="rotate-180 transition-transform" /> : <ShoppingCart size={20} />}
                </div>
                {!isOpen && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {totalItems}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Total</span>
                <span className="font-bold text-xl text-gray-900">{settings.currency}{totalPrice.toFixed(2)}</span>
              </div>
            </div>
            
            {!isOpen ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(true);
                }}
                className="bg-gray-900 text-white px-6 py-2.5 rounded-full font-medium text-sm hover:bg-gray-800 transition-colors"
              >
                View Order
              </button>
            ) : (
               <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onClearCart();
                  setIsOpen(false);
                }}
                className="text-red-500 p-2 hover:bg-red-50 rounded-full"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {isOpen && (
          <div className="p-4 pt-0 max-h-[60vh] overflow-y-auto">
             <div className="h-px bg-gray-100 my-2"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Selection</h3>
            <div className="space-y-4 mb-20">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500">{settings.currency}{item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                    <button 
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-600 hover:text-red-600 active:scale-95 transition-all"
                    >
                      -
                    </button>
                    <span className="w-4 text-center font-medium text-gray-900">{item.quantity}</span>
                    <button 
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-600 hover:text-green-600 active:scale-95 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Place Order Button in Expanded View */}
             <div className="absolute bottom-4 left-4 right-4">
                <button
                  onClick={() => setIsConfirming(true)}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Checkout <span className="opacity-80 mx-1">|</span> {settings.currency}{totalPrice.toFixed(2)}
                </button>
             </div>
          </div>
        )}
      </div>
    </>
  );
};
