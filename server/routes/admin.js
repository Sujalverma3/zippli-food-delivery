import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import { memoryUsers, authenticateToken } from './auth.js';
import { memoryOrders } from './orders.js';
import { memoryRestaurants } from './restaurants.js';

const router = express.Router();

// GET all registered users (Admin only)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (mongoose.connection.readyState === 1) {
      const users = await User.find().select('-password');
      res.json(users);
    } else {
      const list = memoryUsers.map(({ password, ...rest }) => rest);
      res.json(list);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update user status (Admin toggle suspend/activate)
router.put('/users/:userId/status', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body; // 'active' or 'suspended'

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      user.status = status;
      await user.save();
      
      const userObj = user.toObject();
      delete userObj.password;
      res.json(userObj);
    } else {
      const idx = memoryUsers.findIndex(u => u._id === userId);
      if (idx === -1) return res.status(404).json({ error: 'User not found' });
      memoryUsers[idx].status = status;
      
      const userObj = { ...memoryUsers[idx] };
      delete userObj.password;
      res.json(userObj);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET platform analytics (Admin statistics)
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    let allOrders = [];
    let allUsersCount = 0;

    if (mongoose.connection.readyState === 1) {
      allOrders = await Order.find();
      allUsersCount = await User.countDocuments();
    } else {
      allOrders = memoryOrders;
      allUsersCount = memoryUsers.length;
    }

    let totalSales = 0;
    let completedDeliveriesCount = 0;
    
    allOrders.forEach(o => {
      if (o.status !== 'cancelled') {
        totalSales += o.totalAmount;
      }
      if (o.status === 'delivered') {
        completedDeliveriesCount++;
      }
    });

    const totalCommissions = totalSales * 0.20; // 20% platform commission
    const totalDeliveryFees = completedDeliveriesCount * 40; // ₹40 delivery fee per order

    res.json({
      metrics: {
        totalSales: Math.round(totalSales),
        totalCommissions: Math.round(totalCommissions),
        totalDeliveryFees: Math.round(totalDeliveryFees),
        totalUsers: allUsersCount,
        totalOrders: allOrders.length,
        completedDeliveries: completedDeliveriesCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all pending partner registration requests
router.get('/pending-partners', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (mongoose.connection.readyState === 1) {
      const pendingUsers = await User.find({ status: 'pending' }).select('-password');
      res.json(pendingUsers);
    } else {
      const pendingList = memoryUsers
        .filter(u => u.status === 'pending')
        .map(({ password, ...rest }) => rest);
      res.json(pendingList);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST verify and approve partner registration request
router.post('/verify-partner/:userId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    
    // For restaurant partner verification, details to create restaurant
    const { name, cuisine, address, lat, lng, phone, image } = req.body;

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'Partner request user not found' });

      if (user.role === 'restaurant') {
        if (!name || !cuisine || !address) {
          return res.status(400).json({ error: 'Store details (name, cuisine, address) are required for restaurant approval.' });
        }

        // Generate ID
        const restId = user.restaurantId || 'r_' + Math.floor(100 + Math.random() * 900);
        user.restaurantId = restId;

        // Create Restaurant profile
        const newRestaurant = new Restaurant({
          id: restId,
          name,
          cuisine,
          address,
          phone: phone || user.phone,
          lat: parseFloat(lat) || 28.6304,
          lng: parseFloat(lng) || 77.2177,
          rating: 4.0,
          deliveryTime: '25-35 mins',
          minOrder: 150,
          discount: '10% OFF',
          gradient: 'from-orange-400 to-red-500',
          image: image || '/images/pizza.png',
          tags: ['Newly Added', 'Verified Partner'],
          reviews: [],
          menu: {}
        });

        await newRestaurant.save();
      }

      user.status = 'active';
      await user.save();

      const userObj = user.toObject();
      delete userObj.password;
      res.json({ message: 'Partner approved and activated successfully!', user: userObj });
    } else {
      const idx = memoryUsers.findIndex(u => u._id === userId);
      if (idx === -1) return res.status(404).json({ error: 'Partner request user not found' });

      const user = memoryUsers[idx];

      if (user.role === 'restaurant') {
        if (!name || !cuisine || !address) {
          return res.status(400).json({ error: 'Store details (name, cuisine, address) are required for restaurant approval.' });
        }

        const restId = user.restaurantId || 'r_' + Math.floor(100 + Math.random() * 900);
        user.restaurantId = restId;

        const newRestaurant = {
          id: restId,
          name,
          cuisine,
          address,
          phone: phone || user.phone,
          lat: parseFloat(lat) || 28.6304,
          lng: parseFloat(lng) || 77.2177,
          rating: 4.0,
          deliveryTime: '25-35 mins',
          minOrder: 150,
          discount: '10% OFF',
          gradient: 'from-orange-400 to-red-500',
          image: image || '/images/pizza.png',
          tags: ['Newly Added', 'Verified Partner'],
          reviews: [],
          menu: {},
          createdAt: new Date(),
          updatedAt: new Date()
        };

        memoryRestaurants.push(newRestaurant);
      }

      user.status = 'active';
      const userObj = { ...user };
      delete userObj.password;
      res.json({ message: 'Partner approved and activated successfully!', user: userObj });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
