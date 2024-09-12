require("dotenv").config();
const express = require("express");
const userRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes");
const jobRoutes = require("./routes/jobRoutes");
const connectDB = require("./config");
const cors = require("cors");

const app = express();

// CORS configuration
app.use(
  cors({
    origin: "*", // Allow your frontend origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    credentials: true, // Allow cookies if you're using them
  })
);
app.use(express.json());

connectDB(process.env.MONGO_URI);

app.use("/api/users", userRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/jobs", jobRoutes);

app.use("/api/test", (req, res) => {
  res.send("Hello world");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
