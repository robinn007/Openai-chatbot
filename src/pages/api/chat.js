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

    // Create a streaming chat completion
    const stream = await client.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: messages,
      temperature: 1,
      max_tokens: 4096,
      top_p: 1,
      stream: true, // Enable streaming
    });

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream the response to the client
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Send a JSON-compatible [DONE] message
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: error.message });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};