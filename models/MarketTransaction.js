const mongoose = require('mongoose');

const MarketTransactionSchema = new mongoose.Schema({
    listingId: { type: mongoose.Schema.Types.ObjectId, required: true },
    buyerSteamId: { type: String, required: true },
    sellerSteamId: { type: String, required: true },
    itemName: { type: String, required: true },
    price: { type: Number, required: true, min: 0.01 }
}, { timestamps: true });

MarketTransactionSchema.index({ buyerSteamId: 1, sellerSteamId: 1, createdAt: -1 });

module.exports = mongoose.model('MarketTransaction', MarketTransactionSchema);