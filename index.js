require("dotenv").config();

const fs = require("fs");
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(express.json());

// ENV
const token = process.env.TELEGRAM_BOT_TOKEN;
const url = process.env.WEBHOOK_URL;

// BOT
const bot = new TelegramBot(token);

// brain
const brain = fs.readFileSync("brain.txt", "utf8");

// GROQ AI
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

  if (!data.choices || !data.choices[0]) {
    return "AI error";
  }

  return data.choices[0].message.content;
}

// TELEGRAM RECEIVE MESSAGE (WEBHOOK)
app.post(`/bot${token}`, async (req, res) => {
  const msg = req.body.message;

  if (!msg || !msg.text) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const userMessage = msg.text;

  try {
    const reply = await askAI(userMessage);
    bot.sendMessage(chatId, reply);
  } catch (err) {
    console.log(err);
    bot.sendMessage(chatId, "Something broke.");
  }

  res.sendStatus(200);
});

// START SERVER + SET WEBHOOK
app.listen(process.env.PORT || 3000, async () => {
  console.log("Server running");

  await bot.setWebHook(`${url}/bot${token}`);

  console.log("Webhook set:", `${url}/bot${token}`);
});