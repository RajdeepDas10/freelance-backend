const mongoose = require("mongoose");

// Job Schema
const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: Number, required: true },
  skills: { type: String, required: true },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["open", "in-progress", "completed", "cancelled"],
    default: "open",
  },
  createdAt: { type: Date, default: Date.now },
  assignedFreelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  time: { type: String, required: false },
  amountType: {
    type: String,
    enum: ["fixed", "hourly"],
    default: "fixed",
  },
  duration: { type: String },
  rating: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Rating",
    required: false,
  },
});

// Bid Schema
const bidSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ClientJob",
    required: true,
  },
  clientId: { type: String, required: false },
  amount: { type: Number, required: true },
  proposal: { type: String, required: false },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  skills: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  assignedFreelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  duration: { type: String },
});

// Rating Schema
const ratingSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientJob" },
  rating: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  clientId: { type: String, required: false, ref: "User" },
  freelancerId: { type: String, required: false, ref: "User" },
  bidId: { type: mongoose.Schema.Types.ObjectId, ref: "FreelancerBid" },
  review: { type: String, required: false },
});

const ClientJob = mongoose.model("ClientJob", jobSchema);
const FreelancerBid = mongoose.model("FreelancerBid", bidSchema);
const Rating = mongoose.model("Rating", ratingSchema);

module.exports = { ClientJob, FreelancerBid, Rating };
