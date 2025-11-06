// backend/index.js
import express from "express";
import multer from "multer";
import prisma from "../../../../prismaClient.js";

const router = express.Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // save files to uploads/
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // unique filename
  },
});
const upload = multer({ storage });

// Parse multipart/form-data with single file 'screenshot'
router.post("/", upload.single("screenshot"), async (req, res) => {
  try {
    // Extract all fields from req.body
    const {
      game,
      platform,
      description,
      agreedToTerms,
      selectedDate,
      categories, // <-- make sure this key matches what frontend appends
    } = req.body;

    // Parse categories if it was sent as a JSON string
    const parsedCategories = categories ? JSON.parse(categories) : [];

    // Convert selectedDate to JS Date object
    const reportDate = selectedDate ? new Date(selectedDate) : null;

    // Build image URL path
    const imageUrl = req.file ? req.file.path : null;

    // convert the string into id
    const gameId = game ? parseInt(game) : undefined;

    console.log("🧾 Report Data:");
    console.log({
      game,
      platform,
      description,
      agreedToTerms,
      selectedDate,
      categories: parsedCategories,
    });

    // req.file contains the uploaded image info
    console.log("🖼️ Screenshot file:", req.file);

    // Save to Prisma DB
    const newReport = await prisma.report.create({
      data: {
        description,
        platform,
        imageUrl,
        selectedDate: reportDate,
        categories: parsedCategories,
        game: gameId ? { connect: { id: gameId } } : undefined,
        // user: userId ? { connect: { id: parseInt(userId) } } : undefined,  <- UNCOMMENT THIS LATER WHEN HAVE ACTUAL USER THAT SEND IT
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
