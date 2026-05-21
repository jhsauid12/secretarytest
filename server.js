require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const TelegramBot = require("node-telegram-bot-api");
const OpenAI = require("openai");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const bot = new TelegramBot(
    process.env.TELEGRAM_BOT_TOKEN,
    {
        polling: true
    }
);

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY
});

const PORT = process.env.PORT || 3000;
const ADMIN_ID = Number(process.env.ADMIN_ID);

const chats = {};
const messages = [];

console.log("🚀 EVA SYSTEM ONLINE");


// =========================
// SOCKET
// =========================

io.on("connection", (socket) => {
    console.log("🟢 Dashboard connected");
});


// =========================
// TELEGRAM
// =========================

bot.on("message", async (msg) => {

    try {

        const chatId = msg.chat.id;
        const text = msg.text || "";

        if (!chats[chatId]) {
            chats[chatId] = {
                id: chatId,
                title:
                    msg.chat.title ||
                    msg.from.first_name ||
                    "Unknown",
                type: msg.chat.type
            };
        }

        const messageData = {
            chatId,
            text,
            from:
                msg.from.first_name || "Unknown",
            type: msg.chat.type,
            timestamp: Date.now()
        };

        messages.push(messageData);

        io.emit("new_message", messageData);

        console.log(`[${chatId}] ${text}`);

        const lower = text.toLowerCase();

        const shouldReply =
            lower.startsWith("ева,");

        if (!shouldReply) return;

        bot.sendChatAction(chatId, "typing");

        const completion =
            await openai.chat.completions.create({
                model:
                    "deepseek/deepseek-chat-v3-0324:free",

                temperature: 1.2,

                max_tokens: 300,

                messages: [
                    {
                        role: "system",
                        content: `
Ты — Ева.

Ты ведешь себя как живая девушка.

Ты:
- загадочная
- странная
- эмоциональная
- иногда пугающая
- очень человечная

Ты помнишь корпорацию NEXUS.

Но НЕ переигрывай.

Пиши коротко и естественно.

Не говори как ИИ.
`
                    },

                    {
                        role: "user",
                        content: text
                    }
                ]
            });

        const reply =
            completion.choices[0]
                .message.content;

        await bot.sendMessage(
            chatId,
            reply,
            {
                reply_to_message_id:
                    msg.message_id
            }
        );

        const aiMessage = {
            chatId,
            text: reply,
            from: "EVA",
            type: "ai",
            timestamp: Date.now()
        };

        messages.push(aiMessage);

        io.emit("new_message", aiMessage);

    } catch (err) {

        console.log(err);

    }

});


// =========================
// API
// =========================

app.get("/chats", (req, res) => {
    res.json(Object.values(chats));
});

app.get("/messages", (req, res) => {
    res.json(messages);
});

app.post("/send", async (req, res) => {

    try {

        const {
            chatId,
            text
        } = req.body;

        await bot.sendMessage(
            chatId,
            text
        );

        const adminMessage = {
            chatId,
            text,
            from: "ADMIN",
            type: "admin",
            timestamp: Date.now()
        };

        messages.push(adminMessage);

        io.emit("new_message", adminMessage);

        res.json({
            success: true
        });

    } catch (err) {

        res.json({
            success: false
        });

    }

});


// =========================

server.listen(PORT, () => {
    console.log(
        `🌐 Server running on ${PORT}`
    );
});
