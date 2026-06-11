import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  sender: {
    type: String, // 'Customer' or 'Admin'
    required: true
  },
  message: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const supportTicketSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'resolved'],
    default: 'open'
  },
  replies: [replySchema]
}, {
  timestamps: true
});

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
export default SupportTicket;
