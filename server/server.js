import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import voiceRoutes from './routes/voice.js';
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/voice', voiceRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'classMentor AI API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
