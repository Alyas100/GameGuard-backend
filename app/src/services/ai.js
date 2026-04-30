// backend/src/services/ai.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

// Initialize AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * A generic function to generate JSON content from a text prompt and image parts.
 * @param {string} prompt - The detailed prompt to send to the AI.
 * @param {Array} imageParts - An array of generative parts (the prepared image data).
 * @returns {Promise<object>} - The parsed JSON object from the AI.
 */
export async function generateJsonFromAi(prompt, imageParts = []) {
  try {
    // 1. Get the model and force JSON output
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
      },
    }); // 2. Generate content (no file logic here)

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const jsonText = response.text();

    console.log("🤖 AI Service: Raw JSON response:", jsonText);
    return JSON.parse(jsonText);
  } catch (aiError) {
    console.error("❌❌❌ FATAL AI SERVICE ERROR: ❌❌❌", aiError.message);
    throw aiError;
  }
}
