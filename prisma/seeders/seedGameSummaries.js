// prisma/seeders/seedGameSummaries.js
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import fetch from "node-fetch";
import { generateJsonFromAi } from "../../app/src/services/ai.js";

const prisma = new PrismaClient();
const AI_MAX_RETRIES = Number(process.env.AI_MAX_RETRIES || 6);
const AI_MIN_DELAY_MS = Number(process.env.AI_MIN_DELAY_MS || 13000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(error, attempt) {
  const message = String(error?.message || "");

  // Example: "Please retry in 16.163241389s"
  const retryInMatch = message.match(/retry in\s+([\d.]+)s/i);
  if (retryInMatch?.[1]) {
    return Math.ceil(Number(retryInMatch[1]) * 1000) + 500;
  }

  // Example: "\"retryDelay\":\"16s\""
  const retryDelayMatch = message.match(/"retryDelay":"(\d+)s"/i);
  if (retryDelayMatch?.[1]) {
    return Number(retryDelayMatch[1]) * 1000 + 500;
  }

  // Fallback exponential backoff
  return Math.min(60000, 5000 * 2 ** attempt);
}

function isQuotaError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("429") ||
    message.includes("too many requests") ||
    message.includes("quota exceeded")
  );
}

/**
 * Summarize a game description using Gemini AI
 */
async function summarizeGameDescription(description) {
  if (!description || description.length < 10) {
    return null;
  }

  const prompt = `You are a game description summarizer. Summarize the following game description in 2-3 sentences (max 150 words). Be concise and highlight the key gameplay aspects and themes.

Game Description:
${description}

Return ONLY a JSON object with this structure:
{
  "summary": "Your summary here"
}`;

  for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt++) {
    try {
      const result = await generateJsonFromAi(prompt);
      return result.summary;
    } catch (error) {
      if (!isQuotaError(error) || attempt === AI_MAX_RETRIES) {
        console.error("❌ Error summarizing description:", error.message);
        return null;
      }

      const retryMs = getRetryDelayMs(error, attempt);
      console.log(
        `⏳ AI quota hit. Retrying in ${Math.ceil(retryMs / 1000)}s (attempt ${attempt + 1}/${AI_MAX_RETRIES})`,
      );
      await sleep(retryMs);
    }
  }

  return null;
}

async function main() {
  console.log("🚀 Starting game description summarization...");

  try {
    // Resume-friendly: only process games that still need summaries
    const games = await prisma.game.findMany({
      where: {
        shortDescription: null,
      },
      take: Number(process.env.SUMMARY_BATCH_SIZE || 50),
    });

    if (games.length === 0) {
      console.log("📭 No games found in database.");
      return;
    }

    console.log(`📊 Found ${games.length} games to process`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Process each game
    for (let i = 0; i < games.length; i++) {
      const game = games[i];

      try {
        console.log(`\n[${i + 1}/${games.length}] 🎮 Processing: ${game.name}`);

        // If game has no description, try to fetch from RAWG API
        let description = game.description;

        if (!description) {
          console.log(`  ⏳ Fetching details from RAWG API...`);
          try {
            const response = await fetch(
              `https://api.rawg.io/api/games?search=${encodeURIComponent(
                game.name,
              )}&key=${process.env.EXTERNAL_GAME_API_KEY}`,
            );
            if (response.ok) {
              const data = await response.json();
              if (data.results && data.results[0]) {
                description =
                  data.results[0].description_raw ||
                  data.results[0].description ||
                  null;
                if (description) {
                  console.log(`  ✅ Fetched description from API`);
                }
              }
            }
          } catch (fetchErr) {
            console.log(`  ⚠️  Could not fetch from API`);
          }
        }

        if (!description) {
          console.log(`⏭️  No description available, skipping...`);
          skippedCount++;
          continue;
        }

        // Summarize the description
        const summary = await summarizeGameDescription(description);

        if (summary) {
          // Update the game with the short description
          await prisma.game.update({
            where: { id: game.id },
            data: {
              shortDescription: summary,
            },
          });

          console.log(`✅ Stored summary: "${summary.substring(0, 80)}..."`);
          successCount++;

          // Keep request rate under free-tier limits by default
          await sleep(AI_MIN_DELAY_MS);
        } else {
          console.log(`⚠️  No summary generated for ${game.name}`);
          errorCount++;
          await sleep(AI_MIN_DELAY_MS);
        }
      } catch (gameError) {
        console.error(`❌ Error processing ${game.name}:`, gameError.message);
        errorCount++;
        await sleep(AI_MIN_DELAY_MS);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`✅ Summarization complete!`);
    console.log(`   ✨ Success: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log("📝 All summaries stored in shortDescription field!");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
