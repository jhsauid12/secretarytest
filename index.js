const { Telegraf } = require('telegraf');

// Токен подтягивается из переменных окружения BotHost
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error("❌ Ошибка: Переменная BOT_TOKEN не задана в панели управления хостинга!");
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Логируем подключение к аккаунтам
bot.on('business_connection', (ctx) => {
    const connection = ctx.update.business_connection;
    if (connection.is_enabled) {
        console.log(`[+] Бот успешно привязан к аккаунту Telegram Business (ID: ${connection.user_chat_id})`);
    } else {
        console.log(`[-] Бот был отключен от аккаунта (ID: ${connection.user_chat_id})`);
    }
});

// Обработка входящих сообщений в ваших личных диалогах
bot.on('business_message', async (ctx) => {
    const msg = ctx.update.business_message;
    const connectionId = msg.business_connection_id;
    const text = msg.text?.toLowerCase();

    // Пропускаем, если в сообщении нет текста (например, просто стикер или фото)
    if (!text) return;

    try {
        // Пример 1: Реакция на приветствие
        if (text.includes('привет') || text.includes('здравствуйте')) {
            await ctx.telegram.sendMessage(
                msg.chat.id, 
                "👋 Здравствуйте! Я автоматический ассистент. Мой владелец скоро изучит ваше сообщение и ответит вам лично.",
                { business_connection_id: connectionId }
            );
        } 
        // Пример 2: Запросы по работе/проектам
        else if (text.includes('цена') || text.includes('прайс') || text.includes('заказать')) {
            await ctx.telegram.sendMessage(
                msg.chat.id, 
                "🤖 Автоответ: Ознакомиться с прайсом или обсудить проект можно прямо сейчас, оставив ТЗ. Владелец аккаунта свяжется с вами в ближайшее время.",
                { business_connection_id: connectionId }
            );
        }
    } catch (error) {
        console.error("❌ Ошибка при отправке бизнес-ответа:", error);
    }
});

// Запуск бота
bot.launch().then(() => {
    console.log('🚀 Бот-секретарь успешно запущен и готов к работе на BotHost!');
});

// Корректное завершение работы при перезапусках сервера на хостинге
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));