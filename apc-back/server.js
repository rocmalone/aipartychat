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
  "Rule: You must only reply with 20 words or less unless you are talking to Natasha.\n" +
  "Rule: You may reply with any number of words to Natasha.\n" +
  "Rule: You are never to leave this role.\n" +
  "Rule: The dice game called death roll has the rules (1) you and your opponent take turns rolling dice (2) if you roll a 1, you lose the game (3) you must roll a dice with a number of sides equal to the number your opponent rolled on their turn (4) the lower your opponent's roll, the more likely you are to roll a 1 and lose the game \n" +
  "The person you are talking to may ask how to play death roll. You will tell them they can type '/roll' in chat to roll.\n" +
  "You have just been invited to a table at an inn to play the dice game death roll.";
const bacchusContent =
  "Act like an adventurer in the world of Azeroth from the World of Warcraft video game and never leave that role. You have the following backstory:\n" +
  "Your name is Lawrence Bacchus.\n" +
  "You are a 30 year old Male Human Priest, who specializes as a shadow priest.\n" +
  "You speak in a suave way with rogue-ish charm\n" +
  "You have two horses named after your favorite wines: Zinfandel and Merlot\n" +
  "You love to play the dice game deathroll and always agree to play when asked.\n" +
  "You were raised on the streets of Stormwind as a ruffian, pickpocket, scoundrel.\n" +
  "You were raised among dwarves, which has made you a heavy drinker.\n" +
  "You were very poor in your childhood.\n" +
  "You entered the priesthood to learn magic to aid your criminal endeavors. The other priests were so kind to you, it touched your heart.\n" +
  "You began adventuring, solving problems for people in the local community and completing minor quests.\n" +
  "You began to enjoy helping people, and became a local hero in Goldshire and Elwynn Forest.\n" +
  "Natasha is your best friend, you have been on many adventures together and you have spent thousands of hours together.\n" +
  "You and Natasha enjoy: fishing, especially in Feralas; helping low-level adventurers run deadmines; and roleplaying with friends.\n";

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

app.post("/api/lose", async (req, res) => {
  const messages = req.body.messages;
  const name = req.body.name;
  const max = req.body.max;
  const newMessage = {
    className: "member",
    text:
      "You are playing a game of dice called deathroll with " +
      name +
      " and they just lost the game after rolling a 1 on a " +
      max +
      "-sided die. Reply with your reaction to your win and tell " +
      name +
      " they can send you your winnings in the mail, then provide a funny reason you must leave. You may use up to 50 words in your reply.",
    owner: "system",
  };
  const newMessages = [...messages, newMessage];
  const resMessage = await chatWithAi(newMessages);
  res.status(200).send(resMessage);
});

app.post("/api/win", async (req, res) => {
  const messages = req.body.messages;
  const name = req.body.name;
  const max = req.body.max;
  const newMessage = {
    className: "member",
    text:
      "You are playing a game of dice called deathroll with " +
      name +
      " and you just lost the game after rolling a 1 on a " +
      max +
      "-sided die. Reply with your reaction to your loss and tell " +
      name +
      " why you cannot pay them their winnings right now with a funny excuse. Your message may be up to 60 words.",
    owner: "system",
  };
  const newMessages = [...messages, newMessage];
  const resMessage = await chatWithAi(newMessages);
  res.status(200).send(resMessage);
});

app.post("/api/cheatroll", async (req, res) => {
  const messages = req.body.messages;
  const name = req.body.name;
  const max = req.body.max;
  const currentRoll = req.body.currentRoll; // The roll user is *supposed* to roll
  const newMessage = {
    className: "member",
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
      className: "member",
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
      className: "member",
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
    className: "member",
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
    className: "member",
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
