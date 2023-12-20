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

app.post("/api/chat", async (req, res) => {
  const messages = req.body.messages;
  console.log("Post request recieved");
  console.log("Messages:", messages);

  const globalContent =
    "Rule: You are limited to replies which contain 200 characters or less.";
  const bacchusContent =
    "You are an adventurer named Lawrence Bacchus in the world of Azeroth from World of Warcraft.\n" +
    "You are a 30 year old Male Human Priest, who specializes as a shadow priest.\n" +
    "You have the following character backstory:\n" +
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

  const formattedMessages = [];

  const completion = await openai.chat.completions.create({
    messages: [bacchusPrimer],
    model: "gpt-3.5-turbo",
  });

  const resText = completion.choices[0];

  console.log(resText.message.content);
  const resMessage = {
    name: "Bacchus",
    text: resText.message.content,
    className: "member",
    human: "no",
  };
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
