const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

if (!DEEPSEEK_API_KEY) {
    console.error("❌ Нет DEEPSEEK_API_KEY в env");
    process.exit(1);
}

// 🧠 функция запроса к DeepSeek
async function askDeepSeek(text) {
    const response = await axios.post(
        'https://api.deepseek.com/chat/completions',
        {
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: "Ты умный, краткий и полезный ассистент."
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: 0.7
        },
        {
            headers: {
                "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );

    return response.data.choices[0].message.content;
}

// 💬 обработка сообщений
bot.on('message', async (ctx) => {
    try {
        const text = ctx.message.text;
        if (!text) return;

        console.log("[IN]", text);

        await ctx.sendChatAction('typing');

        const reply = await askDeepSeek(text);

        await ctx.reply(reply);

    } catch (err) {
        console.error("❌ Error:", err.response?.data || err.message);
        ctx.reply("Ошибка при запросе к ИИ 😔");
    }
});

bot.launch().then(() => {
    console.log("🚀 DeepSeek bot started");
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
