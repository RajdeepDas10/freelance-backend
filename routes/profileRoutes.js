const express = require("express");
const Profile = require("../models/Profile");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Create or update profile
router.post("/profile/:id", protect, async (req, res) => {
  const { bio, skills, portfolio } = req.body;
  try {
    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      { bio, skills, portfolio },
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (error) {
    res.status(400).json({ message: "Error creating/updating profile", error });
  }
});

// Get profile by user ID
router.get("/:userId", async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId }).populate(
      "user",
      "username"
    );
    res.json(profile);
  } catch (error) {
    res.status(400).json({ message: "Error fetching profile", error });
  }
});

// Upload portfolio item
router.post("/portfolio", protect, upload.single("file"), async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    profile.portfolio.push(`/uploads/${req.file.filename}`);
    await profile.save();
    res.json(profile);
  } catch (error) {
    res.status(400).json({ message: "Error uploading portfolio item", error });
  }
});

module.exports = router;
