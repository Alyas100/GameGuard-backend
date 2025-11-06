// backend/src/routes/gameRoutes.js
import express from "express";
import prisma from "../../../../prismaClient.js";

const router = express.Router();

// GET /api/games
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;

    // Optional: allow filtering by name (like your frontend does)
    const games = await prisma.game.findMany({
      where: search
        ? {
            name: {
              contains: search,
              mode: "insensitive",
            },
          }
        : {},
      select: {
        id: true,
        name: true,
        platform: true,
        genre: true,
      },
    });

    res.json(games);
  } catch (err) {
    console.error("Error fetching games:", err);
    res.status(500).json({ error: "Failed to fetch games" });
  }
});

export default router;
