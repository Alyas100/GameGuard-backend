import express from "express";
import prisma from "../../../../prismaClient.js"; // Adjust path if needed

const router = express.Router();

// GET /details?name=...
// This route handles the request from your getGameDetailsByName function
router.get("/details", async (req, res) => {
  try {
    // 1. Extract the game name from the query parameters
    const { name } = req.query; // 2. Check if name was provided

    if (!name) {
      console.error("❌ Error: Missing 'name' query parameter.");
      return res
        .status(400)
        .json({ success: false, error: "Game name is required." });
    }

    console.log(`🔍 Searching for game details: ${name}`); // 3. Find the game in the DB using Prisma

    const gameDetails = await prisma.game.findUnique({
      where: {
        name: name,
      },
      include: {
        // Automatically include all reports related to this game
        reports: {
          // Sort reports, newest first
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    }); // 4. Handle if game is not found

    if (!gameDetails) {
      console.log(`🟡 Game not found: ${name}`);
      return res.status(404).json({ success: false, error: "Game not found." });
    } // 5. Send successful response

    // --- ADD THIS LOG BLOCK ---
    if (gameDetails.reports && gameDetails.reports.length > 0) {
      console.log(
        "🖼️ First report's image path in DB:",
        gameDetails.reports[0].imageUrl
      );
    } else {
      console.log("🖼️ No reports found in DB for image check.");
    }
    // --- END LOG BLOCK ---

    console.log(`✅ Found details for: ${gameDetails.name}`);
    res.json({ success: true, game: gameDetails });
  } catch (err) {
    console.error("❌ Error fetching game details:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
