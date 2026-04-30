import { PrismaClient } from "@prisma/client";
import express from "express";

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/children/parent/:parentId/children - Get all children for a parent
router.get("/parent/:parentId/children", async (req, res) => {
  try {
    const { parentId } = req.params;

    const children = await prisma.child.findMany({
      where: {
        userId: parseInt(parentId),
      },
      orderBy: {
        id: "asc",
      },
    });

    res.json(children);
  } catch (error) {
    console.error("Error fetching children:", error);
    res.status(500).json({ error: "Failed to fetch children" });
  }
});

export default router;
