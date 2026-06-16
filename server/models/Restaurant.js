import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  text: { type: String, default: '' },
  date: { type: String }
});

const restaurantSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  cuisine: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 0
  },
  deliveryTime: {
    type: String,
    default: '30 mins'
  },
  minOrder: {
    type: Number,
    default: 0
  },
  discount: {
    type: String,
    default: ''
  },
  gradient: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  phone: {
    type: String,
    default: ''
  },
  openingHours: {
    type: String,
    default: ''
  },
  tags: [String],
  reviews: [reviewSchema],
  menu: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
export default Restaurant;
