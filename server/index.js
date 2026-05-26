require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

app.set('trust proxy', 1);

app.use(cors({
  origin: [
    'https://aura-engine-zeta.vercel.app',
    'https://aura-engine-git-main-an7708s-projects.vercel.app',
    'https://aura-engine-2sem2zh2d-an7708s-projects.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api', limiter);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected — Aura Engine'))
  .catch((err) => console.error('MongoDB error:', err.message));

app.use('/api/inventory', require('./routes/inventory.routes'));

app.get('/', (req, res) => {
  res.json({ message: 'Aura Engine API is running' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Aura Engine server running on port ${PORT}`));