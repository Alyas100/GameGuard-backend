import { PrismaClient } from "@prisma/client";
import express from "express";

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/children/register
router.post("/register", async (req, res) => {
  try {
    const { parentId, childName, age } = req.body;

    if (!parentId || !childName || !age) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const child = await prisma.child.create({
      data: {
        childName,
        age: parseInt(age),
        userId: parseInt(parentId),
      },
    });

    res.status(201).json({
      message: "Child registered successfully",
      child: {
        id: child.id,
        childName: child.childName,
        age: child.age,
      },
    });
  } catch (error) {
    console.error("Error registering child:", error);
    res.status(500).json({ error: "Failed to register child" });
  }
});

export default router;
