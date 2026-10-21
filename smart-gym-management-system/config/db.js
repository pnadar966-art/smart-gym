const mongoose = require('mongoose');

// Connects to MongoDB using the connection string from environment variables.
// Works with MongoDB Atlas (cloud) in production and any MongoDB URI locally -
// nothing is hard-coded, so the same code works on localhost and on Render.
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('ERROR: MONGODB_URI is not defined. Set it in your .env file (local) or in Render environment variables (production).');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully.');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
