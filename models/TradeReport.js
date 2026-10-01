const mongoose = require('mongoose');

const TradeReportSchema = new mongoose.Schema({
    sellerSteamId: { type: String, required: true },
    buyerSteamId: { type: String, required: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketTransaction', required: true },
    reason: {
        type: String,
        enum: ['item_mismatch', 'listing_misleading', 'suspected_fraud', 'conduct'],
        required: true
    }
}, { timestamps: true });

TradeReportSchema.index({ sellerSteamId: 1, buyerSteamId: 1 }, { unique: true });

module.exports = mongoose.model('TradeReport', TradeReportSchema);