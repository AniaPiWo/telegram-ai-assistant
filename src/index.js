const { Telegraf } = require("telegraf");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const Groq = require("groq-sdk");

const bot = new Telegraf(process.env.BOT_TOKEN);
const groq = new Groq();

const memoryFile = path.join(__dirname, "memory.json");

// Tworzenie pliku pamięci, jeśli nie istnieje
if (!fs.existsSync(memoryFile)) {
  fs.writeFileSync(memoryFile, JSON.stringify({}));
}

// Funkcja wczytania pamięci
const loadMemory = () => {
  try {
    const data = fs.readFileSync(memoryFile, "utf8");
    console.log("Memory loaded:", data);
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading memory:", error);
    return {};
  }
};

// Funkcja zapisu pamięci
const saveMemory = (memory) => {
  try {
    fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2));
    console.log("Memory saved successfully.");
  } catch (error) {
    console.error("Error saving memory:", error);
  }
};

let memory = loadMemory();

// Aktualizowanie lub dodawanie informacji o użytkowniku w pamięci
const updateMemory = (userId, info) => {
  if (!memory[userId]) {
    memory[userId] = { messages: [] };
  }
  memory[userId] = {
    ...memory[userId],
    ...info,
    messages: [...(memory[userId].messages || []), info.lastMessage],
  };
  saveMemory(memory);
};

// Funkcja do obsługi wiadomości powitalnej i zapytania o imię
bot.start((ctx) => {
  const userId = ctx.from.id;

  if (memory[userId]?.name) {
    ctx.reply(`Witaj ponownie, ${memory[userId].name}! Jak mogę Ci pomóc?`);
  } else {
    ctx.reply("Siema, jestem Seba, Twój ziomek asystent! Jak masz na imię?");
    updateMemory(userId, { expectingName: true });
  }
});

// Obsługa wiadomości użytkownika
bot.on("text", async (ctx) => {
  const userMessage = ctx.message.text;
  const userId = ctx.from.id;

  // Jeśli bot oczekuje imienia użytkownika, zapisuje je i kończy proces
  if (memory[userId]?.expectingName) {
    memory[userId].name = userMessage; // Zapisanie imienia
    delete memory[userId].expectingName; // Usunięcie flagi oczekiwania
    saveMemory(memory); // Zapisanie stanu do pliku
    ctx.reply(`Miło Cię poznać, ${userMessage}! Jak mogę Ci pomóc?`);
    return;
  }

  // Używa imienia zapisanego w pamięci lub „ziomek” jako domyślne
  const userName = memory[userId]?.name || "ziomek";

  try {
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

    let botResponse = "";
    for await (const chunk of chatCompletion) {
      botResponse += chunk.choices[0]?.delta?.content || "";
    }
    await ctx.reply(`${userName}, ${botResponse}`);

    updateMemory(userId, { lastMessage: userMessage });
  } catch (error) {
    console.error("Error in generating response:", error);
    ctx.reply("Kurde, coś nie pykło! Spróbuj jeszcze raz, ziomek.");
  }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
