const test = require('node:test');
const assert = require('node:assert/strict');
const calculateSellerReputation = require('../services/seller-reputation');

const activatedSeller = { sellerActivatedAt: new Date() };

test('seller starts at good and climbs slowly with completed sales', () => {
    assert.deepEqual(calculateSellerReputation(activatedSeller, 0, 0).score, 3);
    assert.equal(calculateSellerReputation(activatedSeller, 10, 0).score, 3.5);
    assert.equal(calculateSellerReputation(activatedSeller, 30, 0).label, 'ممتاز');
});

test('buyer reports lower the score gradually and five reports mark very bad', () => {
    assert.equal(calculateSellerReputation(activatedSeller, 0, 1).score, 2.6);
    assert.equal(calculateSellerReputation(activatedSeller, 0, 3).label, 'سيئ');
    assert.deepEqual(
        (({ score, label }) => ({ score, label }))(calculateSellerReputation(activatedSeller, 30, 5)),
        { score: 1, label: 'سيئ جدًا' }
    );
});

test('temporary trade suspension expires after its timestamp', () => {
    const now = new Date('2026-09-30T12:00:00.000Z');
    assert.equal(calculateSellerReputation({
        ...activatedSeller,
        sellerSuspendedUntil: new Date('2026-10-02T12:00:00.000Z')
    }, 0, 5, now).tradeRestricted, true);
    assert.equal(calculateSellerReputation({
        ...activatedSeller,
        sellerSuspendedUntil: new Date('2026-09-29T12:00:00.000Z')
    }, 0, 5, now).tradeRestricted, false);
});

test('reputation does not start before seller activation', () => {
    assert.deepEqual(calculateSellerReputation({}, 100, 0), {
        score: null,
        label: 'غير مفعّل للبيع',
        tradeRestricted: false
    });
});