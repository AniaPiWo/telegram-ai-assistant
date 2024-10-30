const { Telegraf } = require("telegraf");
require("dotenv").config();
const Groq = require("groq-sdk");

const bot = new Telegraf(process.env.BOT_TOKEN);
const groq = new Groq();

bot.start((ctx) => ctx.reply("Welcome to your AI Assistant!"));

// Handle messages and respond using Groq SDK
bot.on("text", async (ctx) => {
  const userMessage = ctx.message.text;

  try {
    // Use Groq's chat completion to generate a response
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: userMessage }],
      model: "llama3-8b-8192",
      temperature: 1,
      max_tokens: 1024,
      top_p: 1,
      stream: true,
      stop: null,
    });

    // Stream the response back to the user
    let botResponse = "";
    for await (const chunk of chatCompletion) {
      botResponse += chunk.choices[0]?.delta?.content || "";
    }
    await ctx.reply(botResponse);
  } catch (error) {
    console.error("Error in generating response:", error);
    ctx.reply("I'm sorry, something went wrong. Please try again.");
  }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
