// src/utils/openai.js
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1", // Use standard OpenAI API URL
});

// Function to create a streaming response
export async function OpenAIStream(payload) {
  try {
    const response = await openai.chat.completions.create({
      ...payload,
      stream: true, // Enable streaming
    });

    // Convert the response into a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }
        controller.close();
      },
      cancel() {
        // Handle stream cancellation if needed
      },
    });

    return stream;
  } catch (error) {
    console.error("OpenAIStream Error:", error);
    throw error;
  }
}