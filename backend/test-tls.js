const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error('MONGO_URI is required for this test script.');
}

async function run() {
  console.log("Testing with pure MongoClient and TLS minVersion...");
  try {
    const client = new MongoClient(uri, { tls: true, tlsMinVersion: 'TLSv1.2' });
    await client.connect();
    console.log("MongoClient connected successfully with explicit tls!");
    await client.close();
  } catch (err) {
    console.error("MongoClient error:", err.message);
  }
}

run();
