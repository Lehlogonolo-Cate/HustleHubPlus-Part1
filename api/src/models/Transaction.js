const mongoose = require('mongoose');

const { TRANSACTION_STATUS } = require('../constants');

const transactionSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    gigTitle: { type: String, required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, required: true, min: 0 },
    freelancerEarnings: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'ZAR' },
    // No real gateway is used; every payment is a simulated confirmation
    paymentMethod: { type: String, default: 'simulated' },
    status: {
      type: String,
      enum: Object.values(TRANSACTION_STATUS),
      default: TRANSACTION_STATUS.PAID
    },
    paidAt: { type: Date, default: Date.now },
    refundedAt: { type: Date }
  },
  { timestamps: true }
);

transactionSchema.index({ freelancer: 1, status: 1, paidAt: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
