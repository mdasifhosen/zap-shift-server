const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
        const options={sort:{createdAt:-1}}

        const result = await parcelsCollection.find(query,options).toArray();

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({
          message: "Failed to get parcels",
        });
      }
    });

    app.get("/parcels/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await parcelsCollection.findOne(query);

      console.log(result);

      res.send(result);
    });

    // save parcel
    app.post("/parcels", async (req, res) => {
      try {
        const parcel = req.body;
        parcel.createdAt=new Date()
        const result = await parcelsCollection.insertOne(parcel);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to save parcel" });
      }
    });

    app.delete('/parcels/:id',async (req,res) => {
      const id = req.params.id
      const query = { _id: new ObjectId((id)) }
      const result = await parcelsCollection.deleteOne(query)
      res.send(result)
    })

    // payment related apis
    app.post('/payment-checkout-session', async (req, res) => {
      const paymentInfo=req.body
    })

    // old
    app.post("/create-checkout-session", async (req, res) => {
      const paymentInfo = req.body
      const amount=parseInt(paymentInfo.cost)*100
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'USD',
              unit_amount:amount,
              product_data: {
                name:paymentInfo.parcelName
              }
            },

            quantity: 1,
          },
        ],
        customer_email: paymentInfo.senderEmail,
        mode: "payment",
        metadata: {
          parcelId:paymentInfo.parcelId
        },
        success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success`,
        cancel_url: `${process.env.SITE_DOMAIN}/dashboard/payment-cancelled`,
      
      });
      console.log(session)
      res.send({ url: session.url })

  
})
 


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
