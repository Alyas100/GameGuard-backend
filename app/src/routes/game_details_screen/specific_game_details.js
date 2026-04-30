import express from "express";
import prisma from "../../../../prismaClient.js"; // Adjust path if needed

const router = express.Router();

// GET /details?name=...
// Fetches primary game details and related reports
router.get("/", async (req, res) => {
  // ... (Your existing /details code remains here) ...
  try {
    const { name } = req.query;

    if (!name) {
      console.error("❌ Error: Missing 'name' query parameter.");
      return res
        .status(400)
        .json({ success: false, error: "Game name is required." });
    }

    const gameDetails = await prisma.game.findUnique({
      where: { name: name },
      include: {
        reports: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!gameDetails) {
      return res.status(404).json({ success: false, error: "Game not found." });
    }

    const gameForResponse = {
      ...gameDetails,
      // Keep API contract stable: frontend still reads `description`.
      description: gameDetails.shortDescription || gameDetails.description,
    };

    res.json({ success: true, game: gameForResponse });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /alternatives?gameId=...
// Fetches the three safest alternatives based on riskScore.
router.get("/alternatives", async (req, res) => {
  try {
    const gameId = parseInt(req.query.gameId); // Get the current game's ID

    if (isNaN(gameId)) {
      return res.status(400).json({
        success: false,
        error: "Game ID is required and must be a number.",
      });
    }

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
      },
      select: {
        id: true,
        name: true,
        riskScore: true,
        imageUrl: true, // For displaying the image/icon
        // You can add other fields like genre or platform here
      },
      // Order by riskScore ASCENDING (lowest score = safest)
      orderBy: {
        riskScore: "asc",
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
