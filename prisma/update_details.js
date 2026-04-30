// --THIS FILE IS FOR READING EXSITING DB GAME TABLE, AND UPDATE ONLY THE 'decription' part

import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();

// --- Configuration ---
const EXTERNAL_API_URL = "https://api.rawg.io/api/games";
const API_KEY = process.env.EXTERNAL_GAME_API_KEY;
// ---------------------

async function fetchGameDetails(gameName) {
  try {
    // 1. Search by name to get the slug/ID
    const searchUrl = `${EXTERNAL_API_URL}?key=${API_KEY}&search=${encodeURIComponent(
      gameName
    )}&page_size=1`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    const gameSummary = searchData.results?.[0];
    if (!gameSummary) {
      console.warn(
        `\n🟡 Warning: Could not find game summary for: ${gameName}`
      );
      return null;
    }

    const gameId = gameSummary.id;

    // 2. Fetch full details using the game ID
    const detailUrl = `${EXTERNAL_API_URL}/${gameId}?key=${API_KEY}`;
    const detailResponse = await fetch(detailUrl);

    if (!detailResponse.ok) {
      console.error(
        `\n❌ Detail fetch failed for ${gameName} with status: ${detailResponse.status}`
      );
      return null;
    }

    const detailData = await detailResponse.json();
    return detailData;
  } catch (error) {
    console.error(
      `\n❌ Error fetching details for ${gameName}:`,
      error.message
    );
    return null;
  }
}

async function main() {
  console.log("🔄 Starting detailed description update job...");

  // 1. Find all games that are missing a description (null or empty string)
  const gamesToUpdate = await prisma.game.findMany({
    where: {
      description: null,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (gamesToUpdate.length === 0) {
    console.log("✅ All existing games have a description. Job finished.");
    return;
  }

  console.log(`\nFound ${gamesToUpdate.length} games missing descriptions...`);

  for (const [index, dbGame] of gamesToUpdate.entries()) {
    const percentage = ((index / gamesToUpdate.length) * 100).toFixed(1);
    process.stdout.write(
      `\r[${percentage}%] Fetching details for: ${dbGame.name}`
    );

    const rawgDetails = await fetchGameDetails(dbGame.name);

    if (rawgDetails && rawgDetails.description_raw) {
      try {
        // Update the database with the clean description and the developer
        await prisma.game.update({
          where: { id: dbGame.id },
          data: {
            description: rawgDetails.description_raw.trim(),
            // OPTIONAL: Also update developer if your schema supports it
            // developer: rawgDetails.developers?.[0]?.name,
          },
        });
        // console.log(`\n✅ Updated description for: ${dbGame.name}`);
      } catch (dbError) {
        console.error(
          `\n❌ DB UPDATE FAILED for ${dbGame.name}:`,
          dbError.message
        );
      }
    } else {
      // If the game is found but has no description, set a placeholder.
      await prisma.game.update({
        where: { id: dbGame.id },
        data: {
          description:
            "No detailed description available from external sources.",
        },
      });
    }
  }

  console.log("\n\n🎉 Detailed update job complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
