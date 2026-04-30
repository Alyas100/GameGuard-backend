// In a new file, e.g., backend/src/routes/genres.js
import express from "express";
import prisma from "../../../../prismaClient.js";

const router = express.Router();

router.get("/", async (req, res) => {
  console.log("🔍 Fetching all unique genres...");
  try {
    const genres = await prisma.game.findMany({
      distinct: ["genre"], // <-- This is the magic command
      select: {
        genre: true,
      },
      where: {
        NOT: { genre: null }, // Don't include nulls
      },
    }); // Convert the array of objects [ { genre: 'Action' } ] // into a simple array [ 'Action' ]

    const genreList = genres.map((g) => g.genre);
    console.log(`✅ Found ${genreList.length} genres.`);
    res.json({ success: true, genres: genreList });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
