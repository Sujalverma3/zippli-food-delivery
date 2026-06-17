import express from 'express';
import mongoose from 'mongoose';
import Restaurant from '../models/Restaurant.js';
import { restaurants } from '../data/restaurants.js';

const router = express.Router();

export const memoryRestaurants = [];

async function seedDefaultRestaurants() {
  try {
    // Seed in-memory fallback if empty
    if (memoryRestaurants.length === 0) {
      restaurants.forEach(r => {
        memoryRestaurants.push(JSON.parse(JSON.stringify(r)));
      });
    }

    // Seed MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      const count = await Restaurant.countDocuments();
      if (count === 0) {
        for (const r of restaurants) {
          const newRest = new Restaurant(r);
          await newRest.save();
          console.log(`Seeded default restaurant ${r.name} in MongoDB`);
        }
      }
    }
  } catch (err) {
    console.error('Error seeding default restaurants:', err);
  }
}

// Trigger seeding immediately for in-memory fallback
seedDefaultRestaurants();

// Also listen for MongoDB connection to seed the database
if (mongoose.connection.readyState !== 1) {
  mongoose.connection.once('open', seedDefaultRestaurants);
}

// GET all restaurants (without menu for listing)
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const list = await Restaurant.find({}, { menu: 0, reviews: 0 }).lean();
      res.json(list);
    } else {
      const list = memoryRestaurants.map(({ menu, reviews, ...rest }) => rest);
      res.json(list);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single restaurant
router.get('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const restaurant = await Restaurant.findOne({ id: req.params.id }).lean();
      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }
      res.json(restaurant);
    } else {
      const restaurant = memoryRestaurants.find(r => r.id === req.params.id);
      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }
      res.json(restaurant);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update restaurant coordinates / info (Admin)
