const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    userSteamId: { type: String, required: true, index: true },
    provider: { type: String, enum: ['paypal'], required: true },
    providerOrderId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 0.01, max: 1000000 },
    currency: { type: String, enum: ['USD'], default: 'USD' },
    status: { type: String, enum: ['created', 'completed', 'failed'], default: 'created', index: true },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
});

PaymentSchema.index({ userSteamId: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);
