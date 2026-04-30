import express from "express";
import prisma from "../../../../../prismaClient.js";

const router = express.Router();

/**
 * GET /api/screen-time/child/:childId
 * Returns all screen-time logs for one child
 */
router.get("/child/:childId", async (req, res) => {
  try {
    const childId = Number(req.params.childId);

    if (!Number.isInteger(childId) || childId <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid childId",
      });
    }

    const logs = await prisma.screenTimeLog.findMany({
      where: { childId },
      include: {
        game: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ logDate: "desc" }, { createdAt: "desc" }],
    });

    return res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error("Error fetching screen-time logs by child:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch screen-time logs",
      message: error.message,
    });
  }
});

export default router;
