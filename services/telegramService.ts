import { CartItem, AppSettings } from '../types';

export const sendOrderToTelegram = async (
  items: CartItem[],
  tableNumber: string,
  total: number,
  settings: AppSettings
): Promise<boolean> => {
  if (!settings.telegramBotToken || !settings.telegramChatId) {
    console.warn("Telegram settings missing");
    throw new Error("Admin has not configured Telegram Bot settings.");
  }

  const timestamp = new Date().toLocaleString();
  
  const itemsList = items
    .map(item => `- ${item.name} (x${item.quantity}) - ${settings.currency}${(item.price * item.quantity).toFixed(2)}`)
    .join('\n');

  const message = `
🔔 *NEW ORDER* 🔔
📅 ${timestamp}
🍽 *Table No:* ${tableNumber}

*Order Details:*
${itemsList}

-------------------------
💰 *Total:* ${settings.currency}${total.toFixed(2)}
  `;

  const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: settings.telegramChatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Telegram API Error:', errorData);
      throw new Error(`Telegram Error: ${errorData.description || 'Unknown error'}`);
    }

    return true;
  } catch (error: any) {
    console.error('Telegram Network Error:', error);
    
    // Friendly error for CORS issues common in browser-only apps
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Connection failed. Note: Telegram API may block browser requests (CORS). Try using a proxy or checking your internet.');
    }
    
    throw error;
  }
};
