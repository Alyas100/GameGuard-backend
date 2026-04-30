import express from "express";
import prisma from "../../../../prismaClient.js"; // Adjust path if needed

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    // userId must be parsed from string (frontend param) to integer (DB type)
    const userId = parseInt(req.body.userId);
    const { countryCode } = req.body;

    // 1. Basic validation
    if (isNaN(userId) || !countryCode) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID or missing country code.",
      });
    }

    // 2. Update the User model in Prisma
    await prisma.user.update({
      where: { id: userId },
      data: {
        countryCode: countryCode,
      },
    });

    console.log(`DB Update: User ${userId} countryCode set to ${countryCode}`);

    res.json({
      success: true,
      message: "Country preference saved successfully.",
    });
  } catch (err) {
    console.error("❌ Error saving user country:", err);
    res.status(500).json({ success: false, error: "Internal server error." });
  }
});

export default router;
