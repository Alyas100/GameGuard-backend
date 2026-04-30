// cron/ai-worker.js
import "dotenv/config";
import fs from "fs"; // <-- File system logic lives here
import path from "path"; // <-- Path logic lives here
import { parentPort } from "worker_threads";
import prisma from "../../../../prismaClient.js";
import { generateJsonFromAi } from "../../services/ai.js"; // Import the simple AI client

// --- THIS LOGIC MOVED HERE FROM AI.JS ---
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType,
    },
  };
}
// ----------------------------------------

async function processUnscoredReports() {
  console.log("--- 🤖 WORKER: Starting job... ---");
  const reportsToScore = await prisma.report.findMany({
    where: { isScored: false },
    take: 10,
  });
  if (reportsToScore.length === 0) {
    console.log("--- 🤖 WORKER: No new reports to score. ---");
    return;
  }
  console.log(
    `--- 🤖 WORKER: Found ${reportsToScore.length} reports to score. ---`
  );

  const ALL_CATEGORIES = [
    "🚨 Predatory Behavior",
    "⚔️ Violence",
    "🔞 Sexual Content",
    "😢 Bullying",
    "💰 Scams",
    "💬 Hate Speech",
    "🕌 Islamic Concerns",
  ];

  for (const report of reportsToScore) {
    try {
      // 1. Build the specific prompt
      const prompt = `
            You are an expert safety analyst for "GameGuard," a parental control app.
            Your task is to analyze a user-submitted report about a video game. The report includes a text description, an optional screenshot, and user-selected category hints.

            You must analyze ALL the provided information (text and image) to generate a comprehensive risk score.

            **Master Risk List:**
            You must generate scores ONLY for categories from this list:
            - sexual
            - predatory
            - bullying
            - scams
            - violence

            **User-Submitted Data:**
            - **Description:** "${report.description}"
            - **User's Category Hints:** ${JSON.stringify(
              Object.keys(report.categories || {})
            )}

            **Your Instructions:**

            1.  **Read the Description:** Analyze the text for any risks.
            2.  **Analyze the Screenshot:** Examine the image for any visual evidence of risks (e.g., inappropriate language in chat, violent imagery, sexualized content).
            3.  **Cross-Reference:** Use the user's hints, but **find ALL categories** that apply, even if the user missed them.
            4.  **Assign Scores:** For each category in the **Master Risk List**, assign a severity score from 0 (not present or negligible) to 100 (severe and explicit).
            5.  **Respond with JSON:** Your final output MUST be a valid JSON object. The keys must be the exact category names from the master list, and the values must be their scores, and also make sure to not return the key-value that u give 0 score, only return it as 0 if that risk key-value is given to u, dont return all other key risk that are not given to u when they are 0 score.

            **Example Output:**
            If you find evidence of severe bullying and minor scams, you would return:
            {
              "sexual": 0,
              "predatory": 30,
              "bullying": 0,
              "scams": 65,
              "violence": 0
            }
            `;

      // 2. Prepare image (All file logic is here)
      const imageParts = [];
      if (report.imageUrl) {
        try {
          const resolvedPath = path.resolve(report.imageUrl);
          if (fs.existsSync(resolvedPath)) {
            console.log(`🤖 WORKER: Attaching image ${resolvedPath}`);
            imageParts.push(fileToGenerativePart(resolvedPath, "image/jpeg"));
          } else {
            console.log(`WORKER Warning: Image not found at ${resolvedPath}`);
          }
        } catch (err) {
          console.log(`WORKER Error reading image file: ${err.message}`);
        }
      }

      // 3. Call the "dumb" AI service with the prepared data
      const scores = await generateJsonFromAi(prompt, imageParts);

      // 4. Update the report in the DB
      await prisma.report.update({
        where: { id: report.id },
        data: { categories: scores, isScored: true },
      });
      console.log(`✅ 🤖 WORKER: Successfully scored report ${report.id}`);
    } catch (err) {
      console.error(`❌ 🤖 WORKER: Failed to score report ${report.id}:`, err);
    }
  }
  console.log("--- 🤖 WORKER: Run finished. ---");
}

// Run the job, then tell the main thread we are done
processUnscoredReports()
  .then(() => parentPort?.postMessage("done"))
  .catch((err) => {
    console.error("❌ 🤖 WORKER: Fatal error", err);
    parentPort?.postMessage("error");
  });
