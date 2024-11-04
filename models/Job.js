const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: Number, required: true },
  bids: [
    {
      freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      bidAmount: { type: Number, required: true },
      proposal: { type: String, required: true },
      projectId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientJob" },
    },
  ],
});

const Job = mongoose.model("Job", jobSchema);
module.exports = Job;
