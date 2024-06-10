const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5000",
    "https://server-study.vercel.app",
    "https://sm-ourschool.netlify.app",
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

    const db = client.db("OurSchoolDB");
    const usersCollection = db.collection("users");
    const sessionCollection = db.collection("sessions");
    const bookedSessionCollection = db.collection("bookedSessions");
    const reviewsCollection = db.collection("reviews");
    const notesCollection = db.collection("notes");
    const pendingSessionCollection = db.collection("pendingSession");
    const materialsCollection = db.collection("materials");
    const feedBackCollection = db.collection("feedBack");

    //jwt related api
    app.post("/jwt", (req, res) => {
      const { email } = req.body;
      if (!email) {
        return res.status(400).send({ error: "Email is required" });
      }
      console.log(email, "jwt-----", process.env.ACCESS_TOKEN_SECRET);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "365d",
        }
      );
      res.send({ token });
    });
    //handle users collection
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const findOldUser = await usersCollection.findOne({
        email: newUser.email,
      });
      if (findOldUser) {
        res.status(400).send("User already exist");
        return;
      }
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    app.get("/users/:email", async (req, res) => {
      const currentEmail = req.params.email;
      // console.log(currentEmail);
      const singleUser = await usersCollection.findOne({ email: currentEmail });
      res.send(singleUser);
    });
    app.get("/allusers", async (req, res) => {
      const getSearch = req.query.search;
      const getEmail = req.query.email;
      let query = {};
      if (getSearch) {
        query = { name: getSearch };
      }
      if (getEmail) {
        query = { email: getEmail };
      }

      const allUsers = await usersCollection.find(query).toArray();
      res.send(allUsers);
    });
    app.patch("/allusers", async (req, res) => {
      const obj = req.body;
      const query = {
        email: obj.email,
      };
      const updateDoc = {
        $set: { role: obj.updateRole },
      };
      console.log(obj, "line65");
      const allUsers = await usersCollection.updateOne(query, updateDoc);
      res.send(allUsers);
    });
    //get ALl tutor to show in home
    app.get("/alltutors", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const allTutors = await usersCollection
        .find({ role: "Teacher" })
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(allTutors);
    });
    app.get("/tutorsCount", async (req, res) => {
      const tutor = await usersCollection.find({ role: "Teacher" }).toArray();
      const count = await tutor.length;
      res.send({ count });
    });

    //session data part and paginations
    app.get("/sessions", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const allSessions = await sessionCollection
        .find({})
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(allSessions);
    });
    app.get("/sessionsCount", async (req, res) => {
      const count = await sessionCollection.estimatedDocumentCount();
      res.send({ count });
    });

    app.get("/session/:id", async (req, res) => {
      const getID = req.params.id;
      const query = {
        _id: new ObjectId(getID),
      };
      const allSessions = await sessionCollection.findOne(query);
      res.send(allSessions);
    });
    //tutor call approved session
    app.get("/approvedsessions/:email", async (req, res) => {
      const getEmail = req.params.email;
      const query = {
        TutorEmail: getEmail,
      };
      const allSessions = await sessionCollection.find(query).toArray();
      res.send(allSessions);
    });

    //BOOK session FROM STUDENT from session details

    app.get("/bookedsessions", async (req, res) => {
      const getEmail = req.query.email;
      const getId = req.query.id;
      const query = {
        BookId: getId,
        studentEmail: getEmail,
      };
      // console.log(query);
      const singleSession = await bookedSessionCollection.findOne(query);
      res.send(!!singleSession);
    });
    app.get("/bookedsessiontable/:email", async (req, res) => {
      const email = req.params.email;
      const allSessions = await bookedSessionCollection
        .find({
          studentEmail: email,
        })
        .toArray();
      res.send(allSessions);
    });

    app.post("/bookedsession", async (req, res) => {
      const newSession = req.body;
      // console.log(newSession);
      const result = await bookedSessionCollection.insertOne(newSession);
      res.send(result);
    });
    //get reviews and post review
    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      //console.log(id,'line97')
      const allReviews = await reviewsCollection
        .find({ reviewId: id })
        .toArray();
      res.send(allReviews);
    });
    app.get("/reviewAvg/:id", async (req, res) => {
      //getavaragte
      const id = req.params.id;
      //console.log(id,'line97')
      const allReviews = await reviewsCollection.aggregate([
        {
          $match: { reviewId: id }
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" }
          }
        }
      ]).toArray();
      res.send(allReviews);
    });
    app.post("/reviews", async (req, res) => {
      const newReview = req.body;
      //console.log(newReview);
      const result = await reviewsCollection.insertOne(newReview);
      res.send(result);
    });
    //get and post and update notes
    app.get("/notes/:email", async (req, res) => {
      const getEmail = req.params.email;
      const allNotes = await notesCollection
        .find({ email: getEmail })
        .toArray();
      res.send(allNotes);
    });
    app.get("/noteUpdate/:id", async (req, res) => {
      const getId = req.params.id;
      const allNotes = await notesCollection.findOne({
        _id: new ObjectId(getId),
      });
      res.send(allNotes);
    });

    app.patch("/noteUpdate/:id", async (req, res) => {
      const getId = req.params.id;
      const obj = req.body;
      const updateDoc = {
        $set: {
          description: obj.description,
          title: obj.title,
        },
      };
      const filter = { _id: new ObjectId(getId) };
      const result = await notesCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.post("/notes", async (req, res) => {
      const newNote = req.body;

      const result = await notesCollection.insertOne(newNote);
      res.send(result);
    });
    app.delete("/notes/:id", async (req, res) => {
      const getId = req.params.id;
      const result = await notesCollection.deleteOne({
        _id: new ObjectId(getId),
      });
      res.send(result);
    });
    //sessions get, post from tuitor....

    app.post("/pendingSessions", async (req, res) => {
      const newSession = req.body;
      // console.log(newSession);
      const result = await pendingSessionCollection.insertOne(newSession);
      res.send(result);
    });

    app.get("/aceptsession/:email", async (req, res) => {
      //tutor calling
      const getEmail = req.params.email;
      // console.log(getEmail,'line164')
      const pendingSessions = await pendingSessionCollection
        .find({ TutorEmail: getEmail })
        .toArray();
      res.send(pendingSessions);
    });
    //tutor send call for recheck
    app.patch("/aceptsession", async (req, res) => {
      const obj = req.body;
      console.log(obj, "line210");
      const updateDoc = {
        $set: {
          Status: "pending",
        },
      };
      const filter = { _id: new ObjectId(obj.id) };
      const deleteFeedBack = await feedBackCollection.deleteOne({
        sessionId: obj.id,
      });
      const result = await pendingSessionCollection.updateOne(
        filter,
        updateDoc
      );
      res.send(result);
    });
    //get all sessions from pending sessions
    app.get("/pendingsessions", async (req, res) => {
      const allSessions = await pendingSessionCollection.find({}).toArray();
      res.send(allSessions);
    });
    //get all sessions from pendingsessionscollection by status
    app.get("/allsessions", async (req, res) => {
      const getID = req.query.id;
      console.log(typeof getID, getID);
      let query = {};
      if (getID === "0") {
        query = {
          Status: "pending",
        };
      }
      if (getID === "1") {
        query = {
          Status: "rejected",
        };
      }
      if (getID === "2") {
        query = {
          Status: "approved",
        };
      }
      const allSessions = await pendingSessionCollection.find(query).toArray();
      res.send(allSessions);
    });
    //admin change status
    app.patch("/allsessionsstatus", async (req, res) => {
      const getObject = req.body;
      //console.log(getObject,'line-230')
      const session = getObject.sessionObject;
      if (getObject.status === "approved") {
        //console.log('home e post koresi')
        session.sessionId = getObject.id;
        delete session._id;
        session.RegistrationFee = getObject.fee;
        //console.log(session, "line258");
        const sessionsApproved = await sessionCollection.insertOne(session);
      }
      if (getObject.status === "rejected") {
        const feedBackObj = {
          rejectReason: getObject.feedBackPart.reason,
          feedBack: getObject.feedBackPart.feedback,
          sessionId: getObject.id,
        };
        console.log(feedBackObj, "line318");
        const sessionFeedBack = await feedBackCollection.insertOne(feedBackObj);
        //res.send({status:"rejected"})
      }
      const allSessions = await pendingSessionCollection.updateOne(
        { _id: new ObjectId(getObject.id) },
        { $set: { Status: getObject.status, RegistrationFee: getObject.fee } }
      );
      res.send(allSessions);
    });
    //feedback get and delete tutor
    app.get("/feedback/:id", async (req, res) => {
      const getID = req.params.id;
      console.log(getID, "line331");
      const Feedback = await feedBackCollection.findOne({ sessionId: getID });
      if (!Feedback) {
        return res.status(400).send({ error: "_Id is required" });
      }
      res.send(Feedback);
    });
    //admin approved sessions update , get and delete

    app.patch("/sessionsDetails", async (req, res) => {
      const getObject = req.body;
      const filter = { _id: new ObjectId(getObject.id) };
      const filterSessionCollection = { sessionId: getObject.id };
      delete getObject.id;

      const updateSessionCollection = await sessionCollection.updateOne(
        filterSessionCollection,
        { $set: getObject }
      );

      // Update pending session collection call tutor
      const allSessions = await pendingSessionCollection.updateOne(filter, {
        $set: getObject,
      });
      res.status(200).send({ message: "Update successful" });
    });
    app.get("/sessionsDetails/:id", async (req, res) => {
      const getID = req.params.id;
      const allSessions = await pendingSessionCollection.findOne({
        _id: new ObjectId(getID),
      });
      res.send(allSessions);
    });

    app.delete("/deleteSession/:id", async (req, res) => {
      const getId = req.params.id;
      console.log(getId, "line310");
      const sessionDelete = await sessionCollection.deleteOne({
        sessionId: getId,
      });
      const pendingSessionDelete = await pendingSessionCollection.deleteOne({
        _id: new ObjectId(getId),
      });
      res.send(pendingSessionDelete);
    });
    //manage materials from tutor
    app.post("/materials", async (req, res) => {
      const newMaterial = req.body;
      // console.log(newMaterial,'line173');
      const result = await materialsCollection.insertOne(newMaterial);
      res.send(result);
    });
    app.get("/materials/:email", async (req, res) => {
      const getEmail = req.params.email;
      const materials = await materialsCollection
        .find({ tutorEmail: getEmail })
        .toArray();
      res.send(materials);
    });
    app.delete("/materials/:id", async (req, res) => {
      const getId = req.params.id;
      const materials = await materialsCollection.deleteOne({
        sessionId: getId,
      });
      res.send(materials);
    });
    app.patch("/material", async (req, res) => {
      const obj = req.body;
      const updateDoc = {
        $set: {
          materialsUrl: obj.materialsUrl,
          imageUrl: obj.imageUrl,
        },
      };

      const filter = { sessionId: obj.sessionId };
      const result = await materialsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //mterial get in homePAGE students
    app.get("/singleMaterial/:id", async (req, res) => {
      const getId = req.params.id;
      //console.log(getId,'line358')
      const materials = await materialsCollection.findOne({
        sessionId: getId,
      });
      res.send(materials);
    });
    //mterial get in DASHBOARD students
    app.get("/studyMaterials/:email", async (req, res) => {
      const getEmail = req.params.email;
      const findBooked = await bookedSessionCollection.findOne({
        studentEmail: getEmail,
      });
     
      const materials = await materialsCollection.find({ sessionId: findBooked?.BookId }).toArray();
      res.send(materials);
    });
    //material handle-Admin

    app.get("/allMaterials", async (req, res) => {
      const allMaterials = await materialsCollection.find({}).toArray();
      res.send(allMaterials);
    });
    app.get("/classEndDate/:id", async (req, res) => {
      const getId = req.params.id;
      //console.log(getId,'line372')
      const sessions = await sessionCollection.findOne({
        _id: new ObjectId(getId),
      });
      res.send(sessions);
    });

    app.delete("/deleteMaterials/:id", async (req, res) => {
      const getId = req.params.id;
      console.log(getId, "<<<<<");
      const allMaterials = await materialsCollection.deleteOne({
        _id: new ObjectId(getId),
      });
      res.send(allMaterials);
    });

    //await client.db("admin").command({ ping: 1 });
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
  res.send("OurSchool is busy shopping");
});

app.listen(port, () => {
  console.log(`ourschool server is running on port: ${port}`);
});
