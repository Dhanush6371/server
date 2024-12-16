const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();

const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:5173'], // Replace with actual frontends
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

let db;

// Connect to MongoDB
const uri = "mongodb+srv://Dhanush6371:Dhanush2002@cluster0.kozns.mongodb.net/restaurant?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect()
    .then(() => {
        db = client.db('Dhanush6371'); // Replace 'restaurant' with your database name
        console.log("Connected to MongoDB");
    })
    .catch(err => {
        console.error("Error connecting to MongoDB:", err);
    });

// Endpoint to send the order
app.post("/sendOrder", async (req, res) => {
    const tableNumber = String(req.query.table_num || req.body.tableNumber).trim();
    console.log("Request Query Parameters:", req.query);
    console.log("Request Body:", req.body);
    console.log("Extracted Table Number:", tableNumber);

    const { dishes, tokenId } = req.body;

    if (!tableNumber || isNaN(tableNumber)) {
        return res.status(400).json({ error: "A valid table number is required" });
    }

    const newOrder = {
        tableNumber,
        dishes,
        createdAt: new Date(),
        isDelivered: false,
        tokenId
    };

    try {
        const result = await db.collection('orders').insertOne(newOrder);
        console.log("Order saved:", result);
        res.status(200).json({ message: "Order received successfully", tokenId, orderId: result.insertedId });
    } catch (error) {
        console.error("Error storing order:", error);
        res.status(500).json({ error: "Error: " + error.message });
    }
});




// Endpoint to mark an order as delivered
app.post("/markAsDelivered", async (req, res) => {
    const { orderId } = req.body;

    try {
        const result = await db.collection('orders').updateOne(
            { _id: new ObjectId(orderId) },
            { $set: { isDelivered: true } }
        );

        if (result.matchedCount === 0) {
            res.status(404).json({ error: "Order not found" });
        } else {
            res.status(200).json({ message: "Order marked as delivered successfully" });
        }
    } catch (error) {
        console.error("Error marking order as delivered:", error);
        res.status(500).json({ error: "Error: " + error.message });
    }
});

// Endpoint to reserve a table
app.post("/reserveTable", async (req, res) => {
    const { name, phone, date, time, persons } = req.body;

    const reservation = {
        name,
        phone,
        date,
        time,
        persons,
        createdAt: new Date()
    };

    try {
        const result = await db.collection('reservations').insertOne(reservation);
        console.log(reservation);
        res.status(200).json({ message: "Reservation saved successfully", id: result.insertedId });
    } catch (error) {
        console.error("Error saving reservation:", error);
        res.status(500).json({ error: "Error: " + error.message });
    }
});


const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
