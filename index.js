const { Telegraf } = require('telegraf');
const { GoogleGenAI } = require('@google/genai');

const BOT_TOKEN = process.env.BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!BOT_TOKEN || !GEMINI_API_KEY) {
    console.error("❌ Missing BOT_TOKEN or GEMINI_API_KEY");
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// 🔥 Новый стабильный SDK
const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
});

// 🔥 СТАБИЛЬНАЯ БЕСПЛАТНАЯ МОДЕЛЬ
const MODEL = "gemini-1.5-flash";

bot.catch((err) => {
    console.error("❌ Telegraf error:", err);
});

// 💬 Business messages handler
bot.on('business_message', async (ctx) => {
    try {
        const msg = ctx.businessMessage || ctx.update.business_message;
        if (!msg) return;

        const connectionId = msg.business_connection_id;
        if (!connectionId) return;

        const text = msg.text || msg.caption;
        if (!text) return;

        console.log(`[IN] ${text}`);

        // 🧠 Gemini request
        const result = await ai.models.generateContent({
            model: MODEL,
            contents: text
        });

        const reply = result.text;

        if (!reply) return;

        // 📤 send response
        await ctx.telegram.sendMessage(
            msg.chat.id,
            reply,
            {
                business_connection_id: connectionId
            }
        );

        console.log("✅ Sent");

    } catch (err) {
        console.error("❌ Runtime error:", err);
    }
});

bot.launch().then(() => {
    console.log("🚀 Bot started successfully");
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
