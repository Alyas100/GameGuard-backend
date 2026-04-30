// backend/src/routes/children.js
import express from "express";
import prisma from "../../../../../prismaClient.js";

const router = express.Router();

// Register child and generate linking code
router.post("/", async (req, res) => {
  console.log("➕ Registering new child...");
  try {
    const { parentId, childName, age } = req.body;

    // Generate unique device ID
    const deviceId = `DEV-${parentId}-${Date.now()}`;

    const child = await prisma.child.create({
      data: {
        childName,
        age: parseInt(age),
        userId: parseInt(parentId),
        deviceId,
        isLinked: false,
      },
    });

    console.log(`✅ Child registered: ${childName}, deviceId: ${deviceId}`);
    res.json({ success: true, child });
  } catch (err) {
    console.error("❌ Error registering child:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all children for a parent
router.get("/parent/:parentId/children", async (req, res) => {
  console.log("👥 Fetching children for parent...");
  try {
    const { parentId } = req.params;

    const children = await prisma.child.findMany({
      where: {
        userId: parseInt(parentId),
      },
      orderBy: {
        id: "desc",
      },
    });

    console.log(`✅ Found ${children.length} children`);
    res.json({ success: true, children });
  } catch (err) {
    console.error("❌ Error fetching children:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single child by ID
router.get("/:childId", async (req, res) => {
  console.log("🔍 Fetching child by ID...");
  try {
    const { childId } = req.params;

    console.log("🔍 DEBUG - req.params:", req.params);
    console.log("🔍 DEBUG - childId:", childId);
    console.log("🔍 DEBUG - typeof childId:", typeof childId);

    if (!childId) {
      console.error("❌ childId is missing! req.params:", req.params);
      return res.status(400).json({ error: "childId parameter is required" });
    }

    const childIdNum = Number(childId);
    console.log("🔍 DEBUG - childIdNum:", childIdNum);
    console.log("🔍 DEBUG - isNaN(childIdNum):", isNaN(childIdNum));

    if (isNaN(childIdNum)) {
      console.error("❌ Invalid childId - must be a number:", childId);
      return res
        .status(400)
        .json({ error: "Invalid childId - must be a number" });
    }

    const child = await prisma.child.findUnique({
      where: {
        id: childIdNum,
      },
    });

    if (!child) {
      return res.status(404).json({ success: false, error: "Child not found" });
    }

    console.log(`✅ Found child: ${child.childName}`);
    res.json({ success: true, child });
  } catch (err) {
    console.error("❌ Error fetching child:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update child
router.put("/:childId", async (req, res) => {
  console.log("✏️ Updating child...");
  try {
    const { childId } = req.params;
    const { childName, age, dailyScreenTimeLimitMinutes } = req.body;

    const child = await prisma.child.update({
      where: {
        id: parseInt(childId),
      },
      data: {
        ...(childName && { childName }),
        ...(age !== undefined && { age: parseInt(age) }),
        ...(dailyScreenTimeLimitMinutes !== undefined && {
          dailyScreenTimeLimitMinutes: parseInt(dailyScreenTimeLimitMinutes),
        }),
      },
    });

    res.json({ success: true, child });
  } catch (err) {
    console.error("❌ Error updating child:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete child
router.delete("/:childId", async (req, res) => {
  console.log("🗑️ Deleting child...");
  try {
    const { childId } = req.params;

    await prisma.child.delete({
      where: {
        id: parseInt(childId),
      },
    });

    console.log(`✅ Child deleted`);
    res.json({ success: true, message: "Child deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting child:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Regenerate linking code
router.post("/:childId/regenerate-code", async (req, res) => {
  console.log("🔄 Regenerating linking code...");
  try {
    const { childId } = req.params;

    const newDeviceId = `DEV-${childId}-${Date.now()}`;

    const child = await prisma.child.update({
      where: {
        id: parseInt(childId),
      },
      data: {
        deviceId: newDeviceId,
        isLinked: false,
        linkedAt: null,
        linkedDeviceType: null,
        linkedDeviceModel: null,
      },
    });

    console.log(`✅ New deviceId generated: ${newDeviceId}`);
    res.json({ success: true, child });
  } catch (err) {
    console.error("❌ Error regenerating code:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Unlink device
router.post("/:childId/unlink", async (req, res) => {
  console.log("🔓 Unlinking device...");
  try {
    const { childId } = req.params;

    const child = await prisma.child.update({
      where: {
        id: parseInt(childId),
      },
      data: {
        isLinked: false,
        linkedAt: null,
        linkedDeviceType: null,
        linkedDeviceModel: null,
      },
    });

    console.log(`✅ Device unlinked`);
    res.json({ success: true, child });
  } catch (err) {
    console.error("❌ Error unlinking device:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
