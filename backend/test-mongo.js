const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error('MONGO_URI is required for this test script.');
}

async function run() {
  console.log("Testing with pure MongoClient...");
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log("MongoClient connected successfully!");
    await client.close();
  } catch (err) {
    console.error("MongoClient error:", err.message);
  }

  console.log("\nTesting with Mongoose...");
  try {
    await mongoose.connect(uri);
    console.log("Mongoose connected successfully!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("Mongoose error:", err.message);
  }
}

run();
