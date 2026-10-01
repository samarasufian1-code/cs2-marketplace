const mongoose = require('mongoose');
const Skin = require('./models/Skin'); // تأكد أن هذا هو مسار الموديل عندك

const CS2_API_URL = 'https://cs2.game'; 

const excludedSkins = [
    "M9 Bayonet | Fade",
    "AK-47 | Case Hardened",
    "Sport Gloves | Amphibious",
    "AWP | Asiimov"
];

async function importAllCS2Skins() {
    try {
        console.log("⏳ جاري الاتصال بقاعدة البيانات MongoDB...");
        
        // تم تعديل سطر الاتصال هنا ليتوافق مع أحدث إصدار Mongoose ⚡
        await mongoose.connect('mongodb://localhost:27017/cs2-marketplace');
        console.log("✅ تم الاتصال بـ MongoDB بنجاح.");

        console.log("🌐 جاري سحب جميع السكنات والأسلحة من الـ API العالمي لـ CS2...");
        const response = await fetch(CS2_API_URL);
        if (!response.ok) throw new Error("فشل الاتصال بالـ API الخارجي.");
        
        const allSkinsData = await response.json();
        console.log(`📦 تم جلب ${allSkinsData.length} سكن من اللعبة. جاري تصفيتها وحقنها...`);

        let skinsToInsert = [];

        allSkinsData.forEach(item => {
            if (excludedSkins.includes(item.name)) return;

            let category = 'rifles'; 
            let lowercaseName = item.name.toLowerCase();

            if (lowercaseName.includes('knife') || lowercaseName.includes('bayonet') || lowercaseName.includes('karambit') || lowercaseName.includes('dagger')) {
                category = 'knives';
            } else if (lowercaseName.includes('gloves') || lowercaseName.includes('wraps')) {
                category = 'gloves';
            }

            let color = '#4b69ff'; 
            if (item.price > 500) {
                color = '#eb4b4b'; 
            } else if (item.price > 150) {
                color = '#d32ce6'; 
            } else if (item.price > 50) {
                color = '#8847ff'; 
            }

            skinsToInsert.push({
                name: item.name,
                float: item.float || parseFloat((Math.random() * 0.3).toFixed(4)), 
                price: item.price || Math.floor(Math.random() * 450) + 10, 
                category: category,
                img: item.image || "🔫", 
                color: color
            });
        });

        if (skinsToInsert.length > 0) {
            console.log(`⏳ جاري حقن ${skinsToInsert.length} سكن جديد داخل الـ MongoDB Compass...`);
            await Skin.insertMany(skinsToInsert, { ordered: false });
            console.log("🚀 تم ملء الداتابيز بجميع أسلحة CS2 الحقيقية حياً وبنجاح ساحق! 🔥🎉");
        } else {
            console.log("ℹ️ لم يتم العثور على سكنات جديدة لإضافتها.");
        }

    } catch (error) {
        console.error("❌ حدث خطأ أثناء عملية جلب الأسلحة الكلية:", error.message);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 تم إغلاق الاتصال بأمان. يمكنك تشغيل السيرفر الآن.");
    }
}

importAllCS2Skins();
