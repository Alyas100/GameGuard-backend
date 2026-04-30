import express from "express";
import prisma from "../../../../../prismaClient.js";

const router = express.Router();

/**
 * GET /api/children/:childId/monitored-games
 * Get all monitored games for a specific child
 */
router.get("/:childId/monitored-games", async (req, res) => {
  try {
    const { childId } = req.params;
    console.log(`🎮 Fetching monitored games for child ${childId}...`);

    const child = await prisma.child.findUnique({
      where: { id: parseInt(childId) },
      include: {
        monitoredGames: true,
      },
    });

    if (!child) {
      return res.status(404).json({ success: false, error: "Child not found" });
    }

    console.log(`✅ Found ${child.monitoredGames.length} monitored games`);
    res.json(child.monitoredGames);
  } catch (error) {
    console.error("❌ Error fetching monitored games:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch monitored games",
      message: error.message,
    });
  }
});

/**
 * POST /api/children/:childId/monitored-games
 * Add a game to child's monitoring list
 */
router.post("/:childId/monitored-games", async (req, res) => {
  try {
    const { childId } = req.params;
    const { gameId } = req.body;

    console.log(`➕ Adding game ${gameId} to child ${childId} monitoring...`);

    const updatedChild = await prisma.child.update({
      where: { id: parseInt(childId) },
      data: {
        monitoredGames: {
          connect: { id: parseInt(gameId) },
        },
      },
      include: {
        monitoredGames: true,
      },
    });

    console.log("✅ Game added to monitoring");
    res.json({
      success: true,
      monitoredGames: updatedChild.monitoredGames,
    });
  } catch (error) {
    console.error("❌ Error adding monitored game:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add monitored game",
      message: error.message,
    });
  }
});

/**
 * DELETE /api/children/:childId/monitored-games
 * Remove a game from child's monitoring list
 */
router.delete("/:childId/monitored-games", async (req, res) => {
  try {
    const { childId } = req.params;
    const { gameId } = req.body;

    console.log(
      `➖ Removing game ${gameId} from child ${childId} monitoring...`,
    );

    const updatedChild = await prisma.child.update({
      where: { id: parseInt(childId) },
      data: {
        monitoredGames: {
          disconnect: { id: parseInt(gameId) },
        },
      },
      include: {
        monitoredGames: true,
      },
    });

    console.log("✅ Game removed from monitoring");
    res.json({
      success: true,
      monitoredGames: updatedChild.monitoredGames,
    });
  } catch (error) {
    console.error("❌ Error removing monitored game:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove monitored game",
      message: error.message,
    });
  }
});

/**
 * GET /api/games
 * Get all available games
 */
router.get("/all-games", async (req, res) => {
  try {
    console.log("🎮 Fetching all games...");

    const games = await prisma.game.findMany({
      orderBy: { name: "asc" },
    });

    console.log(`✅ Found ${games.length} games`);
    res.json(games);
  } catch (error) {
    console.error("❌ Error fetching games:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch games",
      message: error.message,
    });
  }
});

export default router;
