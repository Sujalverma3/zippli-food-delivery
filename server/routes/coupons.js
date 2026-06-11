import express from 'express';
import mongoose from 'mongoose';
import Coupon from '../models/Coupon.js';

const router = express.Router();

export const memoryCoupons = [];

const defaultCoupons = [
  { code: 'ZIPPLI50', discountPercent: 50, maxDiscount: 100, minOrderValue: 150, active: true },
  { code: 'WELCOME20', discountPercent: 20, maxDiscount: 80, minOrderValue: 100, active: true },
  { code: 'SUPER75', discountPercent: 30, maxDiscount: 150, minOrderValue: 250, active: true }
];

async function seedDefaultCoupons() {
  try {
    // In memory
    defaultCoupons.forEach(dc => {
      memoryCoupons.push({
        _id: new mongoose.Types.ObjectId().toString(),
        ...dc,
        expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    // DB if connected
    if (mongoose.connection.readyState === 1) {
      for (const dc of defaultCoupons) {
        const exists = await Coupon.findOne({ code: dc.code });
        if (!exists) {
          const coupon = new Coupon(dc);
          await coupon.save();
          console.log(`Seeded coupon ${dc.code} in MongoDB`);
        }
      }
    }
  } catch (err) {
    console.error('Error seeding default coupons:', err);
  }
}

seedDefaultCoupons();

// GET all coupons
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const list = await Coupon.find({ active: true });
      res.json(list);
    } else {
      const list = memoryCoupons.filter(c => c.active);
      res.json(list);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create coupon (Admin)
router.post('/', async (req, res) => {
  try {
    const { code, discountPercent, maxDiscount, minOrderValue } = req.body;
    if (!code || !discountPercent || maxDiscount === undefined) {
      return res.status(400).json({ error: 'Missing required coupon details' });
    }

    const payload = {
      code: code.toUpperCase(),
      discountPercent: parseInt(discountPercent),
      maxDiscount: parseFloat(maxDiscount),
      minOrderValue: parseFloat(minOrderValue || 0),
      active: true,
      expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    if (mongoose.connection.readyState === 1) {
      const exists = await Coupon.findOne({ code: payload.code });
      if (exists) return res.status(400).json({ error: 'Coupon code already exists' });
      const coupon = new Coupon(payload);
      await coupon.save();
      res.status(201).json(coupon);
    } else {
      const exists = memoryCoupons.find(c => c.code === payload.code);
      if (exists) return res.status(400).json({ error: 'Coupon code already exists' });
      
      const item = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryCoupons.push(item);
      res.status(201).json(item);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST validate code
router.post('/validate', async (req, res) => {
  try {
    const { code, cartAmount } = req.body;
    if (!code || cartAmount === undefined) {
      return res.status(400).json({ error: 'Missing code or cartAmount' });
    }

    const targetCode = code.toUpperCase();
    let coupon = null;

    if (mongoose.connection.readyState === 1) {
      coupon = await Coupon.findOne({ code: targetCode, active: true });
    } else {
      coupon = memoryCoupons.find(c => c.code === targetCode && c.active);
    }

    if (!coupon) {
      return res.status(404).json({ error: 'Invalid or inactive coupon code' });
    }

    if (cartAmount < coupon.minOrderValue) {
      return res.status(400).json({
        error: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon.`
      });
    }

    // Calculate discount
    const rawDiscount = (cartAmount * coupon.discountPercent) / 100;
    const discount = Math.min(rawDiscount, coupon.maxDiscount);

    res.json({
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      discount: Math.round(discount),
      message: `Coupon applied! You saved ₹${Math.round(discount)}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
