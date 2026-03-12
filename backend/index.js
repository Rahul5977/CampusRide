import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import groupRoutes from "./routes/group.routes";

const app = express();
dotenv.config();

app.use(cors());
app.use(express.json());

mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
        console.log("Connected to MongoDB");
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
app.use('/api/groups', groupRoutes);