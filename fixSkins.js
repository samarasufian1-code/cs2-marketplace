const mongoose = require('mongoose');

console.log('🚀 بدء تشغيل سكريبت التحديث بالإصدار الصافي لـ Mongoose v' + mongoose.version);

// 1. الاتصال المباشر الخالي تماماً من أي خيارات أو معاملات زائدة لضمان التوافق مع إصدارك الحديث
mongoose.connect('mongodb://localhost:20017/cs2_premium_market')
.then(() => {
    console.log('🟢 تم الاتصال بقاعدة البيانات بنجاح وبدون أي مشاكل توافقية!');
    updateAllSkins();
}).catch(err => {
    console.error('🔴 فشل الاتصال بقاعدة البيانات. تأكد أن الـ MongoDB Compass أو الخدمة تعمل على المنفذ 20017:', err);
});

// 2. تعريف السكيمة بشكل مرن ومتوافق
const skinSchema = new mongoose.Schema({
    status: { type: String, default: 'market' }
}, { strict: false });

const Skin = mongoose.model('Skin', skinSchema);

// 3. دالة الحقن الشاملة لتنشيط آلاف الأسلحة في السوق فوراً
async function updateAllSkins() {
    try {
        console.log('⏳ جاري فحص وحقن حقل الحالة (status) لجميع الأسلحة في المخازن...');

        // التحديث الأول: إضافة حقل market لكل سلاح لا يملك حقل حالة أصلاً
        const resultExists = await Skin.updateMany(
            { status: { $exists: false } }, 
            { $set: { status: 'market' } }
        );
        console.log(`📦 الخطوة 1: تم تنشيط وإظهار ${resultExists.modifiedCount} سلاح لم تكن تملك حقل حالة.`);

        // التحديث الثاني: معالجة الأسلحة التي تمتلك حقل حالة فارغ ""
        const resultEmpty = await Skin.updateMany(
            { status: "" }, 
            { $set: { status: 'market' } }
        );
        console.log(`🔄 الخطوة 2: تم تصحيح وتنشيط ${resultEmpty.modifiedCount} سلاح كانت حالتها فارغة.`);

        // التحديث الثالث الاحتياطي: تحويل كل سلاح حالته ليست inventory إلى market لضمان الظهور الشامل
        const resultAll = await Skin.updateMany(
            { status: { $ne: 'inventory' } },
            { $set: { status: 'market' } }
        );
        console.log(`🎯 الخطوة 3 (الضمان الشامل): تم التأكيد على ${resultAll.modifiedCount} سلاح في المتجر.`);

        console.log('✅ تم الانتهاء من تحديث وحقن جميع البيانات بنجاح أسطوري!');

    } catch (error) {
        console.error('❌ حدث خطأ برمجي غير متوقع أثناء حقن البيانات:', error);
    } finally {
        // إغلاق الاتصال بأمان تام
        mongoose.connection.close();
        console.log('🔌 تم قطع الاتصال بأمان. يمكنك الآن عمل Refresh للموقع ورؤية النتيجة!');
        process.exit(0);
    }
}
