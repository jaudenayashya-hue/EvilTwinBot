require("dotenv").config();

const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");

// Telegram token
const token = process.env.TELEGRAM_BOT_TOKEN;

// Create bot
const bot = new TelegramBot(token, { polling: true });

// Load brain file
const brain = fs.readFileSync("brain.txt", "utf8");

// 🔥 GROQ AI FUNCTION (CLOUD, NO OLLAMA)
async function askAI(userMessage) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content: brain
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    })
  });

  const data = await response.json();

  // safety check (prevents crash)
  if (!data.choices || !data.choices[0]) {
    return "AI error: no response";
  }

  return data.choices[0].message.content;
}

// Telegram message handler
bot.on("message", async (msg) => {

  const chatId = msg.chat.id;
  const userMessage = msg.text;

  // ignore empty messages (stickers/images)
  if (!userMessage) return;

  bot.sendMessage(chatId, "thinking...");

  try {

    const reply = await askAI(userMessage);

    bot.sendMessage(chatId, reply);

  } catch (error) {

    console.log(error);

    bot.sendMessage(chatId, "Something broke.");
  }

});

console.log("ANOTHA ME is alive 🔥");