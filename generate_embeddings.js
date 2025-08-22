// generate_embeddings.js
// Usage: node generate_embeddings.js
// Requires: OPENAI_API_KEY in .env

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY in .env');
  process.exit(1);
}

const INPUT_FILES = [
  'course_material.txt',
];
const OUTPUT_FILE = 'embeddings.json';
const CHUNK_SIZE = 200; // words

function log(msg) {
  console.log('[EMBED]', msg);
}

function cleanText(text) {
  return text
    .replace(/The Master Key( System)?/gi, '')
    .replace(/Charles F\\. Haanel/gi, '')
    .replace(/F\\.H\\. BURGESS/gi, '')
    .replace(/\b(author|book|lesson|correspondence course|part [0-9]+|introduction|foreword)\b/gi, '')
    .replace(/\n{2,}/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function chunkText(text, chunkSize) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.split(' ').length > 20) {
      chunks.push(chunk);
    }
  }
  return chunks;
}

async function getEmbedding(text) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        input: text,
        model: 'text-embedding-ada-002',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );
    return response.data.data[0].embedding;
  } catch (err) {
    log('Embedding error: ' + (err.response ? JSON.stringify(err.response.data) : err.message));
    return null;
  }
}

async function main() {
  log('Script started.');
  let allChunks = [];
  for (const file of INPUT_FILES) {
    const filePath = path.join(__dirname, file);
    log(`Checking for file: ${filePath}`);
    if (!fs.existsSync(filePath)) {
      log(`File not found: ${file}`);
      continue;
    }
    let text = fs.readFileSync(filePath, 'utf8');
    log(`Read ${text.length} characters from ${file}`);
    text = cleanText(text);
    const chunks = chunkCourseByWeek(text);
log(`Chunked into ${chunks.length} week/block/introduction-based passages.`);
chunks.forEach((chunk, idx) => {
  log(`Chunk ${idx + 1} starts: ${chunk.slice(0, 80).replace(/\n/g, ' ')}...`);
});
allChunks = allChunks.concat(chunks);
  }

  if (allChunks.length === 0) {
    log('No chunks to embed. Exiting.');
    return;
  }

  log(`Total chunks to embed: ${allChunks.length}`);
  const output = [];
  for (let i = 0; i < allChunks.length; i++) {
    const passage = allChunks[i];
    log(`Embedding chunk ${i + 1} of ${allChunks.length}`);
    const embedding = await getEmbedding(passage);
    if (embedding) {
      output.push({
        text: passage,
        embedding,
      });
    } else {
      log(`Failed to embed chunk ${i + 1}`);
    }
    await new Promise(res => setTimeout(res, 150));
  }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  log(`Done. Wrote ${output.length} chunks to ${OUTPUT_FILE}`);
}
// Add this new function above main()
function chunkCourseByWeek(text) {
  // Normalize: ensure every 'Week X:' header is on its own line
  text = text.replace(/\s*(Week \d+:)/gi, '\n$1');

  // Split at every 'Week X:' header, keeping the header with its content
  const splitRegex = /(Week \d+:)/gi;
  const parts = text.split(splitRegex);
  let chunks = [];
  let intro = parts[0].trim();
  if (intro && intro.split(' ').length > 10) {
    chunks.push(intro);
  }
  for (let i = 1; i < parts.length; i += 2) {
    // parts[i] is the header, parts[i+1] is the content
    let chunk = (parts[i] + (parts[i+1] ? ' ' + parts[i+1] : '')).trim();
    if (chunk.split(' ').length > 10) {
      chunks.push(chunk);
    }
  }
  return chunks;
}

main();