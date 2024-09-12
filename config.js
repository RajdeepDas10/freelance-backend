const moongoose = require("mongoose");

const connectDB = async (URI) => {
  try {
    await moongoose.connect(URI);
    console.log("DB connected✅");
  } catch (error) {
    console.log("Database connection error❌", error);
  }
};

module.exports = connectDB;
