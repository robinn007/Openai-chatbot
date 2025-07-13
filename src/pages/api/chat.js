// pages/api/chat.js
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPEN_API_KEY, // Use environment variable
      baseURL: "https://models.github.ai/inference",
    });

    const response = await client.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: messages,
      temperature: 1,
      max_tokens: 4096,
      top_p: 1,
    });

    const botMessage = response?.choices?.[0]?.message;

    if (botMessage) {
      res.status(200).json({ message: botMessage });
    } else {
      throw new Error("Unexpected response format");
    }
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: error.message });
  }
}