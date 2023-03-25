const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env['OPENAIAPIKEY']
});
const openai = new OpenAIApi(configuration);

const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env['TELEGRAMTOKEN']

const bot = new TelegramBot(token, { polling: true });

// Store conversation history for each chat in a dictionary
const chatHistory = {};

bot.on("message", async (msg) => {
  console.log(msg)
  const chatId = msg.chat.id;
  const userInput = msg.text;

  // Initialize chat history if not already done
  if (!chatHistory[chatId]) {
    chatHistory[chatId] = [];
  }

  // Store user message in chat history
  chatHistory[chatId].push({
    role: "user",
    content: userInput,
  });

  if (userInput === "/start") {
    bot.sendMessage(chatId, "Give some keywords like 'Girl road rain headphone crying' and chatgpt will generate the prompt for you and then Dall-e will generate the image using chatgpt prompt");
  } else {
    try {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        // Send conversation history along with user's current message
        messages: [{
          "role": "system", "content": `this is an example prompt i got from the keyword "Astronout walking on mars": "Astronaut walking on the red dusty surface of Mars, collecting samples of its soil, rocks, and atmosphere. With every step, they are discovering new and exciting things about this alien world." here is another example of "A dragon taking over the world": "Dragon, flying across the world. Its wings were so large that they cast a shadow over the land, blocking out the sun. Its fire was so powerful that it could turn entire cities to ash in a matter of moments." now i will give you some keywords and generate the prompt based on those keywords like those above example. now i will give you some keywords. and also keep the prompt like keywords based that will enhance the image and keep the keywords one short`
        }, ...chatHistory[chatId], { role: "system", content: " " }, { role: "user", content: userInput }],
      });
      const message = response["data"]["choices"][0]["message"]["content"]
      bot.sendMessage(chatId, `this is the prompt chatgpt generated.${message}..  wait for some seconds to get your image`);

      // Store bot message in chat history
      chatHistory[chatId].push({
        role: "assistant",
        content: message,
      });

      const ImageResponse = await openai.createImage({
        prompt: message,
        n: 1,
        size: "1024x1024",
      });
      image_url = ImageResponse.data.data[0].url;

      bot.sendPhoto(chatId, image_url);

    } catch (error) {
      bot.sendMessage(chatId, "Sorry, Some Error Happened");
    }
  }
});