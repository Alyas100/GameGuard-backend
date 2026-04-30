// prisma/seed_games.js
import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();

// --- Configuration ---
// Replace with the actual endpoint and your API key
const EXTERNAL_API_URL = "https://api.rawg.io/api/games";
const API_KEY = process.env.EXTERNAL_GAME_API_KEY;
const GAMES_TO_FETCH = 200;
// ---------------------

async function fetchGameDetails(gameId) {
  /**
   * Fetch individual game details from RAWG to get full description
   */
  try {
    const detailUrl = `https://api.rawg.io/api/games/${gameId}?key=${API_KEY}`;
    const response = await fetch(detailUrl);

    if (!response.ok) {
      return null;
    }

    const gameDetails = await response.json();
    return {
      description:
        gameDetails.description_raw || gameDetails.description || null,
    };
  } catch (error) {
    console.error(`⚠️  Could not fetch details for game ID ${gameId}`);
    return null;
  }
}

async function main() {
  console.log("🚀 Starting game data bootstrapping...");

  let page = 1;
  let gamesInsertedCount = 0;

  while (gamesInsertedCount < GAMES_TO_FETCH) {
    const url = `${EXTERNAL_API_URL}?key=${API_KEY}&page=${page}&page_size=40`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API fetch failed with status: ${response.status}`);
      }

      const data = await response.json();
      const games = data.results; // Assuming API returns results array

      if (!games || games.length === 0) {
        console.log("✅ Reached end of available games.");
        break;
      }

      for (const game of games) {
        // --- Data Mapping and Sanitization ---
        const gameName = game.name?.trim();
        const gamePlatform = game.platforms?.map((p) => p.platform.name) || [];
        const gameGenre = game.genres?.[0]?.name || "Unknown";
        const gameAgeRating = game.esrb_rating?.name || "Rating Pending";
        const gameImageUrl = game.background_image || null;
        const gameId = game.id;
        // ------------------------------------

        // --- Extract and convert the release date ---
        let gameReleaseDate = null;
        if (game.released) {
          gameReleaseDate = new Date(game.released);
        }
        // ------------------------------------

        // --- Fetch full game details for complete description ---
        let gameDescription = game.description_raw || game.description || null;

        if (gameId) {
          const details = await fetchGameDetails(gameId);
          if (details && details.description) {
            gameDescription = details.description;
          }
          // Add a small delay to avoid rate limiting (100ms)
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        // ------------------------------------

        if (gameName) {
          try {
            await prisma.game.upsert({
              where: { name: gameName },
              update: {
                platform: gamePlatform,
                genre: gameGenre,
                ageRating: gameAgeRating,
                imageUrl: gameImageUrl,
                releaseDate: gameReleaseDate,
                description: gameDescription,
              },
              create: {
                name: gameName,
                platform: gamePlatform,
                genre: gameGenre,
                ageRating: gameAgeRating,
                imageUrl: gameImageUrl,
                releaseDate: gameReleaseDate,
                description: gameDescription,
              },
            });

            gamesInsertedCount++;
            if (gamesInsertedCount % 10 === 0) {
              process.stdout.write(`| Inserted: ${gamesInsertedCount}`);
            }
          } catch (dbError) {
            if (!dbError.message.includes("Unique constraint failed")) {
              console.error(
                `\n❌ DB error inserting ${gameName}:`,
                dbError.message,
              );
            }
          }
        }
      }

      console.log(`\n✅ Page ${page} processed.`);
      page++;
    } catch (apiError) {
      console.error("\n❌ Fatal API Error:", apiError);
      break;
    }
  }

  console.log(
    `\n🎉 Bootstrapping complete! Total games processed: ${gamesInsertedCount}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
