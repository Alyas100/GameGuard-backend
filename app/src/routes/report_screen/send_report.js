// backend/index.js
import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "../../../../prismaClient.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../../../../uploads");

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Always write to backend/uploads regardless of process cwd.
    fs.mkdirSync(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // unique filename
  },
});
const upload = multer({ storage });

// Parse multipart/form-data with single file 'screenshot'
// Parse multipart/form-data with single file 'screenshot'
router.post("/", upload.single("screenshot"), async (req, res) => {
  try {
    // --- FIX 1: Destructure the NEW fields from req.body ---
    // Your frontend now sends 'gameId' or 'gameName'
    const {
      gameId,
      gameName, // <-- This is what was missing
      platform,
      description,
      agreedToTerms,
      selectedDate,
      categories,
    } = req.body; // --- FIX 2: Parse all fields correctly ---

    const parsedCategories = categories ? JSON.parse(categories) : {}; // Default to object
    const parsedPlatforms = platform ? JSON.parse(platform) : []; // Default to array
    const reportDate = selectedDate ? new Date(selectedDate) : null;
    const imageUrl = req.file ? `uploads/${req.file.filename}` : null;
    const parsedGameId = gameId ? parseInt(gameId) : undefined; // Use the gameId from frontend // --- This console.log will now work ---

    console.log("🧾 Report Data:");
    console.log({
      parsedGameId,
      gameName,
      platform: parsedPlatforms,
      categories: parsedCategories,
    });

    console.log("🖼️ Screenshot file:", req.file); // --- FIX 3: Save to Prisma DB (Removed duplicates) ---

    const newReport = await prisma.report.create({
      data: {
        description,
        platform: parsedPlatforms,
        imageUrl,
        selectedDate: reportDate,
        categories: parsedCategories, // This correctly links the report to the game ID

        game: parsedGameId ? { connect: { id: parsedGameId } } : undefined,
      },
    });

    console.log("✅ Saved report to DB:", newReport);
    res.json({ success: true, report: newReport });
  } catch (err) {
    console.error("❌ Error saving report:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
export default router;
