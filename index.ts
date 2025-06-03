import { token } from "./config.json";
import fs from "fs/promises";
import { Context, Markup, Telegraf } from "telegraf";
import { message } from "telegraf/filters";

interface UserData {
  clicks: number;
  score: number;
}

const phoneNumbersFile = await fs.open("phone-numbers.txt", "a");
const userDataMap = new Map<number, UserData>();

function getUserData(id: number): UserData {
  if (!userDataMap.has(id)) userDataMap.set(id, { clicks: 0, score: 0 });
  return userDataMap.get(id)!;
}

function shuffle<T>(arr: T[]): T[] {
  const result = arr.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

function selectRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

async function incrementScore(ctx: Context) {
  const userData = getUserData(ctx.from!.id);
  userData.score += 25;
  await ctx.reply(`Кількість очок: ${userData.score}`);
}

const bot = new Telegraf(token);

bot.command("start", async (ctx) => {
  await ctx.reply(
    "Вітаю! Обери опцію нижче ⬇ / Hello! Choose an option below ⬇",
    Markup.keyboard([
      [
        Markup.button.contactRequest(
          "📞 Надіслати номер телефону / Send phone number"
        ),
      ],
      ["ℹ Інлайн кнопки / Inline buttons"],
    ])
      .resize()
      .oneTime()
  );
});

bot.on(message("contact"), async (ctx) => {
  const phoneNumber = ctx.message.contact.phone_number;
  const userData = getUserData(ctx.from.id);

  await phoneNumbersFile.write(
    JSON.stringify({
      ...ctx.from,
      number: phoneNumber,
    }) + "\n"
  );
  userData.score += 25;
  await ctx.reply(
    `Дякуємо! Ваш номер телефону: ${phoneNumber} / Thank you! Your phone number: ${phoneNumber}`
  );
  await incrementScore(ctx);
});

bot.hears("ℹ Інлайн кнопки / Inline buttons", async (ctx) => {
  await ctx.reply(
    "Це інлайн-кнопки / These are inline buttons:",
    Markup.inlineKeyboard([
      [
        Markup.button.url(
          "🌐 Відвідати сайт / Visit website",
          "https://duikt.edu.ua/en/"
        ),
      ],
      [Markup.button.callback("Вгадай число", "guess")],
      [Markup.button.callback("Quiz", "quiz")],
      [Markup.button.callback("Лайфхаки", "lifehack")],
      [Markup.button.callback("Факти", "fact")],
      [Markup.button.callback("Цитати", "quote")],
      [Markup.button.callback("Нинішній час", "datetime")],
      [Markup.button.callback("Емоція", "emotes")],
      [Markup.button.callback("Питання", "rate")],
      [Markup.button.callback("Загадка", "riddle")],
      [Markup.button.callback("Випадкова картинка", "image")],
      [Markup.button.callback("✅ Натисни мене / Click me", "clicked")],
    ])
  );
  await incrementScore(ctx);
});

bot.action("clicked", async (ctx) => {
  await ctx.answerCbQuery();
  const userName = ctx.from.first_name;
  let userData = getUserData(ctx.from.id);
  userData.clicks += 1;
  if (userData.clicks == 0)
    await ctx.reply(`Привіт, давай дружить ${userName}!`);

  let messages = ["message1", "message2"];
  await ctx.reply(messages[(Math.random() * messages.length) | 0]!);

  await ctx.reply(
    `Ви натиснули кнопку ${userData.clicks} разів! / You clicked the button ${userData.clicks} times!`,
    Markup.inlineKeyboard([
      [Markup.button.callback("✅ Натисни мене / Click me", "clicked")],
      [Markup.button.callback("Перезапустити", "reset")],
    ])
  );
  userData.score += 25;
  await incrementScore(ctx);
});

bot.action("reset", async (ctx) => {
  ctx.answerCbQuery();
  let userData = getUserData(ctx.from.id);
  userData.clicks = 0;
  await ctx.reply(`Натискання стерті.`);
  await incrementScore(ctx);
});

bot.action("guess", async (ctx) => {
  await ctx.answerCbQuery();
  const answers = [
    Markup.button.callback(`${Math.random() * 10}`, "wrong"),
    Markup.button.callback(`${Math.random() * 10}`, "wrong"),
    Markup.button.callback(`${Math.random() * 10}`, "wrong"),
    Markup.button.callback(`${Math.random() * 10}`, "wrong"),
  ];
  selectRandom(answers).callback_data = "correct";
  await ctx.reply(`Guess the number`, Markup.inlineKeyboard([answers]));
  await incrementScore(ctx);
});

bot.action("quiz", async (ctx) => {
  await ctx.answerCbQuery();

  const quizes = [
    { question: "What's 2 + 2?", correct: ["2²"], wrong: ["√2", "2", "-2"] },
  ];

  const quiz = selectRandom(quizes);

  const answers = shuffle([
    ...quiz.correct.map((ans) => Markup.button.callback(ans, "correct")),
    ...quiz.wrong.map((ans) => Markup.button.callback(ans, "wrong")),
  ]);
  await ctx.reply(quiz.question, Markup.inlineKeyboard([answers]));
  await incrementScore(ctx);
});

bot.action("lifehack", async (ctx) => {
  await ctx.answerCbQuery();

  const lifehacks = [
    "Починай день не з телефону, а з плану — і день буде твоїм.",
    "Записуй ідеї — найкращі думки приходять раптово і швидко зникають.",
    "Хочеш більше енергії — лягай раніше, а не пий п’яту каву.",
    "Думки плутаються? Пиши їх на папері — розум очиститься.",
    "Таймер на 25 хвилин — і жодних відволікань. Продуктивність злетить.",
  ];

  await ctx.reply(
    selectRandom(lifehacks),
    Markup.inlineKeyboard([Markup.button.callback("Інший", "lifehack")])
  );
  await incrementScore(ctx);
});

bot.action("fact", async (ctx) => {
  await ctx.answerCbQuery();

  const facts = ["fact1", "fact2"];

  await ctx.reply(
    selectRandom(facts),
    Markup.inlineKeyboard([Markup.button.callback("Another one", "fact")])
  );
  await incrementScore(ctx);
});

bot.action("quote", async (ctx) => {
  await ctx.answerCbQuery();

  const quotes = [
    "Твоє майбутнє починається сьогодні, а не завтра.",
    "Сила не в тому, щоб ніколи не падати, а в тому, щоб підніматися щоразу, коли впав.",
    "Не чекай ідеального моменту — створи його.",
    "Кожен великий шлях починається з маленького кроку.",
    "Мрії — це плани, які ще не мають дати.",
    "Успіх — це не випадковість, а результат наполегливої праці, віри в себе і рішучості.",
  ];

  await ctx.reply(
    selectRandom(quotes),
    Markup.inlineKeyboard([Markup.button.callback("Another one", "quote")])
  );
  await incrementScore(ctx);
});

bot.action("datetime", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(`${new Date().toUTCString()}`);
  await incrementScore(ctx);
});

