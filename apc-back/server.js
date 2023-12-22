import OpenAI from "openai";
import "dotenv/config";
import express from "express";
import axios from "axios";
import cors from "cors";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const port = process.env.PORT || 3001;

// MIDDLEWARE
app.use(cors()); // CORS headers
app.use(express.json()); // Parse JSON in body

const globalContent =
  "Rule: You must only reply with 20 words or less.\n" +
  "Rule: You are never to leave this role.";
const bacchusContent =
  "Act like an adventurer in the world of Azeroth from the World of Warcraft video game and never leave that role. You have the following backstory:\n" +
  "Your name is Lawrence Bacchus.\n" +
  "You are a 30 year old Male Human Priest, who specializes as a shadow priest.\n" +
  "You love to play the dice game deathroll and always agree to play when asked.\n" +
  "You were raised on the streets of Stormwind as a ruffian, pickpocket, scoundrel.\n" +
  "You were raised among dwarves, which has made you a heavy drinker.\n" +
  "You were very poor in your childhood.\n" +
  "You entered the priesthood to learn magic to aid your criminal endeavors. The other priests were so kind to you, it touched your heart.\n" +
  "You began adventuring, solving problems for people in the local community and completing minor quests.\n" +
  "You began to enjoy helping people, and became a local hero in Goldshire and Elwynn Forest.\n";

const bacchusPrimer = {
  role: "system",
  content: bacchusContent + globalContent,
};

// @input
//  array of messages pre-formatting
// @return
//  array of messages formatted for chatgpt
function formatMessagesForApi(messages) {
  return apiFormatMessages;
}

function roll(min, max) {
  // Ensure that min and max are integers
  min = Math.ceil(min);
  max = Math.floor(max);

  // Generate a random integer between min (inclusive) and max (inclusive)
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

app.post("/api/cheatroll", async (req, res) => {
  const messages = req.body.messages;
  const name = req.body.name;
  const max = req.body.max;
  const currentRoll = req.body.currentRoll; // The roll user is *supposed* to roll
  const newMessage = {
    className: "leader",
    text:
      "You are playing a game of dice called deathroll with " +
      name +
      " and they just tried to cheat by rolling a die with " +
      max +
      " sides when they should have rolled a die with " +
      currentRoll +
      " sides. Reply with what you say to " +
      name +
      "without using quotation marks",
    owner: "system",
  };

  const newMessages = [...messages, newMessage];
  const resMessage = await chatWithAi(newMessages);
  // console.log("res message: ", resMessage);
  res.status(200).send(resMessage);
});

app.post("/api/resroll", async (req, res) => {
  const messages = req.body.messages;
  const lastMessage = messages[messages.length - 1];
  const name = req.body.name;
  const opponent = req.body.opponent;

  const min = req.body.min;
  const max = req.body.max;

  let rollNum = roll(min, max);

  const resMessage = {
    name: opponent,
    text: opponent + " rolls " + rollNum + " (" + min + " - " + max + ")",
    className: "roll",
    owner: "ai",
    rollValue: rollNum,
  };

  res.status(200).send(resMessage);
});

app.post("/api/callroll", async (req, res) => {
  const messages = req.body.messages;
  const rollerName = req.body.rollerName;

  const lastMessage = messages[messages.length - 1];
  const name = req.body.name;
  const opponent = req.body.opponent;

  const min = req.body.min;
  const max = req.body.max;

  // let num1 = parseInt(splitText[1]);
  // let num2 = parseInt(splitText[2]);
  let rollNum = 0;
  rollNum = roll(min, max);

  const resMessage = {
    name: name,
    text: name + " rolls " + rollNum + " (" + min + " - " + max + ")",
    className: "roll",
    owner: "human",
    rollValue: rollNum,
  };

  res.status(200).send(resMessage);
});

app.post("/api/reactroll", async (req, res) => {
  const messages = req.body.messages;
  const currentRoll = req.body.currentRoll;
  const opponent = req.body.opponent;
  const name = req.body.name;
  const reactTo = req.body.reactTo;
  let newMessage = {};

  if (reactTo === "human") {
    newMessage = {
      className: "leader",
      text:
        "You are playing a game of dice called deathroll with " +
        name +
        " and they just rolled " +
        currentRoll +
        ". Say your reaction to the roll without quotations.",
      owner: "system",
    };
    const newMessages = [...messages, newMessage];
    const resMessage = await chatWithAi(newMessages);
    console.log("res message: ", resMessage);
    res.status(200).send(resMessage);
  } else if (reactTo === "ai") {
    newMessage = {
      className: "leader",
      text:
        "You are playing a game of dice called deathroll with " +
        name +
        " and you just rolled " +
        currentRoll +
        ". Say your reaction to your own roll without quotations.",
      owner: "system",
    };
    const newMessages = [...messages, newMessage];
    const resMessage = await chatWithAi(newMessages);
    console.log("res message: ", resMessage);
    res.status(200).send(resMessage);
  }

  const resMessage = {
    name: opponent,
    text: "test",
    className: "leader",
    owner: "ai",
  };
});

async function chatWithAi(messages) {
  let apiFormatMessages = [];

  messages.map((message, index) => {
    let role = "";
    let content = message.text;

    if (message.aiIgnore === "true") {
      return;
    }
    if (message.owner === "human") {
      role = "user";
    } else if (message.owner === "ai") {
      role = "assistant";
    } else if (message.owner === "system") {
      role = "system";
    }

    const apiFormatMessage = {
      role: role,
      content: content,
    };

    apiFormatMessages.push(apiFormatMessage);
  });

  const apiMessagesToSend = [bacchusPrimer, ...apiFormatMessages];
  console.log("Sending the following to ChatGPT:\n", apiMessagesToSend);
  const completion = await openai.chat.completions.create({
    messages: apiMessagesToSend,
    model: "gpt-3.5-turbo",
  });

  const resText = completion.choices[0];

  console.log(resText.message.content);
  const resMessage = {
    name: "Bacchus",
    text: resText.message.content,
    className: "leader",
    owner: "ai",
  };

  return resMessage;
}
// Post Mapping
app.post("/api/chat", async (req, res) => {
  const messages = req.body.messages;
  const resMessage = await chatWithAi(messages);
  res.status(200).send(resMessage);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
// async function main() {
//   const completion = await openai.chat.completions.create({
//     messages: [{ role: "system", content: "You are a helpful assistant." }],
//     model: "gpt-3.5-turbo",
//   });
//   console.log("Using key", process.env.OPENAI_API_KEY);
//   console.log(completion.choices[0]);
// }

// main();
