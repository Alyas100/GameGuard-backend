import express from "express";
import prisma from "../../../../prismaClient.js"; // Adjust path if needed

const router = express.Router();

// GET /alternatives?gameId=...
// Fetches the three safest alternatives based on riskScore.
router.get("/", async (req, res) => {
  try {
    const gameId = parseInt(req.query.gameId); // Get the current game's ID

    if (isNaN(gameId)) {
      return res.status(400).json({
        success: false,
        error: "Game ID is required and must be a number.",
      });
    }

    // 1. Fetch the genre of the current game
    const currentGame = await prisma.game.findUnique({
      where: { id: gameId },
      select: { genre: true },
    });

    // Handle case where the game itself or its genre data is missing
    if (!currentGame || !currentGame.genre) {
      console.warn(
        `🟡 Warning: Current game (ID: ${gameId}) or its genre is missing. Skipping genre filter.`
      );
    }

    const targetGenre = currentGame?.genre;

    // 1. Fetch games with lower risk scores, excluding the current game.
    const saferAlternatives = await prisma.game.findMany({
      where: {
        // Exclude the current game
        id: {
          not: gameId,
        },
        // Only consider games that have been scored
        riskScore: {
          not: null,
        },

        // --- NEW FILTER: MUST BE THE SAME GENRE ---
        // Only apply the genre filter if we successfully found a genre for the current game
        ...(targetGenre && { genre: targetGenre }),
        // Note: Prisma expects an exact string match for the genre field here.
      },
      select: {
        id: true,
        name: true,
        riskScore: true,
        imageUrl: true, // For displaying the image/icon
        // You can add other fields like genre or platform here

        genre: true,
      },
      // Order by riskScore ASCENDING (lowest score = safest)
      orderBy: {
        riskScore: "desc",
      },
      // Limit to the top 3 safest games
      take: 3,
    });

    res.json({ success: true, alternatives: saferAlternatives });
  } catch (err) {
    console.error("❌ Error fetching safer alternatives:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
