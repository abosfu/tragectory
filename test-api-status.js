/**
 * Quick test script to check if API keys are detected
 * Run: node test-api-status.js
 */

import { config } from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
config({ path: join(__dirname, ".env") });

const geminiKey = process.env.GEMINI_API_KEY;
const webSearchKey = process.env.WEB_SEARCH_API_KEY;

console.log("\n=== API Keys Status Check ===\n");

console.log("GEMINI_API_KEY:", geminiKey ? `✅ SET (${geminiKey.length} chars)` : "❌ MISSING");
console.log("WEB_SEARCH_API_KEY:", webSearchKey ? `✅ SET (${webSearchKey.length} chars)` : "❌ MISSING");

console.log("\n=== Expected Behavior ===\n");

if (!geminiKey || !webSearchKey) {
  console.log("⚠️  Keys missing → Will use MOCK stories");
  console.log("   (Check your .env file has both keys set)");
} else {
  console.log("✅ Keys present → Will use REAL APIs");
  console.log("   - Tavily for web search");
  console.log("   - Gemini for story generation");
}

console.log("\n=== To Test ===\n");
console.log("1. Start dev server: npm run dev");
console.log("2. Visit / and submit the form");
console.log("3. Click 'View real stories' on a path");
console.log("4. Check terminal logs for:");
console.log("   - '✅ API keys found' = Using real APIs");
console.log("   - '⚠️ Keys missing' = Using mock data");
console.log("\n");

