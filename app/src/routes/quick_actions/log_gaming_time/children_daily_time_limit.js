import express from "express";
import prisma from "../../../../../prismaClient.js";

const router = express.Router();

// PUT /api/children/:id (update child including daily screen time limit)
router.put("/children/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { childName, age, dailyScreenTimeLimitMinutes } = req.body;

    if (!childName || !age) {
      return res.status(400).json({ error: "Name and age are required" });
    }

    const updateData = {
      childName,
      age: parseInt(age),
    };

    // ADD the daily limit if provided
    if (dailyScreenTimeLimitMinutes !== undefined) {
      updateData.dailyScreenTimeLimitMinutes = parseInt(
        dailyScreenTimeLimitMinutes,
      );
    }

    const updated = await prisma.child.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({
      success: true,
      message: `Child updated: ${updated.childName}`,
      child: updated,
    });
  } catch (error) {
    console.error("Error updating child:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
