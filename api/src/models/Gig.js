const mongoose = require('mongoose');

const { GIG_CATEGORIES } = require('../constants');

const gigSchema = new mongoose.Schema(
  {
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 100 },
    description: { type: String, required: true, trim: true, minlength: 20, maxlength: 2000 },
    category: { type: String, required: true, enum: GIG_CATEGORIES },
    // Price in ZAR, validated to at most two decimal places
    price: { type: Number, required: true, min: 50, max: 1000000 },
    deliveryDays: { type: Number, required: true, min: 1, max: 90 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

gigSchema.index({ isActive: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model('Gig', gigSchema);
