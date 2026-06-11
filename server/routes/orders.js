import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';

const router = express.Router();

// In-memory fallback database
export const memoryOrders = [];

// Helper to generate a ZPL ID
function generateOrderId() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 8; i++) {
    rand += chars[Math.floor(Math.random() * chars.length)];
  }
  return `ZPL-${rand}`;
}

// POST create order
router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      phone,
      address,
      items,
      restaurant,
      restaurantId,
      paymentMethod,
      totalAmount,
      deliveryLat,
      deliveryLng,
      deliveryInstructions
    } = req.body;
    
    if (!customerName || !phone || !address || !items || !items.length || !restaurant || !paymentMethod || !totalAmount) {
      return res.status(400).json({ error: 'Missing required order details' });
    }

    // Default coordinates near Connaught Place, New Delhi if not provided
    const lat = parseFloat(deliveryLat) || 28.6304;
    const lng = parseFloat(deliveryLng) || 77.2177;

    // Default restaurant coords (e.g. Pizza Palazzo)
    const restId = restaurantId || 'r1';
    let restLat = 28.6298;
    let restLng = 77.2276;

    if (mongoose.connection.readyState === 1) {
      const order = new Order({
        customerName,
        customerPhone: phone,
        customerAddress: address,
        items,
        totalAmount,
        restaurant,
        restaurantId: restId,
        deliveryLat: lat,
        deliveryLng: lng,
        agentLat: restLat,
        agentLng: restLng,
        paymentMethod,
        paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid',
        deliveryInstructions: deliveryInstructions || ''
      });
      await order.save();
      res.status(201).json(order);
    } else {
      const order = {
        orderId: generateOrderId(),
        customerName,
        customerPhone: phone,
        customerAddress: address,
        items,
        totalAmount,
        restaurant,
        restaurantId: restId,
        deliveryLat: lat,
        deliveryLng: lng,
        agentLat: restLat,
        agentLng: restLng,
        paymentMethod,
        status: 'placed',
        paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid',
        estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000),
        deliveryAgent: '',
        deliveryInstructions: deliveryInstructions || '',
        rating: 0,
        feedback: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryOrders.push(order);
      res.status(201).json(order);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all orders with filtering
router.get('/', async (req, res) => {
  try {
    const { status, limit = 100, page = 1, restaurantId, deliveryAgent, customerPhone } = req.query;
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    if (mongoose.connection.readyState === 1) {
      const query = {};
      if (status && status !== 'all') {
        if (status === 'active') {
          query.status = { $in: ['placed', 'confirmed', 'preparing', 'out_for_delivery'] };
        } else {
          query.status = status;
        }
      }
      if (restaurantId) query.restaurantId = restaurantId;
      if (deliveryAgent) query.deliveryAgent = deliveryAgent;
      if (customerPhone) query.customerPhone = customerPhone;

      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
      const total = await Order.countDocuments(query);
      res.json({
        orders,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } else {
      const filtered = memoryOrders.filter(o => {
        if (status && status !== 'all') {
          if (status === 'active') {
            if (!['placed', 'confirmed', 'preparing', 'out_for_delivery'].includes(o.status)) return false;
          } else if (o.status !== status) {
            return false;
          }
        }
        if (restaurantId && o.restaurantId !== restaurantId) return false;
        if (deliveryAgent && o.deliveryAgent !== deliveryAgent) return false;
        if (customerPhone && o.customerPhone !== customerPhone) return false;
        return true;
      });

      const sorted = [...filtered].sort((a, b) => b.createdAt - a.createdAt);
      const paged = sorted.slice(skip, skip + limitNum);

      res.json({
        orders: paged,
        pagination: {
          total: filtered.length,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(filtered.length / limitNum)
        }
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single order
router.get('/:orderId', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const order = await Order.findOne({ orderId: req.params.orderId });
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } else {
      const order = memoryOrders.find(o => o.orderId === req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update status & agent coordinates
router.patch('/:orderId/status', async (req, res) => {
  try {
    const { status, deliveryAgent, agentLat, agentLng, paymentStatus } = req.body;
    
    if (mongoose.connection.readyState === 1) {
      const order = await Order.findOne({ orderId: req.params.orderId });
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      if (status) order.status = status;
      if (deliveryAgent !== undefined) order.deliveryAgent = deliveryAgent;
      if (agentLat !== undefined) order.agentLat = parseFloat(agentLat);
      if (agentLng !== undefined) order.agentLng = parseFloat(agentLng);
      if (paymentStatus) order.paymentStatus = paymentStatus;
      
      await order.save();
      res.json(order);
    } else {
      const idx = memoryOrders.findIndex(o => o.orderId === req.params.orderId);
      if (idx === -1) {
        return res.status(404).json({ error: 'Order not found' });
      }
      const order = memoryOrders[idx];
      if (status) order.status = status;
      if (deliveryAgent !== undefined) order.deliveryAgent = deliveryAgent;
      if (agentLat !== undefined) order.agentLat = parseFloat(agentLat);
      if (agentLng !== undefined) order.agentLng = parseFloat(agentLng);
      if (paymentStatus) order.paymentStatus = paymentStatus;
      order.updatedAt = new Date();
      
      res.json(order);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST submit rating
router.post('/:orderId/rate', async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    if (!rating) return res.status(400).json({ error: 'Rating is required' });

    if (mongoose.connection.readyState === 1) {
      const order = await Order.findOne({ orderId: req.params.orderId });
      if (!order) return res.status(404).json({ error: 'Order not found' });
      order.rating = parseInt(rating);
      order.feedback = feedback || '';
      await order.save();
      res.json(order);
    } else {
      const order = memoryOrders.find(o => o.orderId === req.params.orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      order.rating = parseInt(rating);
      order.feedback = feedback || '';
      order.updatedAt = new Date();
      res.json(order);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE cancel order
router.delete('/:orderId', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const order = await Order.findOne({ orderId: req.params.orderId });
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      if (order.status !== 'placed' && order.status !== 'confirmed') {
        return res.status(400).json({ error: 'Order can only be cancelled if placed or confirmed' });
      }
      order.status = 'cancelled';
      await order.save();
      res.json({ message: 'Order cancelled successfully', order });
    } else {
      const order = memoryOrders.find(o => o.orderId === req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      if (order.status !== 'placed' && order.status !== 'confirmed') {
        return res.status(400).json({ error: 'Order can only be cancelled if placed or confirmed' });
      }
      order.status = 'cancelled';
      order.updatedAt = new Date();
      res.json({ message: 'Order cancelled successfully', order });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
