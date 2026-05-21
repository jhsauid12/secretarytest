const { Telegraf } = require('telegraf');
const { GoogleGenAI } = require('@google/genai');

const bot = new Telegraf(process.env.BOT_TOKEN);

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// 🔥 100% доступная модель для твоего ключа
const MODEL = "gemini-1.5-pro";

bot.catch(console.error);

bot.on('business_message', async (ctx) => {
    try {
        const msg = ctx.businessMessage || ctx.update.business_message;
        if (!msg) return;

        const connectionId = msg.business_connection_id;
        if (!connectionId) return;

        const text = msg.text || msg.caption;
        if (!text) return;

        console.log("[IN]", text);

        const result = await ai.models.generateContent({
            model: MODEL,
            contents: text
        });

        const reply = result.text;

        await ctx.telegram.sendMessage(
            msg.chat.id,
            reply,
            { business_connection_id: connectionId }
        );

        console.log("✅ Sent");

    } catch (err) {
        console.error("❌ Error:", err);
    }
});

bot.launch();
console.log("🚀 Bot running stable (Pro model)");
