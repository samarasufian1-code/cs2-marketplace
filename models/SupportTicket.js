const mongoose = require('mongoose');

const SupportMessageSchema = new mongoose.Schema({
    authorSteamId: { type: String, required: true },
    body: { type: String, required: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now }
}, { _id: true });

const SupportTicketSchema = new mongoose.Schema({
    ownerSteamId: { type: String, required: true, index: true },
    subject: { type: String, required: true, maxlength: 120 },
    category: { type: String, enum: ['technical', 'payment', 'trade', 'report', 'other'], default: 'other' },
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
    messages: { type: [SupportMessageSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

SupportTicketSchema.index({ ownerSteamId: 1, updatedAt: -1 });

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);
