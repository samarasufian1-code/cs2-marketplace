const mongoose = require('mongoose');

const InventoryItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    float: { type: Number, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    img: { type: String, default: '' },
    color: { type: String, default: '#4b69ff' },
    imageUrl: { type: String, default: '' },
    marketHashName: { type: String, default: '' },
    marketPrice: { type: Number, min: 0 },
    marketPriceUpdatedAt: { type: Date },
    marketPriceSource: { type: String, default: '' }
});

const SteamTestListingSchema = new mongoose.Schema({
    assetId: { type: String, required: true },
    name: { type: String, required: true },
    marketHashName: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    type: { type: String, default: '' },
    price: { type: Number, required: true, min: 0.01, max: 10000000 },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const UserSchema = new mongoose.Schema({
    steamid: { type: String, required: true, unique: true }, 
    username: { type: String, required: true },
    walletBalance: { type: Number, default: 0 }, // محفظة مالية تبدأ بـ 0 دولار
    steamInventoryPrivate: { type: Boolean, default: false },
    blockedSteamIds: { type: [String], default: [] },
    sellerActivatedAt: { type: Date },
    sellerSuspendedUntil: { type: Date },
    inventory: { type: [InventoryItemSchema], default: [] },
    steamTestListings: { type: [SteamTestListingSchema], default: [] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
