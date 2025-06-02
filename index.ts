import { token } from "./config.json";
import { Context, Markup, Telegraf } from "telegraf";
import fs from "fs/promises";
import { message } from "telegraf/filters";

interface UserData {
  clicks: number;
}

const phoneNumbersFile = await fs.open("phone-numbers.txt", "a");
const userDataMap = new Map<number, UserData>();

function getUserData(id: number): UserData {
  if (!userDataMap.has(id)) userDataMap.set(id, { clicks: 0 });
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

  await phoneNumbersFile.write(
    JSON.stringify({
      ...ctx.from,
      number: phoneNumber,
    }) + "\n"
  );

  await ctx.reply(
    `Дякуємо! Ваш номер телефону: ${phoneNumber} / Thank you! Your phone number: ${phoneNumber}`
  );
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
      [Markup.button.callback("Guess", "guess")],
      [Markup.button.callback("Quiz", "quiz")],
      [Markup.button.callback("✅ Натисни мене / Click me", "clicked")],
    ])
  );
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
});

bot.action("guess", async (ctx) => {
  await ctx.answerCbQuery();
  const answers = [
    Markup.button.callback("1", "wrong"),
    Markup.button.callback("2", "wrong"),
    Markup.button.callback("3", "wrong"),
    Markup.button.callback("4", "wrong"),
  ];
  answers[(Math.random() * answers.length) | 0]!.callback_data = "correct";
  await ctx.reply(`Guess the number`, Markup.inlineKeyboard([answers]));
});

bot.action("quiz", async (ctx) => {
  await ctx.answerCbQuery();

  const quizes = [
    { question: "What's 2 + 2?", correct: ["2²"], wrong: ["√2", "2", "-2"] },
  ];

  const quiz = quizes[(Math.random() * quizes.length) | 0]!;

  const answers = [
    ...quiz.correct.map((ans) => Markup.button.callback(ans, "correct")),
    ...quiz.wrong.map((ans) => Markup.button.callback(ans, "wrong")),
  ];

  await ctx.reply(quiz.question, Markup.inlineKeyboard([answers]));
});

bot.action("wrong", (ctx) => ctx.reply("RONG!"));
bot.action("correct", (ctx) => ctx.reply("CORRECT!!!"));

bot.action("reset", async (ctx) => {
  ctx.answerCbQuery();
  let userData = getUserData(ctx.from.id);
  userData.clicks = 0;
  await ctx.reply(`Clicks reset`);
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
