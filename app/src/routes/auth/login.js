import bcrypt from "bcryptjs"; // For comparing passwords
import express from "express";
import prisma from "../../../../prismaClient.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body; // 1. Validate input

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Please provide email and password." });
    } // 2. Find the user

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    }); // 3. Check if user exists

    if (!user) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid credentials." });
    } // 4. Check if password is correct

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid credentials." });
    } // 5. Send back the user (but not the password) // (In a real app, you would send a JWT token here)

    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("❌ Error logging in user:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
