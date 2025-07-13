// pages/index.js
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import Head from "next/head";
import TextareaAutosize from "react-textarea-autosize";
import Navbar from "@/components/Navbar";

const SYSTEM_MESSAGE =
  "You are Jobot, a helpful and versatile AI created by Jovian using state-of-the-art ML models and APIs.";

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "system", content: SYSTEM_MESSAGE },
  ]);
  const [userMessage, setUserMessage] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendRequest();
    }
  };

  const sendRequest = async () => {
    if (!userMessage.trim()) {
      alert("Please enter a message before you hit send");
      return;
    }

    const updatedMessages = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(updatedMessages);
    setUserMessage("");

    try {
      // Call your API route instead of directly calling OpenAI
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const botMessage = data.message;

      if (botMessage) {
        setMessages([...updatedMessages, botMessage]);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err) {
      console.error("Error:", err);
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "❌ Error: " + err.message,
        },
      ]);
    }
  };

  return (
    <>
      <Head>
        <title>Jobot - Your friendly neighborhood AI</title>
      </Head>

      <div className="flex flex-col h-screen">
        {/* Navigation Bar */}
        <nav className="bg-white shadow w-full">
          <Navbar />
        </nav>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full max-w-screen-md mx-auto px-4 py-6">
            {messages
              .filter((m) => m.role !== "system")
              .map((msg, idx) => (
                <div
                  key={idx}
                  className={`my-3 p-3 rounded-md ${
                    msg.role === "user"
                      ? "bg-blue-50 border-l-4 border-blue-500"
                      : "bg-gray-100 border-l-4 border-gray-400"
                  }`}
                >
                  <div className="font-semibold mb-1">
                    {msg.role === "user" ? "You" : "Jobot"}
                  </div>
                  <div className="text-md prose">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Input section */}
        <div className="w-full max-w-screen-md mx-auto flex px-4 pb-6 items-start">
          <TextareaAutosize
            value={userMessage}
            autoFocus
            maxRows={10}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything.."
            onChange={(e) => setUserMessage(e.target.value)}
            className="border text-lg rounded-md p-2 flex-1 resize-none"
            rows={1}
          />
          <button
            onClick={sendRequest}
            className="bg-blue-500 hover:bg-blue-600 border rounded-md text-white text-lg w-20 p-2 ml-2"
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}