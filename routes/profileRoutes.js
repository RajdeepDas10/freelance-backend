const express = require("express");
const Profile = require("../models/Profile");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { ClientJob, FreelancerBid } = require("../models/Client-profile");
const User = require("../models/User");

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

// Create or update client profile
router.post("/add/client-project/:id", async (req, res) => {
  const { title, description, skills, budget, amountType, duration } = req.body;
  console.log("client project", req.params.id);
  try {
    const newProject = await ClientJob.create({
      clientId: req.params.id,
      title,
      description,
      skills,
      budget,
      amountType,
      duration,
    });
    await newProject.save();
    res.json(newProject);
  } catch (error) {
    console.error("Error adding new project:", error);
    res.status(400).json({ message: "Error adding new project", error });
  }
});

router.get("/client-jobs/:userId/:status", async (req, res) => {
  try {
    const status = req.params.status;
    let clientJobs;
    if (status === "all") {
      clientJobs = await ClientJob.find({ clientId: req.params.userId })
        .sort({
          createdAt: -1,
        })
        .populate("assignedFreelancerId", "username email")
        .populate("clientId", "username email")
        .populate("rating", "rating review")
        .populate("freelancerBid", "amount");
    } else if (status === "open") {
      clientJobs = await ClientJob.find({
        clientId: req.params.userId,
        status: "open",
      })
        .sort({ createdAt: -1 })
        .populate("assignedFreelancerId", "username email")
        .populate("clientId", "username email")
        .populate("rating", "rating review")
        .populate("freelancerBid", "amount");
    } else {
      clientJobs = await ClientJob.find({ clientId: req.params.userId })
        .sort({
          createdAt: -1,
        })
        .populate("assignedFreelancerId", "username email")
        .populate("clientId", "username email")
        .populate("rating", "rating review")
        .populate("freelancerBid", "amount");
    }
    res.json(clientJobs);
  } catch (error) {
    res.status(400).json({ message: "Error fetching client jobs", error });
  }
});

// Create bid API
router.post("/add/bid", async (req, res) => {
  const { projectId, amount, skills } = req.body;
  try {
    const bid = new FreelancerBid({
      projectId,
      clientId: req.user._id,
      amount,
      skills,
    });
    await bid.save();
    res.json(bid);
  } catch (error) {
    res.status(400).json({ message: "Error creating bid", error });
  }
});

// Get all bids API
router.get("/bids", async (req, res) => {
  try {
    const bids = await FreelancerBid.find({ freelancerId: req.user._id });
    res.json(bids);
  } catch (error) {
    res.status(400).json({ message: "Error getting bids", error });
  }
});

// Get bid by ID API
router.get("/bids/:id/:projectId", async (req, res) => {
  try {
    console.log("userid, projectid", req.params.id, req.params.projectId);
    const allbid = await FreelancerBid.find();
    console.log("all bids", allbid);
    const bid = await FreelancerBid.find({
      clientId: req.params.id,
      projectId: req.params.projectId,
      status: "pending",
    });
    const getFreeLanceUsers = await Promise.all(
      bid.map((bid) => User.findById(bid.assignedFreelancerId))
    );
    console.log("bid", bid);
    if (!bid) {
      return res.status(404).json({ message: "Bid not found" });
    }
    res.json({ bid, getFreeLanceUsers });
  } catch (error) {
    res.status(400).json({ message: "Error getting bid", error });
  }
});

// Accept bid API
router.put("/bids/accept/:id", async (req, res) => {
  try {
    const bid = await FreelancerBid.findById(req.params.id);
    if (!bid) {
      return res.status(404).json({ message: "Bid not found" });
    }
    const updateClientJob = await ClientJob.findOneAndUpdate(
      bid.projectId,
      {
        assignedFreelancerId: bid.assignedFreelancerId,
        status: "in-progress",
        freelancerBid: bid._id,
      },

      { new: true }
    );
    console.log("updateClientJob", updateClientJob);

    bid.status = "accepted";
    await bid.save();
    res.json(bid);
  } catch (error) {
    res.status(400).json({ message: "Error accepting bid", error });
  }
});

