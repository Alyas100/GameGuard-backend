// backend/src/routes/userProfile.js
import express from "express";
import prisma from "../../../../prismaClient.js";

const router = express.Router();

// GET /api/user-profile/:userId
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  console.log(`🔍 Fetching profile for user ID: ${userId}...`);

  try {
    // Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        name: true,
        email: true,
        countryCode: true, // make sure your User model has this column
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    console.log("📩 Backend responded with:", user.countryCode); // <-- ADD THIS

    console.log(`✅ Profile found for user: ${user.name}`);
    res.json({ success: true, user });
  } catch (err) {
    console.error("❌ Error fetching user profile:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
