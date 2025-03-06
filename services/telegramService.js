import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error("Telegram bot token yoki chat ID topilmadi");
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, {polling: false});

export const sendMessageToTelegram = async (name, phone) => {
  try {
    const message = `🔔 Yangi so'rov:\n\nIsm: ${name}\nTelefon: ${phone}`;
    await bot.sendMessage(TELEGRAM_CHAT_ID, message);
    return true;
  } catch (error) {
    console.error("Telegram xabar yuborishda xatolik:", error);
    return false;
  }
};
