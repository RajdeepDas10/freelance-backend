const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bio: { type: String },
  skills: [{ type: String }],
  portfolio: [{ type: String }], // URL to portfolio items
});

const Profile = mongoose.model("Profile", profileSchema);
module.exports = Profile;
