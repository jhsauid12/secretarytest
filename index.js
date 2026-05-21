const { Telegraf } = require('telegraf');
const { GoogleGenAI } = require('@google/genai');

const BOT_TOKEN = process.env.BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!BOT_TOKEN || !GEMINI_API_KEY) {
    console.error("❌ Ошибка: Проверьте переменные BOT_TOKEN и GEMINI_API_KEY на хостинге!");
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
Ты — умный ИИ-ассистент, встроенный в личный Telegram-аккаунт твоего владельца. 
Твоя задача — отвечать на входящие сообщения от других людей от его имени.
Отвечай кратко, емко, дружелюбно. Не используй длинные робо-вступления.
Если спрашивают о личной встрече или деталях, пиши, что владелец скоро освободится и ответит сам.
`;

bot.on('business_connection', (ctx) => {
    console.log(`[+] Бот активен для бизнес-сессии.`);
});

bot.on('business_message', async (ctx) => {
    const msg = ctx.update.business_message;
    const connectionId = msg.business_connection_id;
    const text = msg.text;

    // 1. Проверяем, что пришел именно текст
    if (!text) return;

    // 2. ЗАЩИТА ОТ САМООТВЕТА:
    // Флаг msg.from.id — это тот, кто физически нажал "отправить".
    // Если этот ID совпадает с ID чата, куда отправлено (saved messages), 
    // или если это сообщение является ИСХОДЯЩИМ от твоего лица (проверяем через служебные поля Telegram),
    // то бот должен промолчать.
    if (msg.from.id === msg.chat.id || msg.chat.type !== 'private') {
        return; 
    }

    // Дополнительная проверка: если в объекте сообщения есть пометка, что оно исходящее от нас
    if (msg.out) {
        console.log("ℹ️ Пропускаем наше собственное исходящее сообщение.");
        return;
    }

    console.log(`[Входящее от пользователя ${msg.from.first_name} (ID: ${msg.from.id})]: ${text}`);

    try {
        // Показываем статус "печатает..." в чате собеседника
        await ctx.telegram.sendChatAction(msg.chat.id, 'typing');

        // Запрос к ИИ Gemini
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: text,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0.7 
            }
        });

        const aiReply = response.text;

        if (aiReply) {
            // Отправляем ответ в ID чата, где идет беседа
            await ctx.telegram.sendMessage(
                msg.chat.id, 
                aiReply,
                { business_connection_id: connectionId }
            );
            console.log(`[Ответ ИИ успешно отправлен]: ${aiReply}`);
        }

    } catch (error) {
        console.error("❌ Ошибка при отправке ИИ-ответа:", error);
    }
});

bot.launch().then(() => {
    console.log('🚀 Бот-секретарь с ИИ успешно обновлен на BotHost!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
