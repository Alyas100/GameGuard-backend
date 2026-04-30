// backend/src/routes/onboarding.js
import express from "express";
import prisma from "../../../prismaClient.js";

const router = express.Router();

router.post("/save", async (req, res) => {
  try {
    // 1. Get all the data from the frontend
    const { userId, childName, ageRange, concerns, monitoredGames } = req.body;

    console.log("DEBUG:", userId);

    console.log("✅ Backend received onboarding data for User ID:", userId); // 2. Parse the JSON strings back into objects/arrays

    const parsedUserId = parseInt(userId);
    console.log("userid:", parsedUserId);
    const parsedConcerns = JSON.parse(concerns); // e.g., ["😢 Bullying"]
    const parsedGameIds = JSON.parse(monitoredGames); // e.g., [1, 5, 3] // 3. Update the User's "keyConcerns"

    await prisma.user.update({
      where: { id: parsedUserId },
      data: { keyConcerns: parsedConcerns },
    });
    console.log("...Updated user's key concerns."); // 4. Create the new Child profile and connect it to the User // and connect the monitored games all at once.

    const newChild = await prisma.child.create({
      data: {
        name: childName,
        ageRange: ageRange, // Connect to the parent
        user: {
          connect: { id: parsedUserId },
        }, // Connect to all the selected games
        monitoredGames: {
          connect: parsedGameIds.map((id) => ({ id: id })), // e.g., [{id: 1}, {id: 5}]
        },
      },
    });
    console.log(
      `...Created new child '${newChild.name}' and linked ${parsedGameIds.length} games.`
    );

    res.json({ success: true, message: "Onboarding complete!" });
  } catch (err) {
    console.error("❌ Error saving onboarding data:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
