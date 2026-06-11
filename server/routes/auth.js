import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'zippli_super_secret_session_key';

// In-memory users database fallback
export const memoryUsers = [];

// Seed default users in-memory and database
const defaultUsers = [
  {
    name: 'Sujal Customer',
    email: 'customer@zippli.com',
    phone: '+91 99999 88888',
    password: 'password123', // will be hashed
    role: 'customer',
    addresses: [
      { tag: 'Home', street: '12, Connaught Place', details: 'Block B, Near Metro Station', lat: 28.6304, lng: 77.2177 },
      { tag: 'Work', street: 'Cyber City, Phase 3', details: 'Building 10, 5th Floor', lat: 28.4950, lng: 77.0890 }
    ],
    status: 'active'
  },
  {
    name: 'Pizza Palazzo Owner',
    email: 'vendor@zippli.com',
    phone: '+91 98765 43210',
    password: 'password123',
    role: 'restaurant',
    restaurantId: 'r1',
    status: 'active'
  },
  {
    name: 'Raj Delivery Partner',
    email: 'delivery@zippli.com',
    phone: '+91 97777 66666',
    password: 'password123',
    role: 'delivery',
    status: 'active'
  },
  {
    name: 'Zippli Admin',
    email: 'admin@zippli.com',
    phone: '+91 95555 44444',
    password: 'password123',
    role: 'admin',
    status: 'active'
  }
];

// Helper to seed database users
async function seedDefaultUsers() {
  try {
    const salt = await bcrypt.genSalt(10);
    
    // Seed in-memory
    for (const du of defaultUsers) {
      const hashedPassword = await bcrypt.hash(du.password, salt);
      memoryUsers.push({
        _id: new mongoose.Types.ObjectId().toString(),
        ...du,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Seed MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      for (const du of defaultUsers) {
        const exists = await User.findOne({ email: du.email });
        if (!exists) {
          const newUser = new User(du);
          await newUser.save();
          console.log(`Seeded default user ${du.email} in MongoDB`);
        }
      }
    }
  } catch (err) {
    console.error('Error seeding default users:', err);
  }
}

// Run seeding
seedDefaultUsers();

// Middleware to verify JWT token
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Register Route
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, restaurantId } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const lowerEmail = email.toLowerCase();

    // Check if user exists
    if (mongoose.connection.readyState === 1) {
      const exists = await User.findOne({ email: lowerEmail });
      if (exists) return res.status(400).json({ error: 'Email already registered' });

      const user = new User({
        name,
        email: lowerEmail,
        phone,
        password,
        role: role || 'customer',
        restaurantId: role === 'restaurant' ? restaurantId : '',
        status: 'active'
      });

      await user.save();
      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      
      const userObj = user.toObject();
      delete userObj.password;
      return res.status(201).json({ token, user: userObj });
    } else {
      const exists = memoryUsers.find(u => u.email === lowerEmail);
      if (exists) return res.status(400).json({ error: 'Email already registered' });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const id = new mongoose.Types.ObjectId().toString();
      const user = {
        _id: id,
        name,
        email: lowerEmail,
        phone,
        password: hashedPassword,
        role: role || 'customer',
        restaurantId: role === 'restaurant' ? restaurantId : '',
        addresses: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      memoryUsers.push(user);
      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      
      const userObj = { ...user };
      delete userObj.password;
      return res.status(201).json({ token, user: userObj });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const lowerEmail = email.toLowerCase();

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: lowerEmail });
      if (!user) return res.status(400).json({ error: 'Invalid email or password' });

      if (user.status === 'suspended') {
        return res.status(403).json({ error: 'Your account has been suspended' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      const userObj = user.toObject();
      delete userObj.password;
      return res.json({ token, user: userObj });
    } else {
      const user = memoryUsers.find(u => u.email === lowerEmail);
      if (!user) return res.status(400).json({ error: 'Invalid email or password' });

      if (user.status === 'suspended') {
        return res.status(403).json({ error: 'Your account has been suspended' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      const userObj = { ...user };
      delete userObj.password;
      return res.json({ token, user: userObj });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Me Route
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json(user);
    } else {
      const user = memoryUsers.find(u => u._id === req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const userObj = { ...user };
      delete userObj.password;
      return res.json(userObj);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Address Route
router.put('/addresses', authenticateToken, async (req, res) => {
  try {
    const { tag, street, details, lat, lng } = req.body;
    if (!street || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Street address, latitude, and longitude are required' });
    }

    const newAddress = {
      tag: tag || 'Home',
      street,
      details: details || '',
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    };

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      user.addresses.push(newAddress);
      await user.save();
      
      const userObj = user.toObject();
      delete userObj.password;
      return res.json(userObj);
    } else {
      const userIdx = memoryUsers.findIndex(u => u._id === req.user.id);
      if (userIdx === -1) return res.status(404).json({ error: 'User not found' });

      const id = new mongoose.Types.ObjectId().toString();
      const addressItem = { _id: id, ...newAddress };
      
      memoryUsers[userIdx].addresses.push(addressItem);
      
      const userObj = { ...memoryUsers[userIdx] };
      delete userObj.password;
      return res.json(userObj);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Address Route
router.delete('/addresses/:addressId', authenticateToken, async (req, res) => {
  try {
    const { addressId } = req.params;

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
      await user.save();
      
      const userObj = user.toObject();
      delete userObj.password;
      return res.json(userObj);
    } else {
      const userIdx = memoryUsers.findIndex(u => u._id === req.user.id);
      if (userIdx === -1) return res.status(404).json({ error: 'User not found' });

      memoryUsers[userIdx].addresses = memoryUsers[userIdx].addresses.filter(addr => addr._id !== addressId);
      
      const userObj = { ...memoryUsers[userIdx] };
      delete userObj.password;
      return res.json(userObj);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
