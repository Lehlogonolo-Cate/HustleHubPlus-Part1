const mongoose = require('mongoose');

// Tokens are stateless, so logging out only deletes the client's copy. Storing the
// token ID here lets the API refuse a stolen copy until it would have expired anyway.
const revokedTokenSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true },
  // MongoDB's TTL monitor deletes the record once the token has expired
  expiresAt: { type: Date, required: true, expires: 0 }
});

module.exports = mongoose.model('RevokedToken', revokedTokenSchema);
