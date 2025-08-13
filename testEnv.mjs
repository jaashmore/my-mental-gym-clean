import dotenv from 'dotenv';
dotenv.config();

console.log("Loaded API key:", process.env.OPENAI_API_KEY || "NOT FOUND");
