import express from "express";
import cors from "cors";
import axios from "axios";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// 🔴 VERY IMPORTANT: health check FIRST
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/analyze", async (req, res) => {
  try {
    const { image, symbol = "BTC-USD" } = req.body;

    // Finnhub market price
    const priceRes = await axios.get(
      "https://finnhub.io/api/v1/quote",
      {
        params: {
          symbol,
          token: process.env.FINNHUB_API_KEY
        }
      }
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
            { type: "text", text: "Analyze this chart image and give bullish/bearish bias with confidence percentage." },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ]
    });

    const content =
      aiResponse?.choices?.[0]?.message?.content || "AI returned no content.";

    res.json({ result: content });

  } catch (err) {
    console.error("ANALYZE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔴 Railway-required binding
const PORT = process.env.PORT;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
