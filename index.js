const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion,ObjectId } = require("mongodb");
const { application } = require("express");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});


// 8PfkKcXNAIHvgIvv

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a2sdt.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({ message: "Unauthorization access" });
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      req.decoded = decoded;
      next();
    });
  }

async function run() {
    try {
      await client.connect();
      const blogsCollection = client.db("educationProject").collection("blogs");
      const usersCollection = client.db("educationProject").collection("users");
      const couresesCollection = client.db("educationProject").collection("coureses");

      const verifyAdmin = async(req,res,next)=>{
      const decodedEmail = req.decoded.email;
      const requesterAccount = await usersCollection.findOne({
        email: decodedEmail,
      });
      if (requesterAccount.role === "Admin") {
        next()
      }else {
        res.status(403).send({ message: "forbidden access" });
      }
    }

      app.get('/blog',async(req,res,next)=>{
        const result = await blogsCollection.find().toArray()
        res.send(result)
      })
      app.post('/blog',async(req,res)=>{
          const blog = req.body
          const result = await blogsCollection.insertOne(blog)
          res.send(result)
        });
     // Get Admin
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email: email });
      const isAdmin = user.role === "Admin";
      res.send({ admin: isAdmin });
    });

    // Put Make Admin setup for database
    app.put("/user/admin/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;
        const filter = { email: email };
        const updateDoc = {
          $set: { role: "Admin" },
        };
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
     
    });
      app.get("/user", verifyJwt, async (req, res) => {
        const result = await usersCollection.find().toArray();
        res.send(result);
      });
     
      app.delete('/user/:id',async(req,res)=>{
        const id = req.params.id
        const filter = {_id:ObjectId(id)}
        const result = await usersCollection.deleteOne(filter)
        res.send(result)
      })
      // Put login or singup for database setup or Json web token create
      app.put("/user/:email", async (req, res) => {
        const email = req.params.email;
        const user = req.body;
        const filter = { email: email };
        const options = { upsert: true };
        const updateDoc = {
          $set: user,
        };
        const result = await usersCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        const token = jwt.sign(
          { email: email },
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: "1h",
          }
        );
        res.send({ result, token });
      });

      app.get('/coures',async(req,res,next)=>{
        const result = await couresesCollection.find().toArray()
        console.log(result)
        res.send(result)
      })

   
    } finally {
    }
  }
  run().catch(console.dir);
  
  app.listen(port, () => {
    console.log(`Education app listening on port ${port}`);
  });