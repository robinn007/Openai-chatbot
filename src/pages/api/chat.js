// pages/api/chat.js
import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  // Initialize Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.headers.cookie
            ?.split("; ")
            ?.find((row) => row.startsWith(`${name}=`))
            ?.split("=")[1];
        },
      },
    }
  );

  // Check for user session
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return res.status(401).json({ error: "Unauthorized: Please log in" });
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPEN_API_KEY,
      baseURL: "https://models.github.ai/inference",
    });

    const stream = await client.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: messages,
      temperature: 1,
      max_tokens: 4096,
      top_p: 1,
      stream: true,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

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