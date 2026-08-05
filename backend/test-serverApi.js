const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error('MONGO_URI is required for this test script.');
}

async function run() {
  console.log("Testing with pure MongoClient and ServerApi...");
  try {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
    await client.connect();
    console.log("MongoClient connected successfully with ServerApi!");
    await client.close();
  } catch (err) {
    console.error("MongoClient error:", err.message);
  }
}

run();
