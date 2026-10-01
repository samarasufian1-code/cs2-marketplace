const mongoose = require('mongoose');

// تصميم شكل البيانات اللي رح يحفظها جدول السكنات
const SkinSchema = new mongoose.Schema({
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
    marketPriceSource: { type: String, default: '' },
    isUserListing: { type: Boolean, default: false },
    sellerSteamId: { type: String, default: '' },
    sellerCost: { type: Number, min: 0 },
    createdAt: { type: Date, default: Date.now } // تاريخ العرض التلقائي
});

module.exports = mongoose.model('Skin', SkinSchema);
