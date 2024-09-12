const jwt = require("jsonwebtoken");
const User = require("../models/User");

// const protect = async (req, res, next) => {
//   let token;
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith("Bearer")
//   ) {
//     try {
//       token = req.headers.authorization.split(" ")[1];
//       const decoded = jwt.verify(token, "your_jwt_secret");
//       req.user = await User.findById(decoded.id).select("-password");
//       next();
//     } catch (error) {
//       res.status(401).json({ message: "Not authorized, token failed" });
//     }
//   } else {
//     res.status(401).json({ message: "Not authorized, no token" });
//   }
// };

// Middleware to verify JWT
const protect = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = decoded;
    next();
  });
};

const clientOnly = (req, res, next) => {
  if (req.user.role !== "client") {
    return res.status(403).json({ message: "Access forbidden: Clients only" });
  }
  next();
};

const freelancerOnly = (req, res, next) => {
  if (req.user.role !== "freelancer") {
    return res
      .status(403)
      .json({ message: "Access forbidden: Freelancers only" });
  }
  next();
};

module.exports = { protect, clientOnly, freelancerOnly };
