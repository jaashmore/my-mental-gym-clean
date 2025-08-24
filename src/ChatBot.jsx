// src/ChatBot.jsx

import React, { useState, useEffect, useRef } from "react";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { getApp } from "firebase/app";


const COACH_API = process.env.REACT_APP_COACH_API || "http://192.168.56.1:8787";
const BACKEND_URL = `${COACH_API}/api/coach`;

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Unique key for this user's chat history
const CHAT_KEY = "chatHistory_demo-user"; // Replace demo-user with a real userId if available

const db = getFirestore(getApp());
const chatCollection = collection(db, "chats"); // You can use a subcollection per user if desired

// Load chat messages in real time
useEffect(() => {
  const q = query(chatCollection, orderBy("timestamp"));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    setMessages(
      snapshot.docs.map(doc => ({
        ...doc.data(),
        date: doc.data().timestamp?.toDate?.() || new Date()
      }))
    );
  });
  return () => unsubscribe();
}, []);

  const push = async (msg) => {
  await addDoc(chatCollection, {
    position: msg.position || "left",
    text: String(msg.text ?? "").trim(),
    timestamp: serverTimestamp()
  });
};

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
