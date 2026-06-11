import express from 'express';
import mongoose from 'mongoose';
import SupportTicket from '../models/SupportTicket.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

export const memoryTickets = [];

// Seed default tickets
const defaultTickets = [
  {
    userId: 'mock_cust_id',
    userName: 'Sujal Customer',
    subject: 'Order #ZPL-ABC12345 delayed delivery',
    message: 'My food was supposed to arrive 20 minutes ago but the rider is still stuck at the restaurant. Please help!',
    status: 'open',
    replies: [
      { sender: 'Admin', message: 'Hi Sujal, we apologize for the delay. The restaurant is preparing a fresh batch. We have prioritized your rider.' }
    ]
  }
];

defaultTickets.forEach(dt => {
  memoryTickets.push({
    _id: new mongoose.Types.ObjectId().toString(),
    ...dt,
    createdAt: new Date(),
    updatedAt: new Date()
  });
});

// GET user support tickets (or all if admin)
router.get('/tickets', authenticateToken, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      let tickets;
      if (req.user.role === 'admin') {
        tickets = await SupportTicket.find().sort({ createdAt: -1 });
      } else {
        tickets = await SupportTicket.find({ userId: req.user.id }).sort({ createdAt: -1 });
      }
      res.json(tickets);
    } else {
      let list;
      if (req.user.role === 'admin') {
        list = [...memoryTickets].sort((a, b) => b.createdAt - a.createdAt);
      } else {
        list = memoryTickets.filter(t => t.userId === req.user.id || t.userId === 'mock_cust_id');
      }
      res.json(list);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST open support ticket
router.post('/tickets', authenticateToken, async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    if (mongoose.connection.readyState === 1) {
      const ticket = new SupportTicket({
        userId: req.user.id,
        userName: req.user.email.split('@')[0], // username fallback
        subject,
        message,
        replies: []
      });
      await ticket.save();
      res.status(201).json(ticket);
    } else {
      const id = new mongoose.Types.ObjectId().toString();
      const ticket = {
        _id: id,
        userId: req.user.id,
        userName: req.user.email.split('@')[0],
        subject,
        message,
        status: 'open',
        replies: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryTickets.push(ticket);
      res.status(201).json(ticket);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST reply to support ticket
router.post('/tickets/:ticketId/reply', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const { ticketId } = req.params;
    
    if (!message) return res.status(400).json({ error: 'Reply message is required' });

    const sender = req.user.role === 'admin' ? 'Admin' : 'Customer';

    if (mongoose.connection.readyState === 1) {
      const ticket = await SupportTicket.findById(ticketId);
      if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
      
      ticket.replies.push({ sender, message });
      if (req.user.role === 'admin') {
        ticket.status = 'resolved'; // Mark resolved if admin replies
      } else {
        ticket.status = 'open'; // Reopen if customer replies
      }
      
      await ticket.save();
      res.json(ticket);
    } else {
      const ticket = memoryTickets.find(t => t._id === ticketId);
      if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

      ticket.replies.push({ sender, message, createdAt: new Date() });
      if (req.user.role === 'admin') {
        ticket.status = 'resolved';
      } else {
        ticket.status = 'open';
      }
      ticket.updatedAt = new Date();
      res.json(ticket);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
