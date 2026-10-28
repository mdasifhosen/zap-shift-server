const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();

const { MongoClient, ServerApiVersion } = require("mongodb");

const port = process.env.PORT || 3000;

// middleware
app.use(express.json());
app.use(cors());

// MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ac0iacr.mongodb.net/`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("zap_shift_db");
    const parcelsCollection = db.collection("parcels");

    // parcel api

    // get all parcels
    // get parcels by sender email
    app.get("/parcels", async (req, res) => {
      try {
        const { email } = req.query;

        const query = email ? { SenderEmail: email } : {};

        const result = await parcelsCollection.find(query).toArray();

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({
          message: "Failed to get parcels",
        });
      }
    });

    // save parcel
    app.post("/parcels", async (req, res) => {
      try {
        const parcel = req.body;
        const result = await parcelsCollection.insertOne(parcel);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to save parcel" });
      }
    });

    await client.db("admin").command({ ping: 1 });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );

    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);
  }
}

run();
