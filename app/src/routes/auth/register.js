import bcrypt from "bcryptjs"; // For hashing passwords
import express from "express";
import prisma from "../../../../prismaClient.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, password } = req.body; // 1. Validate input

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ success: false, error: "Please fill in all fields." });
    } // 2. Check if user already exists

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, error: "Email already in use." });
    } // 3. Hash the password

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt); // 4. Create the new user

    const newUser = await prisma.user.create({
      data: {
        name: name,
        email: email.toLowerCase(),
        password: hashedPassword, // Store the HASH, not the real password
      },
    }); // 5. Send back the new user (but not the password)

    res.status(201).json({
      success: true,
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
    });
  } catch (err) {
    console.error("❌ Error registering user:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
