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

  // Store user message in chat history and if u dont want to store the user message, u can just remove the chathistory part
  chatHistory[chatId].push({
    role: "user",
    content: userInput,
  });

  if (userInput === "/start") {
    bot.sendMessage(chatId, "Give some keywords like 'Girl road rain headphone crying' and chatgpt will generate the prompt for you and then Dall-e will generate the image using chatgpt prompt");
  } else {
    try {
      bot.sendMessage(chatId, "Please wait, ChatGPT is thinking and generating your prompt");
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        // Send conversation history along with user's current message
        messages: [{
          "role": "system", "content": `this is an example prompt i got from the keyword "fish aquarium": "3D render of a cute tropical fish in an aquarium on a dark blue background, digital art" here is another example of "oil painting of a basketball player": "An expressive oil painting of a basketball player dunking, depicted as an explosion of a nebula". another example of "orange" : "A blue orange sliced in half laying on a blue floor in front of a blue wall". another example of "astronaut" : "A 3D render of an astronaut walking in a green desert" another example of "colored powdered" : "A centered explosion of colorful powder on a black background". another example of "formula car":"A Formula 1 car driving on a neon road
" now i will give you some keywords and generate the prompt based on those keywords like those above example.`
        }, ...chatHistory[chatId], { role: "system", content: " " }, { role: "user", content: userInput }],
      });
      const message = response["data"]["choices"][0]["message"]["content"]
      bot.sendMessage(chatId, `this is the prompt chatgpt generated.
      
      ${message}
    
      ..wait for some seconds to get your image`);

      // Store bot message in chat history
      chatHistory[chatId].push({
        role: "assistant",
        content: message,
      });
      bot.sendMessage(chatId, "Now Wait, Dall-e is generating your image");
      const ImageResponse = await openai.createImage({
        prompt: message,
        n: 1,
        size: "1024x1024",
      });
      image_url = ImageResponse.data.data[0].url;

      bot.sendPhoto(chatId, image_url);

    } catch (error) {
      bot.sendMessage(chatId, "Sorry, My money is finished, so u can just use the code and change the api key to yours and also telegram token  and it will work or maybe some other error happened");
    }
  }
});