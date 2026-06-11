import express from 'express';
import { restaurants } from '../data/restaurants.js';

const router = express.Router();

// GET all restaurants (without menu for listing)
router.get('/', (req, res) => {
  try {
    const list = restaurants.map(({ menu, reviews, ...rest }) => rest);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single restaurant
router.get('/:id', (req, res) => {
  try {
    const restaurant = restaurants.find(r => r.id === req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update restaurant coordinates / info (Admin)
router.patch('/:id', (req, res) => {
  try {
    const idx = restaurants.findIndex(r => r.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

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

    Object.assign(restaurants[idx], updates);
    res.json(restaurants[idx]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add menu item
router.post('/:id/menu', (req, res) => {
  try {
    const { name, description, price, category, image } = req.body;
    const restaurant = restaurants.find(r => r.id === req.params.id);
    
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    if (!name || !price || !category) return res.status(400).json({ error: 'Missing details' });

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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update menu item
router.put('/:id/menu/:itemId', (req, res) => {
  try {
    const { name, description, price, category, inStock, image } = req.body;
    const restaurant = restaurants.find(r => r.id === req.params.id);
    
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    let item = null;
    let foundCat = '';

    // Search item in all categories
    for (const [catName, list] of Object.entries(restaurant.menu)) {
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

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE menu item
router.delete('/:id/menu/:itemId', (req, res) => {
  try {
    const restaurant = restaurants.find(r => r.id === req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    let deleted = false;
    for (const [catName, list] of Object.entries(restaurant.menu)) {
      const filtered = list.filter(i => i.id !== req.params.itemId);
      if (filtered.length !== list.length) {
        restaurant.menu[catName] = filtered;
        deleted = true;
        break;
      }
    }

    if (!deleted) return res.status(404).json({ error: 'Menu item not found' });
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST submit review
router.post('/:id/reviews', (req, res) => {
  try {
    const { name, rating, text } = req.body;
    const restaurant = restaurants.find(r => r.id === req.params.id);
    
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    if (!name || !rating) return res.status(400).json({ error: 'Name and rating are required' });

    const newReview = {
      name,
      rating: parseInt(rating),
      text: text || '',
      date: new Date().toISOString().split('T')[0]
    };

    if (!restaurant.reviews) restaurant.reviews = [];
    restaurant.reviews.push(newReview);

    // Recalculate average rating
    const total = restaurant.reviews.reduce((sum, r) => sum + r.rating, 0);
    restaurant.rating = parseFloat((total / restaurant.reviews.length).toFixed(1));

    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
