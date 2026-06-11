import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Route imports
import orderRoutes from './routes/orders.js';
import restaurantRoutes from './routes/restaurants.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import couponRoutes from './routes/coupons.js';
import supportRoutes from './routes/support.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes mount
app.use('/api/orders', orderRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/support', supportRoutes);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/zippli';

// Add connection error listener to prevent uncaught exception crashes
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error event:', err);
});

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 3000 // timeout after 3 seconds instead of hanging
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB initial connection error:', err.message);
    console.log('Using in-memory fallback database. Ensure MongoDB is running locally at mongodb://localhost:27017/zippli to persist data.');
  });

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Zippli API is running...');
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
