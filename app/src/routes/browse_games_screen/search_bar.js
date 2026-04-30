import express from "express";
import prisma from "../../../../prismaClient.js";

const router = express.Router();

// Helper to convert frontend age ranges to the database's text values
const getAgeRatingFromRange = (range) => {
  switch (range) {
    case "3-7":
      return "Everyone";
    case "8-12":
      return "Everyone 10+";
    case "13-16":
      return "Teen";
    case "17+":
      return "Mature";
    default:
      return null;
  }
};

// --THIS FILE IS THE ONE RESPONSIBLE FOR FETCHING ALL 204 GAMES FROM DB WHEN THE 'BrowseGame'screen first load by user
// initially the search query is empty so thats why it returned all games, and when user search on the search bar and inputing some char of game nams,
// it will filter the games  and show onlty those games to the frontend to display

// GET /api/browse?search=...
router.get("/", async (req, res) => {
  // Get the search query from the URL (e.g., ?search=roblox)
  const {
    search,
    sortBy,
    ageRange,
    platforms,
    genres,
    //     islamicOnly,
    //     minSafetyScore
  } = req.query;

  try {
    let where = {}; // This will hold all our filter logic
    let orderBy = {}; // This will hold our sort logic // --- 2. Build Filter (WHERE) Object ---

    // These are all optional. If 'search' is the only thing sent,
    // this code will *only* filter by search.
    // If nothing is sent, 'where' remains {} and all games are returned.

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    //     if (islamicOnly === 'true') {
    //       where.islamicRating = { equals: 'compliant' };
    //     }
    //     if (minSafetyScore > 0) {
    //       where.riskScore = { gte: parseFloat(minSafetyScore) };
    //     }
    // Handle Platform filter (handles one or many platforms)
    if (platforms) {
      const platformList = Array.isArray(platforms) ? platforms : [platforms]; // Use 'hasSome' because 'platform' is an array in schema
      where.platform = { hasSome: platformList };
    }
    // Handle Genre filter (handles one or many genres)
    if (genres) {
      const genreList = Array.isArray(genres) ? genres : [genres]; // Use 'in' because 'genre' is a single string in your schema
      where.genre = { in: genreList };
    } // Handle Age Range

    const esrbRating = getAgeRatingFromRange(ageRange);
    if (esrbRating) {
      where.ageRating = { equals: esrbRating };
    } // --- 3. Build Sort (ORDER BY) Object ---

    switch (sortBy) {
      case "safety":
        orderBy = { riskScore: "desc" }; // Higher is better
        break;
      case "name":
        orderBy = { name: "asc" };
        break; // Add more cases as needed
      default:
        orderBy = { riskScore: "desc" };
    } // --- 4. Run the Final Query ---

    const games = await prisma.game.findMany({
      where: where, // filter logic
      orderBy: orderBy, // sort logic
    });
    console.log(`🔍 Found ${games.length} games matching query.`);
    res.json({ success: true, games: games });
  } catch (err) {
    console.error("❌ Error fetching browse games:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
