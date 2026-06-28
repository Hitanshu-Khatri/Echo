import express from "express";
import {createServer} from "node:http";
import {Server} from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import {connectToSocket} from "./controllers/socketManager.js";
import userRoutes from "./routes/users.route.js";
// import dotenv from 'dotenv';
// dotenv.config();


const app = express();
const server = createServer(app);
const io = connectToSocket(server);
app.set("port",(process.env.PORT || 8000));
app.use(cors());
app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({limit: "40kb",extended: true}));
app.use("/api/v1/users",userRoutes);


const start = async ()=>{
    if (!process.env.MONGODB_URI) {
        console.error("MONGODB_URI is not set. Configure it in the Render environment.");
        process.exit(1);
    }
    try {
        const connectionDb = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Connected to MongoDB: ${connectionDb.connection.host}`);
        server.listen(app.get("port"),"0.0.0.0",()=>{
            console.log(`Server is running on port ${app.get("port")}`);
        });
    } catch (err) {
        console.error("MongoDB connection failed:", err.message);
        process.exit(1);
    }
}
 
start();


app.get("/home",(req,res)=>{
    res.send("Welcome to the Home Page after CI/CD");
});

