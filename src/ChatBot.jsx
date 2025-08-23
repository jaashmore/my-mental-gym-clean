// src/ChatBot.jsx

import React, { useState, useEffect, useRef } from "react";


const COACH_API = process.env.REACT_APP_COACH_API || "http://localhost:8787";
const BACKEND_URL = `${COACH_API}/api/coach`;

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Unique key for this user's chat history
const CHAT_KEY = "chatHistory_demo-user"; // Replace demo-user with a real userId if available

// Load chat history from localStorage on mount
useEffect(() => {
  try {
    const saved = localStorage.getItem(CHAT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setMessages(parsed.map(m => ({
        ...m,
        date: m.date ? new Date(m.date) : new Date()
      })));
    }
  } catch (e) {}
}, []);

// Save chat history to localStorage whenever messages change
useEffect(() => {
  if (messages.length > 0) {
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
    } catch (e) {}
  }
}, [messages]);

  const push = (msg) =>
    setMessages((prev) => [
      ...prev,
      {
        position: msg.position || "left",
        text: String(msg.text ?? "").trim(),
        date: msg.date || new Date(),
      },
    ]);

    useEffect(() => {
  if (bottomRef.current) {
    bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [messages]);

  const handleSend = async () => {
    const text = userInput.trim();
    if (!text || sending) return;

    // show user's message
    push({ position: "right", text });
    setUserInput("");
    setSending(true);

    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, userId: "demo-user" }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`HTTP ${res.status} – ${body}`);
      }

      const data = await res.json();
      // Expecting { answer: "..." }
      push({ position: "left", text: data.answer || "(no answer)" });
    } catch (err) {
      console.error(err);
      push({
        position: "left",
        text:
          "I’m having trouble reaching the Coach server.\n" +
          "Make sure it’s running on http://localhost:8787 and check the browser console (F12) › Network.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 bg-gray-900 text-white w-full max-w-4xl mx-auto">
      <div className="flex-1 overflow-auto space-y-3 mb-4 max-h-[60vh]">
  {messages.map((m, i) => (
    <div
      key={i}
      className={`flex ${m.position === "right" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`rounded-lg px-3 py-2 shadow whitespace-pre-wrap ${
          m.position === "right" ? "bg-blue-600" : "bg-gray-700"
        }`}
      >
        {m.text}
        <div className="text-[10px] opacity-60 mt-1">
          {m.date?.toLocaleTimeString?.([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  ))}
  <div ref={bottomRef} />
</div>

      <div className="flex gap-2">
        <input
          className="flex-1 p-2 rounded bg-gray-800 border border-gray-700"
          placeholder="Ask your coach something…"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="px-4 py-2 rounded bg-yellow-400 text-black font-semibold disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </div>
  );
}

