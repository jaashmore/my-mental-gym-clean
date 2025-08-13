import * as dotenv from 'dotenv';
import fs from 'fs';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from 'langchain/document';

dotenv.config();

const rawData = fs.readFileSync('./knowledge-base.json', 'utf-8');
const kb = JSON.parse(rawData);

const docs = kb.map(entry => 
  new Document({ 
    pageContent: `${entry.response}`, 
    metadata: { intent: entry.intent, keywords: entry.keywords.join(', ') }
  })
);

const embeddings = new OpenAIEmbeddings();

const store = await MemoryVectorStore.fromDocuments(docs, embeddings);

const results = await store.similaritySearch('How can I build my mental strength?', 2);
console.log('\n🧠 Test Results:\n');
results.forEach((r, i) => console.log(`${i+1}. ${r.pageContent}\n`));