// Reject bid API
router.put("/bids/reject/:id", async (req, res) => {
  try {
    const bid = await FreelancerBid.findById(req.params.id);
    if (!bid) {
      return res.status(404).json({ message: "Bid not found" });
    }
    bid.status = "rejected";
    await bid.save();
    res.json(bid);
  } catch (error) {
    res.status(400).json({ message: "Error rejecting bid", error });
  }
});

// Update bid API
router.put("/bids/:id", async (req, res) => {
  try {
    const bid = await FreelancerBid.findById(req.params.id);
    if (!bid) {
      return res.status(404).json({ message: "Bid not found" });
    }
    bid.amount = req.body.amount;
    bid.proposal = req.body.proposal;
    await bid.save();
    res.json(bid);
  } catch (error) {
    res.status(400).json({ message: "Error updating bid", error });
  }
});

// Delete bid API
router.delete("/bids/:id", async (req, res) => {
  try {
    await FreelancerBid.findByIdAndRemove(req.params.id);
    res.json({ message: "Bid deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting bid", error });
  }
});

// Fetch in-progress projects for a client
router.get("/in-progress-projects/:clientId", async (req, res) => {
  console.log("clientId", req.params.clientId);
  try {
    const projects = await ClientJob.find({
      clientId: req.params.clientId,
      status: "in-progress",
    })
      .populate("assignedFreelancerId", "username email")
      .populate("");
    console.log("projects", projects);
    if (!projects) res.status(200).json({ message: "No projects found" });
    res.json(projects);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error fetching in-progress projects", error });
  }
});

// Complete client job API
router.put("/complete-client-job/:id", async (req, res) => {
  try {
    const job = await ClientJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    job.status = "completed";
    await job.save();
    res.json({ message: "Job completed successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error completing job", error });
  }
});
router.get("/freelancer-work/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const projects = await ClientJob.find({
      assignedFreelancerId: userId,
    })
      .populate("clientId", "username email")
      .populate("freelancerBid", "amount")
      .populate("rating", "rating review");
    const appliedProjects = await FreelancerBid.find({
      assignedFreelancerId: userId,
    }).populate(
      "projectId",
      "title description budget skills time createdAt amountType"
    );

    // get all completed projects
    const completedProjects = await ClientJob.find({
      assignedFreelancerId: userId,
      status: "completed",
    }).populate("clientId", "username email");

    // get project IDs from completed projects
    const projectIds = completedProjects.map((project) => project._id);

    // get amount from FreelancerBid for each project ID
    const getCompletedprojectAmount = await FreelancerBid.find({
      projectId: { $in: projectIds },
      assignedFreelancerId: userId,
      status: "accepted",
    });

    console.log("getCompletedprojectAmount", getCompletedprojectAmount);
    console.log("completedProjects", completedProjects);

    // const earnings = await FreelancerBid.find({
    //   assignedFreelancerId: userId,
    //   status: "completed",
    // });

    // console.log("earnings", earnings);

    const totalAmount = getCompletedprojectAmount.reduce(
      (acc, curr) => acc + curr.amount,
      0
    );
    const projectCount = await ClientJob.countDocuments({
      assignedFreelancerId: userId,
    });
    const ongoingProjectCount = await ClientJob.countDocuments({
      assignedFreelancerId: userId,
      status: "in-progress",
    });
    res.json({
      projects,
      appliedProjects,
      totalAmount,
      projectCount,
      ongoingProjectCount,
    });
  } catch (error) {
    res.status(400).json({ message: "Error fetching freelancer data", error });
  }
});

// create a api to update name,bio,skills,portfolio
router.put("/freelancer-profile/:userId", async (req, res) => {
  try {
    console.log("req.body", req.body);
    const userId = req.params.userId;
    const profile = await User.findOneAndUpdate({ _id: userId }, req.body, {
      new: true,
    });
    res.json(profile);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating freelancer profile", error });
  }
});

// get freelancer profile
router.get("/freelancer-profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error fetching freelancer profile", error });
  }
});

module.exports = router;
