// router/AiRouter.js
import express from "express";
import dotenv from "dotenv";
import Groq from "groq-sdk";
dotenv.config();

const AiRouter = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

AiRouter.post("/", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("❌ GROQ_API_KEY is missing from .env");
      return res.status(500).json({ error: "GROQ_API_KEY not configured on server" });
    }

    console.log("✅ Calling Groq...");

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
      temperature: 0.4,
    });

    const result = completion.choices?.[0]?.message?.content;

    if (!result) {
      console.error("❌ Groq returned empty response:", JSON.stringify(completion));
      return res.status(500).json({ error: "Groq returned no response" });
    }

    console.log("✅ Groq responded successfully");
    res.json({ result });

  } catch (error) {
    console.error("❌ AiRouter crash:", error.message);
    res.status(500).json({ error: "AI generation failed", details: error.message });
  }
});

export default AiRouter;