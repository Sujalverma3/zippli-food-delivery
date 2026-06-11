import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  customerAddress: {
    type: String,
    required: true
  },
  restaurantId: {
    type: String,
    default: 'r1'
  },
  deliveryLat: {
    type: Number,
    default: 28.6304
  },
  deliveryLng: {
    type: Number,
    default: 77.2177
  },
  agentLat: {
    type: Number,
    default: 28.6298
  },
  agentLng: {
    type: Number,
    default: 77.2276
  },
  items: [{
    id: String,
    name: String,
    quantity: Number,
    price: Number,
    image: String
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'placed'
  },
  restaurant: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  estimatedDelivery: {
    type: Date,
    default: () => new Date(Date.now() + 45 * 60 * 1000)
  },
  deliveryAgent: {
    type: String,
    default: ''
  },
  deliveryInstructions: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    default: 0
  },
  feedback: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

orderSchema.pre('validate', function(next) {
  if (!this.orderId) {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let rand = '';
    for (let i = 0; i < 8; i++) {
      rand += chars[Math.floor(Math.random() * chars.length)];
    }
    this.orderId = `ZPL-${rand}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
