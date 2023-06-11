const express = require("express");
const cors = require("cors");
require("dotenv").config();
const  morgan = require('morgan')

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { param } = require("express/lib/request");
const req = require("express/lib/request");
const app = express();
const port = process.env.PORT || 5000;
const stripe =require('stripe')(process.env.PAYMENT_SECRET_KEY)

// middleware
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pfbgofj.mongodb.net/?retryWrites=true&w=majority`;

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

    const usersCollection = client.db("sportsDb").collection("users");
    const classesCollection = client.db("sportsDb").collection("classes");
    const bookingCollection = client.db("sportsDb").collection("bookings");
    const paymentCollection = client.db("sportsDb").collection("payments");


    // Generate Client secret for stripe

    app.post('/create-payment-intent', async(req, res)=>{
      const {price} = req.body;
      const amount =parseInt( price * 100);
      console.log(price, amount);
      const paymentIntent = await stripe.paymentIntents.create({
            amount:amount,
            currency: 'usd',
            payment_method_types: ['card']


      })
      res.send({
            clientSecret: paymentIntent.client_secret
      })
})

    // Users related api

    // get all users

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    //     save user email and role in db

    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    //Make Admin

    app.patch("/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Make instructor

    app.patch("/instructor/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "instructor",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });


    // get all instructor

    app.get('/instructors', async(req, res)=>{
     
      const result = await usersCollection.find().toArray()
      res.send(result)
    })


    // get role

    app.get('/role/:email', async(req, res)=>{
      const email = req.params.email 
      const query = {email: email}
      const result = await usersCollection.findOne(query)
     
      res.send(result)
    })


    // all api for classes

    // save a class

    app.post('/classes', async(req, res)=>{
      const classes = req.body
     
      const result = await classesCollection.insertOne(classes) 
      res.send(result)

    })

    // get all classes

    app.get('/classes', async(req, res)=>{
      const result = await classesCollection.find().toArray()
      
      res.send(result)
    })

    // get all class by email TODO

    app.get('/classes/:email', async(req, res)=>{
      const email = req.params.email
      const query = {'instructor.email': email}
      const result = await classesCollection.find(query).toArray()
      res.send(result)
    })


    // update for approve

    app.patch('/approved/:id', async(req, res)=>{
      const id = req.params.id 
      const filter = {_id: new ObjectId(id)}
      const updateDoc={
        $set:{
          status:'approved',
        }
      }
      const result = await classesCollection.updateOne(filter, updateDoc)
      res.send(result);
    })

    // update for deny

    app.patch('/deny/:id', async(req, res)=>{
      const id = req.params.id 
      const filter = {_id: new ObjectId(id)}
      const updateDoc={
        $set:{
          status:'deny',
        }
      }
      const result = await classesCollection.updateOne(filter, updateDoc)
      res.send(result);
    })



    // sent feedback

    
    app.put("/feedback/:email", async (req, res) => {
      const id = req.params.id
      const user = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // class by id

    app.get('/feedback/:id', async(req, res)=>{
      const id= req.params.id 
      const query = {_id: new ObjectId(id)}
      const result = await classesCollection.findOne(query)
      res.send(result)
    })
    // class by id

    app.get('/update/:id', async(req, res)=>{
      const id= req.params.id 
      const query = {_id: new ObjectId(id)}
      const result = await classesCollection.findOne(query)
      res.send(result)
    })

    // class update by id

    app.put('/classes/:id', async(req, res)=>{
      const id = req.params.id 
      const classes = req.body
      
      const filter = {_id: new ObjectId(id)}
      const options = {upsert: true}
      const updatedClass={
        $set:{
          name: classes.name,
          photo: classes.photo,
          price: classes.price,
          seats: classes.seats
        }
      }
      
      const result = await classesCollection.updateOne(filter, updatedClass, options)
      res.send(result)
    })



    // for feedback update 

    app.put("/updated/:id", async (req, res) => {
      const id = req.params.id;
      const user = req.body;
      const query = { _id: new ObjectId(id)};
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await classesCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });


    // get status
 
    
    app.get('/status/:id', async(req, res)=>{
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await classesCollection.findOne(query)
      console.log(result)
      res.send(result)
    })

    // get all classes

    app.get('/all-classes', async(req, res)=>{
      const result= await classesCollection.find().toArray()
      res.send(result)
    })

    // get 6 classes by using price

    app.get('/six-classes', async(req, res)=>{
     const result = await classesCollection.find().sort({students: -1}).limit(6).toArray()
      res.send(result)
    })


    // Bookings Related API------------


    // insert a booking to db

    
    app.post('/bookings', async(req, res)=>{
      const booking = req.body
      
      const result = await bookingCollection.insertOne(booking)
      res.send(result)
    })


    // get booking classes by user email

    app.get('/bookings/:email', async(req, res)=>{
      const email = req.params.email 
      const query = {email: email}
      const result = await bookingCollection.find(query).toArray()
      res.send(result)
    })

    // Booking delete by id 
    app.delete('/bookings/:id', async(req, res)=>{
      const id = req.params.id 
      const query = {_id: new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query)
      res.send(result)

    })

    

    // booking get by id
    
    app.get('/payment/:id', async(req, res)=>{
      const id = req.params.id 
      const query = {_id: new ObjectId(id)}
      const result = await bookingCollection.findOne(query)
      res.send(result)
    })


    // Payment Related Api

    app.post('/payment', async(req, res)=>{
      const payment = req.body 
      const result = await paymentCollection.insertOne(payment)
      res.send(result)
    })

    // all payment by email
app.get('/payment-all/:email', async(req, res)=>{
  const email = req.params.email
  const query = {email: email}
  const result = await paymentCollection.find(query).toArray()
  res.send(result)
})


    // uddate payment status by id

    
    app.patch('/payment/:id', async(req, res)=>{
      const id = req.params.id 
      const filter = {_id: new ObjectId(id)}
      const updateDoc={
        $set:{
          payment:'success',
        }
      }
      const result = await bookingCollection.updateOne(filter, updateDoc)
      res.send(result);
    })







    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //     await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Sports DB is Running.....");
});

app.listen(port, () => {
  console.log(`Sports DB is running on port: ${port}`);
});
