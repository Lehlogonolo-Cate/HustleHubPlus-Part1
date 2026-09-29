const mongoose = require('mongoose');

const { BOOKING_STATUS } = require('../constants');

const bookingSchema = new mongoose.Schema(
  {
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    // Title and price are copied at booking time so the record stays accurate
    // even if the freelancer later edits or deletes the gig
    gigTitle: { type: String, required: true },
    price: { type: Number, required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requirements: { type: String, trim: true, maxlength: 1000, default: '' },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.CONFIRMED
    },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    completedAt: { type: Date },
    cancelledAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
