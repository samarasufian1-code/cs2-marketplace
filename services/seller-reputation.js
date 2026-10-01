function calculateSellerReputation(seller, salesCount, reportCount, now = new Date()) {
    if (!seller.sellerActivatedAt) {
        return { score: null, label: 'غير مفعّل للبيع', tradeRestricted: false };
    }

    const score = reportCount >= 5 ? 1 : Math.max(1, Math.min(5,
        3 + Math.floor(salesCount / 10) * 0.5 - reportCount * 0.4
    ));
    const label = score >= 4.5 ? 'ممتاز'
        : score >= 3.5 ? 'جيد جدًا'
            : score >= 2.5 ? 'جيد'
                : score >= 1.5 ? 'سيئ'
                    : 'سيئ جدًا';

    return {
        score: Number(score.toFixed(1)),
        label,
        salesCount,
        reportCount,
        suspensionUntil: seller.sellerSuspendedUntil || null,
        tradeRestricted: Boolean(seller.sellerSuspendedUntil && seller.sellerSuspendedUntil > now)
    };
}

module.exports = calculateSellerReputation;