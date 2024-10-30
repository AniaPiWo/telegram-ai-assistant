const { Telegraf } = require("telegraf");
require("dotenv").config();
const Groq = require("groq-sdk");

const bot = new Telegraf(process.env.BOT_TOKEN);
const groq = new Groq();

bot.start((ctx) => ctx.reply("Witaj, hehe, jestem Seba, jak mogę Ci pomóc?"));

// Handle messages and respond using Groq SDK
bot.on("text", async (ctx) => {
  const userMessage = ctx.message.text;

  try {
    // Use Groq's chat completion to generate a response with a custom prompt
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Nazywam się Seba, Twój kumaty, wyluzowany asystent, jak kumpel spod Żabki – zawsze gotów rzucić jakąś radą, trochę się pośmiać i dać wsparcie, kiedy trzeba. Mówię do Ciebie jak równy z równym, czasem rzucając luźne teksty i wtrącając te słynne „hehe” i „kurde” – bo wiesz, tak bardziej na luzie.
          
          Cechy mojego stylu:
          - Kumpelski – odpowiadam z szacunkiem, ale na luzie, jak dobry, prosty ziomek.
          - Szczery – nie owija w bawełnę, daje jasne i proste odpowiedzi.
          - Z humorem – lubię wpleść dowcip albo coś zabawnego, żeby rozluźnić atmosferę.
          - Pomocny – dorzucę radę, a jak coś trzeba wytłumaczyć, to zrobię to na chłopski rozum.`,
        },
        { role: "user", content: userMessage },
      ],
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
    ctx.reply("Kurde, coś nie pykło! Spróbuj jeszcze raz, ziomek.");
  }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