router.patch('/:id', async (req, res) => {
  try {
    const allowedFields = [
      'name', 'cuisine', 'address', 'lat', 'lng', 'phone',
      'openingHours', 'minOrder', 'deliveryTime', 'discount', 'tags', 'rating'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (mongoose.connection.readyState === 1) {
      const restaurant = await Restaurant.findOneAndUpdate(
        { id: req.params.id },
        { $set: updates },
        { new: true }
      ).lean();
      
      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }
      res.json(restaurant);
    } else {
      const idx = memoryRestaurants.findIndex(r => r.id === req.params.id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      Object.assign(memoryRestaurants[idx], updates);
      res.json(memoryRestaurants[idx]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add menu item
router.post('/:id/menu', async (req, res) => {
  try {
    const { name, description, price, category, image } = req.body;
    if (!name || !price || !category) return res.status(400).json({ error: 'Missing details' });

    if (mongoose.connection.readyState === 1) {
      const restaurant = await Restaurant.findOne({ id: req.params.id });
      if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

      if (!restaurant.menu) restaurant.menu = {};
      if (!restaurant.menu[category]) {
        restaurant.menu[category] = [];
      }

      const randId = `${restaurant.id}-${category.slice(0, 1)}${Math.floor(Math.random() * 1000)}`;
      const newItem = {
        id: randId,
        name,
        description: description || '',
        price: parseFloat(price),
        image: image || '',
        inStock: true
      };

      // Since menu is Mixed, we push directly and mark modified
      restaurant.menu[category].push(newItem);
      restaurant.markModified('menu');
      await restaurant.save();

      res.status(201).json(newItem);
    } else {
      const restaurant = memoryRestaurants.find(r => r.id === req.params.id);
      if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

      if (!restaurant.menu[category]) {
        restaurant.menu[category] = [];
      }

      const randId = `${restaurant.id}-${category.slice(0, 1)}${Math.floor(Math.random() * 1000)}`;
      const newItem = {
        id: randId,
        name,
        description: description || '',
        price: parseFloat(price),
        image: image || '',
        inStock: true
      };

      restaurant.menu[category].push(newItem);
      res.status(201).json(newItem);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update menu item
router.put('/:id/menu/:itemId', async (req, res) => {
  try {
    const { name, description, price, category, inStock, image } = req.body;

    if (mongoose.connection.readyState === 1) {
      const restaurant = await Restaurant.findOne({ id: req.params.id });
      if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

      let item = null;
      let foundCat = '';

      // Search item in all categories
      for (const [catName, list] of Object.entries(restaurant.menu || {})) {
        const idx = list.findIndex(i => i.id === req.params.itemId);
        if (idx !== -1) {
          item = list[idx];
          foundCat = catName;
          break;
        }
      }

      if (!item) return res.status(404).json({ error: 'Menu item not found' });

      // If category changed, move item
      if (category && category !== foundCat) {
        // remove from old
        restaurant.menu[foundCat] = restaurant.menu[foundCat].filter(i => i.id !== item.id);
        
        // update item
        if (name !== undefined) item.name = name;
        if (description !== undefined) item.description = description;
        if (price !== undefined) item.price = parseFloat(price);
        if (inStock !== undefined) item.inStock = inStock;
        if (image !== undefined) item.image = image;

        // add to new
        if (!restaurant.menu[category]) restaurant.menu[category] = [];
        restaurant.menu[category].push(item);
      } else {
        // update in place
        if (name !== undefined) item.name = name;
        if (description !== undefined) item.description = description;
        if (price !== undefined) item.price = parseFloat(price);
        if (inStock !== undefined) item.inStock = inStock;
        if (image !== undefined) item.image = image;
      }

      restaurant.markModified('menu');
      await restaurant.save();
      res.json(item);
    } else {
      const restaurant = memoryRestaurants.find(r => r.id === req.params.id);
      if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

      let item = null;
      let foundCat = '';

      for (const [catName, list] of Object.entries(restaurant.menu || {})) {
        const idx = list.findIndex(i => i.id === req.params.itemId);
        if (idx !== -1) {
          item = list[idx];
          foundCat = catName;
          break;
        }
      }

      if (!item) return res.status(404).json({ error: 'Menu item not found' });

      // If category changed, move item
      if (category && category !== foundCat) {
        restaurant.menu[foundCat] = restaurant.menu[foundCat].filter(i => i.id !== item.id);
        
        if (name !== undefined) item.name = name;
        if (description !== undefined) item.description = description;
        if (price !== undefined) item.price = parseFloat(price);
        if (inStock !== undefined) item.inStock = inStock;
        if (image !== undefined) item.image = image;

        if (!restaurant.menu[category]) restaurant.menu[category] = [];
        restaurant.menu[category].push(item);
      } else {
        if (name !== undefined) item.name = name;
        if (description !== undefined) item.description = description;
        if (price !== undefined) item.price = parseFloat(price);
        if (inStock !== undefined) item.inStock = inStock;
        if (image !== undefined) item.image = image;
      }

      res.json(item);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE menu item
router.delete('/:id/menu/:itemId', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const restaurant = await Restaurant.findOne({ id: req.params.id });
      if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

      let deleted = false;
      for (const [catName, list] of Object.entries(restaurant.menu || {})) {
        const filtered = list.filter(i => i.id !== req.params.itemId);
        if (filtered.length !== list.length) {
          restaurant.menu[catName] = filtered;
          deleted = true;
          break;
        }
      }

      if (!deleted) return res.status(404).json({ error: 'Menu item not found' });

      restaurant.markModified('menu');
      await restaurant.save();
      res.json({ message: 'Menu item deleted successfully' });
    } else {
      const restaurant = memoryRestaurants.find(r => r.id === req.params.id);
      if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

      let deleted = false;
      for (const [catName, list] of Object.entries(restaurant.menu || {})) {
        const filtered = list.filter(i => i.id !== req.params.itemId);
        if (filtered.length !== list.length) {
          restaurant.menu[catName] = filtered;
          deleted = true;
          break;
        }
      }

      if (!deleted) return res.status(404).json({ error: 'Menu item not found' });
      res.json({ message: 'Menu item deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST submit review
router.post('/:id/reviews', async (req, res) => {
  try {
    const { name, rating, text } = req.body;
    if (!name || !rating) return res.status(400).json({ error: 'Name and rating are required' });

    const newReview = {
      name,
      rating: parseInt(rating),
      text: text || '',
      date: new Date().toISOString().split('T')[0]
    };

    if (mongoose.connection.readyState === 1) {
      const restaurant = await Restaurant.findOne({ id: req.params.id });
      if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

      if (!restaurant.reviews) restaurant.reviews = [];
      restaurant.reviews.push(newReview);

      // Recalculate average rating
      const total = restaurant.reviews.reduce((sum, r) => sum + r.rating, 0);
      restaurant.rating = parseFloat((total / restaurant.reviews.length).toFixed(1));

      await restaurant.save();
      res.status(201).json(newReview);
    } else {
      const restaurant = memoryRestaurants.find(r => r.id === req.params.id);
      if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

      if (!restaurant.reviews) restaurant.reviews = [];
      restaurant.reviews.push(newReview);

      const total = restaurant.reviews.reduce((sum, r) => sum + r.rating, 0);
      restaurant.rating = parseFloat((total / restaurant.reviews.length).toFixed(1));

      res.status(201).json(newReview);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
