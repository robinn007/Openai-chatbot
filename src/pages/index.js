// pages/index.js
import { useState, useEffect } from "react";
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
  const [isStreaming, setIsStreaming] = useState(false);

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
    setIsStreaming(true);

    try {
      // Use Fetch API with streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botMessageContent = "";
      
      // Add empty assistant message to start streaming into
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "" },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          setIsStreaming(false);
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '');
            try {
              const data = JSON.parse(dataStr);
              if (data.done) {
                setIsStreaming(false);
                break;
              }
              if (data.content) {
                botMessageContent += data.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: "assistant",
                    content: botMessageContent,
                  };
                  return newMessages;
                });
              }
            } catch (err) {
              console.error("Parse error:", err);
              // Skip invalid JSON lines
              continue;
            }
          }
        }
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
      setIsStreaming(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

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
        <div className="flex-1 overflow-y-auto chat-container">
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
                    {/* Show typing indicator for streaming messages */}
                    {isStreaming && idx === messages.length - 1 && msg.role === "assistant" && (
                      <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1"></span>
                    )}
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
            disabled={isStreaming} // Disable input while streaming
          />
          <button
            onClick={sendRequest}
            className={`border rounded-md text-white text-lg w-20 p-2 ml-2 ${
              isStreaming
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            disabled={isStreaming}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}