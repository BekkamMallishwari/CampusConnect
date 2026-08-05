const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error('MONGO_URI is required for this test script.');
}

async function run() {
  console.log("Testing with Mongoose and ServerApi...");
  try {
    await mongoose.connect(uri, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });
    console.log("Mongoose connected successfully with ServerApi!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("Mongoose error:", err.message);
  }
}

run();
