const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cs2_marketplace';

// دالة الاتصال بقاعدة البيانات المحلية لجهازك
const connectDB = async () => {
    try {
        // سيقوم بإنشاء قاعدة بيانات باسم cs2_marketplace تلقائياً في الخلفية
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB Connected Successfully... ✅');
    } catch (error) {
        console.error('Database Connection Failed! ❌', error.message);
        process.exit(1); // إغلاق التطبيق إذا فشل الاتصال
    }
};

module.exports = { connectDB, MONGODB_URI };
