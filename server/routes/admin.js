import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { memoryUsers, authenticateToken } from './auth.js';
import { memoryOrders } from './orders.js';

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

export default router;
