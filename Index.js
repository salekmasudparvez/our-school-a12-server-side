const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const corsOptions = {
  origin: [
    "http://localhost:5173",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2gfcy7h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const db = client.db('OurSchoolDB')
    const usersCollection = db.collection('users')
    const sessionCollection = db.collection('sessions')

    //handle users collection
     app.post('/users', async(req,res)=>{
        const newUser = req.body;
        console.log(newUser)
        const result = await usersCollection.insertOne(newUser);
        res.send(result)
     })

     app.get('/users/:email', async(req,res)=>{
        const currentEmail = req.params.email
        console.log(currentEmail)
        const singleUser = await usersCollection.findOne({email:currentEmail});
        res.send(singleUser)
     })

     //session data part
     app.get('/sessions', async (req, res) => {
      const allSessions = await sessionCollection.find({}).toArray();
      res.send(allSessions);
     })
     app.get('/sessions/:id', async (req, res) => {
      const getID = req.params.id;
      const query =  {
        _id:new ObjectId(getID),
      }
      console.log(query)
      const allSessions = await sessionCollection.find(query).toArray();
      res.send(allSessions);
     })
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("amazon is busy shopping");
});

app.listen(port, () => {
  console.log(`ourschool server is running on port: ${port}`);
});
