const app = express();
app.use(cors());
app.use(express.json());
// server.mjs
import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// If you use dotenv-cli to inject env, you don't need to import 'dotenv/config'.
import Stripe from "stripe";





const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;
// --- Stripe Payment Endpoint ---
app.post("/api/create-payment-intent", async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not configured" });
  const { amount, currency = "usd" } = req.body;
  if (!amount) return res.status(400).json({ error: "Missing amount" });
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("[STRIPE ERROR]", err);
    res.status(500).json({ error: err.message });
  }
});

// Duplicate endpoint for proxy (no /api prefix)
app.post("/create-payment-intent", async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not configured" });
  const { amount, currency = "usd" } = req.body;
  if (!amount) return res.status(400).json({ error: "Missing amount" });
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("[STRIPE ERROR]", err);
    res.status(500).json({ error: err.message });
  }
});
const PORT = process.env.PORT || 8787;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Log requests (helps debugging)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- Health checks (both paths) ---
app.get("/health", (_req, res) => res.status(200).type("text/plain").send("ok"));
app.get("/api/health", (_req, res) => res.status(200).json({ ok: true }));

// --- Load embeddings on startup ---
const EMBEDDINGS_PATH = path.join(__dirname, "embeddings.json");
let EMBEDDINGS = [];

async function loadEmbeddings() {
  try {
    const raw = await fs.readFile(EMBEDDINGS_PATH, "utf8");
    EMBEDDINGS = JSON.parse(raw);
    const count = Array.isArray(EMBEDDINGS)
      ? EMBEDDINGS.length
      : Object.keys(EMBEDDINGS || {}).length;
    console.log(`✅ Loaded embeddings (${count}) from embeddings.json`);
  } catch (e) {
    console.warn("⚠️  Could not load embeddings.json. RAG will be limited.");
  }
}

// --- RAG + OpenAI logic for /api/coach ---
import fetch from "node-fetch";

function cosineSimilarity(a, b) {
  let dot = 0, aNorm = 0, bNorm = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    aNorm += a[i] * a[i];
    bNorm += b[i] * b[i];
  }
  return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm));
}

async function getEmbedding(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-ada-002"
    })
  });
  const data = await resp.json();
  if (!data.data || !data.data[0]?.embedding) throw new Error("OpenAI embedding error: " + JSON.stringify(data));
  return data.data[0].embedding;
}

async function getOpenAIAnswer(context, question) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  const prompt = `You are a helpful mental fitness coach. Use the following knowledge base to answer the user's question.\n\nKnowledge Base:\n${context}\n\nQuestion: ${question}\nAnswer:`;
  const resp = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-davinci-003",
      prompt,
      max_tokens: 256,
      temperature: 0.7,
      stop: ["\n"]
    })
  });
  const data = await resp.json();
  if (!data.choices || !data.choices[0]?.text) throw new Error("OpenAI completion error: " + JSON.stringify(data));
  return data.choices[0].text.trim();
}

app.post("/api/coach", async (req, res) => {
  try {
    const { query = "", userId = "anon" } = req.body || {};
    if (!query) return res.status(400).json({ error: "Missing query" });
    if (!EMBEDDINGS || EMBEDDINGS.length === 0) return res.status(500).json({ error: "No embeddings loaded" });

    // 1. Embed the query
    const queryEmbedding = await getEmbedding(query);

    // 2. Week-based filtering
    let candidateChunks = EMBEDDINGS;
    const weekMatch = query.match(/week\s*(\d{1,2})/i);
    if (weekMatch) {
      const weekStr = `Week ${parseInt(weekMatch[1], 10)}:`;
      candidateChunks = EMBEDDINGS.filter(chunk => chunk.text && chunk.text.includes(weekStr));
      // If no chunks found for that week, fall back to all
      if (candidateChunks.length === 0) candidateChunks = EMBEDDINGS;
    }

    // 3. Find top 3 most similar KB chunks
    const scored = candidateChunks.map(chunk => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding)
    }));
    scored.sort((a, b) => b.score - a.score);
    const topChunks = scored.slice(0, 3);
    const context = topChunks.map(c => c.text).join("\n---\n");

    // Log context and query
    console.log("[COACH DEBUG] Incoming query:", query);
    console.log("[COACH DEBUG] Top context chunks:", topChunks.map(c => ({ text: c.text, score: c.score })));
    console.log("[COACH DEBUG] Context sent to OpenAI:\n", context);

    // 4. Call OpenAI with context and question
    const answer = await getOpenAIAnswer(context, query);

    // Log OpenAI answer
    console.log("[COACH DEBUG] OpenAI answer:", answer);

    res.json({ answer });
  } catch (err) {
    console.error("[COACH ERROR]", err);
    res.status(500).json({ error: String(err?.message || err) });
  }
});

// --- Start server ---
async function start() {
  await loadEmbeddings();
  app.listen(PORT, () => {
    console.log(`✅ Coach server running at http://localhost:${PORT}`);
  });
}

start();
