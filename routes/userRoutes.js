const express = require("express");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { protect } = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");

const router = express.Router();

// Register
// router.post("/register", async (req, res) => {
//   const { username, email, password, role } = req.body;
//   try {
//     const user = await User.create({ username, email, password, role });
//     const token = jwt.sign({ id: user._id }, "your_jwt_secret", {
//       expiresIn: "30d",
//     });
//     res.status(201).json({ token });
//   } catch (error) {
//     res.status(400).json({ message: "Error registering user", error });
//   }
// });

// User registration
router.post("/register", async (req, res) => {
  try {
    const { username, password, email, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      username,
      password: hashedPassword,
      email,
      role: role || "freelancer", // Default to freelancer if no role provided
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
});

// User login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    console.log("user", user);
    if (user.isDeleted) {
      return res.status(400).json({ message: "User is not registered" });
    }
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Create a user object without the password
    const userWithoutPassword = user.toObject();

    delete userWithoutPassword.password;

    // Send the token and user data
    res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

// Login
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const user = await User.findOne({ email });
//     if (user && (await user.matchPassword(password))) {
//       const token = jwt.sign({ id: user._id }, "your_jwt_secret", {
//         expiresIn: "30d",
//       });
//       res.json({ token });
//     } else {
//       res.status(401).json({ message: "Invalid email or password" });
//     }
//   } catch (error) {
//     res.status(400).json({ message: "Error logging in", error });
//   }
// });

// Get user profile
router.get("/profile", protect, async (req, res) => {
  res.json(req.user);
});

// delete user
router.delete("/delete/freelancer-profile/:userId", async (req, res) => {
  await User.findByIdAndUpdate(req.params.userId, { isDeleted: true });
  res.json({ message: "User deleted successfully" });
});

module.exports = router;
