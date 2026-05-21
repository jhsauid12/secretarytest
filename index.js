const { Telegraf } = require('telegraf');
const axios = require('axios');

const BOT_TOKEN = process.env.BOT_TOKEN;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

if (!BOT_TOKEN || !DEEPSEEK_API_KEY) {
    console.error("❌ Missing env variables");
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

bot.catch((err) => {
    console.error("❌ Telegraf Error:", err);
});

// 🧠 DeepSeek запрос
async function askDeepSeek(text) {
    const response = await axios.post(
        'https://api.deepseek.com/chat/completions',
        {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: 'Ты дружелюбный и умный Telegram ассистент.'
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.7
        },
        {
            headers: {
                Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );

    return response.data.choices[0].message.content;
}

// 💬 BUSINESS MESSAGES
bot.on('business_message', async (ctx) => {
    try {
        const msg =
            ctx.businessMessage ||
            ctx.update.business_message;

        if (!msg) return;

        const text = msg.text || msg.caption;
        if (!text) return;

        const connectionId = msg.business_connection_id;

        if (!connectionId) {
            console.log("❌ No business_connection_id");
            return;
        }

        console.log("[IN]", text);

        // typing
        try {
            await ctx.telegram.sendChatAction(
                msg.chat.id,
                'typing'
            );
        } catch {}

        // 🧠 AI response
        const aiReply = await askDeepSeek(text);

        console.log("[AI]", aiReply);

        // 📤 SEND MESSAGE
        await ctx.telegram.sendMessage(
            msg.chat.id,
            aiReply,
            {
                business_connection_id: connectionId
            }
        );

        console.log("✅ Reply sent");

    } catch (err) {
        console.error(
            "❌ Runtime Error:",
            err.response?.data || err.message
        );
    }
});

bot.launch().then(() => {
    console.log("🚀 DeepSeek Business Bot Started");
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