bot.action("emotes", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.reply(
    "Select emotion",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("😭", ""),
        Markup.button.callback("🤨", ""),
        Markup.button.callback("😂", ""),
      ],
    ])
  );
  await incrementScore(ctx);
});

bot.action("rate", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.reply(
    "Тобі подобається бот? Так / Ні",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("Так", "thanks"),
        Markup.button.callback("Ні", "not-thanks"),
      ],
    ])
  );
  await incrementScore(ctx);
});

bot.action("riddle", async (ctx) => {
  await ctx.answerCbQuery();

  // Загадки
  const riddles = [
    { question: "What's 2 + 2?", correct: ["2²"], wrong: ["√2", "2", "-2"] },
  ];

  const riddle = selectRandom(riddles);

  const answers = shuffle([
    ...riddle.correct.map((ans) => Markup.button.callback(ans, "correct")),
    ...riddle.wrong.map((ans) => Markup.button.callback(ans, "wrong")),
  ]);

  await ctx.reply(riddle.question, Markup.inlineKeyboard([answers]));
  await incrementScore(ctx);
});

bot.action("image", async (ctx) => {
  await ctx.answerCbQuery();

  const images = [
    "https://tenor.com/view/ben-shapiro-walking-gif-21499133.gif",
    "https://i.redd.it/1xyl6wkixo0e1.gif",
    "https://tenor.com/view/alan-wake-alan-wake-2-vibe-gif-3068849078309707514.gif",
    "https://tenor.com/view/senator-armstrong-senator-metal-gear-rising-gif-25474022.gif",
  ];

  await ctx.sendAnimation(
    selectRandom(images),
    Markup.inlineKeyboard([Markup.button.callback("Another one", "image")])
  );
  await incrementScore(ctx);
});

bot.action("thanks", async (ctx) => {
  let userData = getUserData(ctx.from.id);
  userData.score += 25;
  await ctx.answerCbQuery();
  await ctx.reply("Thank you for your fair answer!");
  await incrementScore(ctx);
});
bot.action("not-thanks", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("Why did you select that?");
  await incrementScore(ctx);
});

bot.action("correct", async (ctx) => {
  let userData = getUserData(ctx.from.id);
  userData.score += 25;
  await ctx.answerCbQuery();
  await ctx.reply("CORRECT!!!");
  await incrementScore(ctx);
});

bot.action("wrong", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply("RONG!");
  await incrementScore(ctx);
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
