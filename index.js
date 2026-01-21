import express from "express";
import cors from "cors";
import axios from "axios";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/analyze", async (req, res) => {
  try {
    const { image, symbol = "BINANCE:BTCUSDT" } = req.body;

    const priceRes = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`
    );

    const price = priceRes.data.c;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an educational trading analyst. Explain support, resistance, trend bias, momentum, and risk. Never give buy or sell advice. Use probability-based language."
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Current market price: ${price}` },
            { type: "text", text: "Analyze this chart image and give market bias with confidence percentage." },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ]
    });

    res.json({ result: aiResponse.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: "Analysis failed" });
  }
});

app.get("/", (req, res) => {
  res.send("AI Trading Backend is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
