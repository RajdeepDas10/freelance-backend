const express = require("express");
const Job = require("../models/Job");
const {
  protect,
  clientOnly,
  freelancerOnly,
} = require("../middleware/authMiddleware");
const {
  ClientJob,
  FreelancerBid,
  Rating,
} = require("../models/Client-profile");
const User = require("../models/User");

const router = express.Router();

// Post a job
router.post("/", protect, clientOnly, async (req, res) => {
  const { title, description, budget, duration } = req.body;
  console.log("req.body", req.body);
  try {
    const job = await ClientJob.create({
      client: req.user._id,
      title,
      description,
      budget,
      duration,
    });
    res.status(201).json(job);
  } catch (error) {
    res.status(400).json({ message: "Error posting job", error });
  }
});

// Bid on a job
router.get("/bid/:jobId/:amount/:userId", async (req, res) => {
  const { jobId, amount, userId } = req.params;
  console.log("jobId, amount, userdid ", jobId, amount, userId);
  try {
    const checkUser = await User.findById({
      _id: userId,
      role: "freelancer",
    });
    if (!checkUser) res.json({ message: "Invalid User" });
    const getProjectOwner = await ClientJob.find({ _id: jobId });
    if (!getProjectOwner) res.json("No client Id found");
    const checkAlreadyApplied = await FreelancerBid.find({
      projectId: jobId,
      assignedFreelancerId: userId,
    });
    console.log("checkAlreadyApplied", checkAlreadyApplied);
    if (checkAlreadyApplied.length > 0)
      return res.json({ message: "Already Applied" });
    const job = await ClientJob.find({ _id: jobId });
    console.log("getProjectOwner", getProjectOwner);

    const bidDataSchema = {
      projectId: jobId,
      assignedFreelancerId: userId,
      amount: amount,
      clientId: getProjectOwner[0]?.clientId,
    };

    // Create new FreelancerBid instance and save it
    const newBid = new FreelancerBid(bidDataSchema);
    const savedBid = await newBid.save();
    res.json({ data: savedBid, message: "Bidding success" });
  } catch (error) {
    console.log("bidding error:::", error);
    res.status(400).json({ message: "Error bidding on job", error });
  }
});

// Get all jobs
router.get("/", async (req, res) => {
  try {
    const jobs = await ClientJob.find().populate("client", "username");
    res.json(jobs);
  } catch (error) {
    res.status(400).json({ message: "Error fetching jobs", error });
  }
});
// Get all jobs
router.get("/get/all/projects", async (req, res) => {
  try {
    const jobs = await ClientJob.find({
      status: "open",
    }).sort({ createdAt: -1 });
    res.json({ data: jobs, count: jobs.length });
  } catch (error) {
    res.status(400).json({ message: "Error fetching jobs", error });
  }
});

// get single project
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const job = await ClientJob.findById(id);
  res.json(job);
});

// get all bids for a project
router.get("/bids/list/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const bids = await FreelancerBid.find({ projectId: id })
      .populate("assignedFreelancerId", "username email")
      .populate("projectId", "title description budget duration status")
      .sort({ createdAt: -1 });
    res.json(bids);
  } catch (error) {
    res.status(400).json({ message: "Error fetching bids", error });
  }
});

router.post("/rate/:id/:projectId", async (req, res) => {
  const { id, projectId } = req.params;
  const { rating, review } = req.body.data;

  console.log("req body", req.body);
  try {
    const job = await ClientJob.findById(projectId)
      .populate("clientId", "_id username email")
      .populate("assignedFreelancerId", "_id username email");
    if (!job) return res.status(404).json({ message: "Project not found" });
    if (job.isRated)
      return res.status(204).json({ message: "Project already rated" });
    // add rating to rating schema
    const ratingData = {
      projectId,
      rating: parseInt(rating),
      review,
      bidId: id,
      clientId: job.clientId._id, // client id
      freelancerId: job.assignedFreelancerId._id, // freelancer id
    };

    const getRating = await Rating.create(ratingData);
    // update the project status to completed
    await ClientJob.findByIdAndUpdate(projectId, {
      isRated: true,
      rating: getRating._id,
    });

    res.json({ message: "Project rated successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error rating project", error });
  }
});

module.exports = router;
