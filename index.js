const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const BOT_TOKEN = process.env.BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!BOT_TOKEN || !GEMINI_API_KEY) {
    console.error("❌ Ошибка: Укажите BOT_TOKEN и GEMINI_API_KEY в настройках хостинга!");
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const SYSTEM_INSTRUCTION = `
Ты — умный ИИ-ассистент в личном Telegram-аккаунте. 
Твоя задача — отвечать на входящие сообщения от других людей. 
Отвечай кратко, дружелюбно, без лишних вступлений. 
Если тебя спрашивают о чем-то личном или о встрече, напиши, что владелец ответит позже.
`;

bot.on('business_connection', (ctx) => {
    console.log(`[+] Бот подключен к аккаунту.`);
});

bot.on('business_message', async (ctx) => {
    const msg = ctx.update.business_message;
    const connectionId = msg.business_connection_id;
    const text = msg.text;

    // Игнорируем не-текстовые сообщения и наши собственные исходящие
    if (!text || msg.out) return;

    console.log(`[Входящее от ${msg.from.first_name}]: ${text}`);

    try {
        // Уведомляем Telegram, что мы "печатаем"
        await ctx.telegram.sendChatAction(msg.chat.id, 'typing');

        // Генерируем ответ через Gemini
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: text }] }],
            systemInstruction: SYSTEM_INSTRUCTION,
            generationConfig: { temperature: 0.7 }
        });

        const aiReply = result.response.text();

        if (aiReply) {
            await ctx.telegram.sendMessage(
                msg.chat.id, 
                aiReply,
                { business_connection_id: connectionId }
            );
            console.log(`[Ответ отправлен]: ${aiReply}`);
        }
    } catch (error) {
        console.error("❌ Ошибка:", error.message);
    }
});

bot.launch().then(() => console.log('🚀 Бот запущен!'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
