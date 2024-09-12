const express = require("express");
const Job = require("../models/Job");
const {
  protect,
  clientOnly,
  freelancerOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Post a job
router.post("/", protect, clientOnly, async (req, res) => {
  const { title, description, budget } = req.body;
  try {
    const job = await Job.create({
      client: req.user._id,
      title,
      description,
      budget,
    });
    res.status(201).json(job);
  } catch (error) {
    res.status(400).json({ message: "Error posting job", error });
  }
});

// Bid on a job
router.post("/:jobId/bid", protect, freelancerOnly, async (req, res) => {
  const { bidAmount, proposal } = req.body;
  try {
    const job = await Job.findById(req.params.jobId);
    job.bids.push({ freelancer: req.user._id, bidAmount, proposal });
    await job.save();
    res.json(job);
  } catch (error) {
    res.status(400).json({ message: "Error bidding on job", error });
  }
});

// Get all jobs
router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find().populate("client", "username");
    res.json(jobs);
  } catch (error) {
    res.status(400).json({ message: "Error fetching jobs", error });
  }
});

module.exports = router;
