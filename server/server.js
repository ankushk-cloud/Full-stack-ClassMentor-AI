import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'classMentor AI API is running' })
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})