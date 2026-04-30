import { PrismaClient } from "@prisma/client";
import express from "express";

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/screen-time/log
router.post("/log", async (req, res) => {
  try {
    const { childId, gameId, durationMinutes, logDate } = req.body;

    if (!childId || !gameId || !durationMinutes) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const screenTimeLog = await prisma.screenTimeLog.create({
      data: {
        childId: Number(childId),
        gameId: Number(gameId),
        durationMinutes: Number(durationMinutes),
        logDate: logDate ? new Date(logDate) : new Date(),
      },
    });

    res.status(201).json({
      message: "Screen time logged successfully",
      log: screenTimeLog,
    });
  } catch (error) {
    console.error("Error logging screen time:", error);
    res.status(500).json({ error: "Failed to log screen time" });
  }
});

export default router;
