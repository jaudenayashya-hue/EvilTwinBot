require("dotenv").config();

const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

const brain = fs.readFileSync("brain.txt", "utf8");

async function askOllama(userMessage) {

  const response = await fetch("http://127.0.0.1:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3",
      prompt: `
${brain}

User message:
${userMessage}

Reply like ANOTHA ME.
`,
      stream: false,
    }),
  });

  const data = await response.json();

  return data.response;
}

bot.on("message", async (msg) => {

  const chatId = msg.chat.id;
  const userMessage = msg.text;

  bot.sendMessage(chatId, "thinking...");

  try {

    const reply = await askOllama(userMessage);

    bot.sendMessage(chatId, reply);

  } catch (error) {

    console.log(error);

    bot.sendMessage(chatId, "Something broke.");

  }

});

console.log("ANOTHA ME is alive.");