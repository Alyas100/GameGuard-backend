import express from "express";
import prisma from "../../../../prismaClient.js";

const router = express.Router();

// GET all reports submitted by a parent/user
router.get("/reports/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const parsedUserId = Number(userId);

    if (!userId || Number.isNaN(parsedUserId)) {
      return res
        .status(400)
        .json({ success: false, error: "userId is required" });
    }

    const reports = await prisma.report.findMany({
      where: { userId: parsedUserId },
      include: {
        game: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("GET /reports/user/:userId error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch submitted reports",
    });
  }
});

export default router;
