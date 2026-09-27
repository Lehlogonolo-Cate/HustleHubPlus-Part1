const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // select: false means the hash is never returned unless we ask for it on purpose
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['client', 'freelancer', 'admin'], default: 'client' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);