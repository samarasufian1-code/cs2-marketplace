const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const MongoStore = require('connect-mongo'); 
const paypal = require('@paypal/checkout-server-sdk');
const { XMLParser } = require('fast-xml-parser');
const { connectDB, MONGODB_URI } = require('./db');
const Skin = require('./models/Skin');
const User = require('./models/User');
const Payment = require('./models/Payment');
const TradeReport = require('./models/TradeReport');
const MarketTransaction = require('./models/MarketTransaction');
const SupportTicket = require('./models/SupportTicket');
const tradeGateway = require('./services/trade-gateway');
const calculateSellerReputation = require('./services/seller-reputation');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const MARKET_CURRENCY = 'USD';
const SESSION_SECRET = process.env.SESSION_SECRET || 'local-development-session-secret-at-least-32-chars';
let sessionStore;

// --- نظام حماية لمنع خطأ MongoStore نهائياً ---
try {
    if (MongoStore && typeof MongoStore.create === 'function') {
        sessionStore = MongoStore.create({ mongoUrl: MONGODB_URI, collectionName: 'sessions' });
        console.log('✅ Sessions stored in MongoDB (Modern)');
    } else if (MongoStore && typeof MongoStore === 'function') {
        sessionStore = new MongoStore({ mongoUrl: MONGODB_URI, collectionName: 'sessions' });
        console.log('✅ Sessions stored in MongoDB (Legacy)');
    } else {
        throw new Error('MongoStore format not recognized');
    }
} catch (e) {
    console.warn('⚠️ MongoStore failed, falling back to MemoryStore. Sessions will reset on server restart.');
    sessionStore = new session.MemoryStore();
}
async function syncSkinCatalog() {
    try {
        for (const [name, details] of Object.entries(SKIN_CATALOG)) {
            // تحديث أي سكن في القاعدة يطابق الاسم الموجود في الكتالوج
            await Skin.updateMany(
                { name: name }, 
                { $set: { imageUrl: details.imageUrl, marketHashName: details.marketHashName } }
            );
        }
        console.log('✅ تم تحديث جميع روابط الصور في قاعدة البيانات بنجاح.');
    } catch (err) {
        console.error('❌ خطأ في تحديث الروابط:', err.message);
    }
}

const SKIN_CATALOG = {
    'M9 Bayonet | Fade': {
        marketHashName: '★ M9 Bayonet | Fade (Factory New)',
        imageUrl: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Wts2sab1iLvWHMWaR_uh3tORWQyC0nQlp4znQytr6cnjFbg8oC8BzRrQK50S-lNDgP-_r5wWP3t5CyX37jCIb7DErvbiJu9Hv_g'
    },
    'AK-47 | Case Hardened': {
        marketHashName: 'AK-47 | Case Hardened (Minimal Wear)',
        imageUrl: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6V-Kf2cGFidxOp_pewnF3nhxEt0sGnSzN76dH3GOg9xC8FyEORftRe-x9PuYurq71bW3dUnjK-0H0YSTpMGQ'
    },
    'Sport Gloves | Amphibious': {
        marketHashName: '★ Sport Gloves | Amphibious (Field-Tested)',
        imageUrl: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk5UvzWCL2kpn2-DFk_OKherB0H-CcB3Sfz9Fwou5ucCu_gBgYpDWMjorGLSLANkI-W5R4E7JZtxbskNWxZeLi4QPejdgTmSn62iwbvyw957kDAqog_fXWjBaBb-Pahe96zA'
    },
    'AWP | Asiimov': {
        marketHashName: 'AWP | Asiimov (Field-Tested)',
        imageUrl: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6V-Kf2cGFidxOp_pewnF3nhxEt0sGnSzN76dH3GOg9xC8FyEORftRe-x9PuYurq71bW3dUnjK-0H0YSTpMGQ'
    },
    'Desert Eagle | Printstream': {
        marketHashName: 'Desert Eagle | Printstream (Factory New)',
        imageUrl: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7OeRbKFsJ8-DHG6e1f1iouRoQha_nBovp3OGmdeqInyVP1V0XsYlRbEI50a5wNyzZr605AyI3t5MmCSohylAuC89_a9cBoMY9UkV'
    }
};
const PRICE_FEED_URL = 'https://prices.csgotrader.app/latest/buff163.json';
const PRICE_SOURCE = 'BUFF163';
const PRICE_REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const PRICE_FETCH_TIMEOUT_MS = 20 * 1000;
const STEAM_MARKET_PRICE_CACHE_MS = 15 * 60 * 1000;
const STEAM_MARKET_PRICE_TIMEOUT_MS = 5000;
const STEAM_INVENTORY_CACHE_MS = 60 * 1000;
const STEAM_PROFILE_CACHE_MS = 60 * 60 * 1000;
const STEAM_PROFILE_RETRY_MS = 60 * 1000;
const ONLINE_VISITOR_WINDOW_MS = 5 * 60 * 1000;

const steamInventoryCache = new Map();
const steamProfileCache = new Map();
const steamMarketPriceCache = new Map();
const onlineVisitors = new Map();
const steamXmlParser = new XMLParser({ ignoreAttributes: true, trimValues: true });

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'AWMGHFDakGXhl2SlrGK-Qbisp6Z1kUqFhWQsMgZpSaZftNB8-4o5AYC6VuLtcP-cTpj42VXoXqhEyfus';
const PAYPAL_SECRET = process.env.PAYPAL_CLIENT_SECRET || 'EJGYPB2_QzIcv9__rqCABfaBypC8wxFbW9Hxh9VA5YpanlRaPTHKXF7hfZ-2Ihz0H3FkriOmG9vmXOHY';
const paypalClient = new paypal.core.PayPalHttpClient(
    new paypal.core.SandboxEnvironment(PAYPAL_CLIENT_ID, PAYPAL_SECRET)
);

const priceSyncStatus = { source: PRICE_SOURCE, updatedAt: null, sourceUpdatedAt: null, lastError: null };
let priceRefreshInProgress = false;
let latestMarketPrices = null;
const requestBuckets = new Map();

function rateLimit({ key, limit, windowMs }) {
    return (req, res, next) => {
        const identity = req.sessionID || req.ip || 'anonymous';
        const bucketKey = `${key}:${identity}`;
        const now = Date.now();
        const bucket = requestBuckets.get(bucketKey);
        if (!bucket || now - bucket.startedAt >= windowMs) {
            requestBuckets.set(bucketKey, { startedAt: now, count: 1 });
            return next();
        }
        if (bucket.count >= limit) {
            res.set('Retry-After', String(Math.ceil((windowMs - (now - bucket.startedAt)) / 1000)));
            return res.status(429).json({ message: 'طلبات كثيرة بسرعة. حاول بعد قليل.' });
        }
        bucket.count += 1;
        next();
    };
}

async function getPublicSteamProfile(steamid) {
    const cached = steamProfileCache.get(steamid);
    const cacheDuration = cached?.profile.avatarUrl ? STEAM_PROFILE_CACHE_MS : STEAM_PROFILE_RETRY_MS;
    if (cached && Date.now() - cached.cachedAt < cacheDuration) return cached.profile;

    let profile = { displayName: `Steam ${steamid.slice(-4)}`, avatarUrl: '' };
    try {
        const response = await fetch(`https://steamcommunity.com/profiles/${steamid}/?xml=1`, {
            headers: {
                'Accept': 'application/xml,text/xml',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/132.0.0.0 Safari/537.36',
                'Referer': 'https://steamcommunity.com/'
            },
            signal: AbortSignal.timeout(8000)
        });
        if (!response.ok) throw new Error(`Steam profile returned HTTP ${response.status}`);

        const parsed = steamXmlParser.parse(await response.text());
        const steamProfile = parsed?.profile || {};
        const displayName = typeof steamProfile.steamID === 'string' ? steamProfile.steamID.trim() : '';
        const candidateAvatar = typeof steamProfile.avatarFull === 'string' ? steamProfile.avatarFull.trim() : '';
        let avatarUrl = '';
        try {
            const avatar = new URL(candidateAvatar);
            if (avatar.protocol === 'https:' && avatar.hostname.endsWith('.steamstatic.com')) {
                avatarUrl = avatar.href;
            }
        } catch {}
        profile = {
            displayName: displayName || profile.displayName,
            avatarUrl
        };
    } catch (error) {
        console.warn('تعذر تحميل صورة ملف Steam:', error.message);
    }

    if (steamProfileCache.size >= 5000) steamProfileCache.delete(steamProfileCache.keys().next().value);
    steamProfileCache.set(steamid, { profile, cachedAt: Date.now() });
    return profile;
}

async function getSteamMarketPrice(marketHashName) {
    const cached = steamMarketPriceCache.get(marketHashName);
    if (cached && Date.now() - cached.cachedAt < STEAM_MARKET_PRICE_CACHE_MS) return cached.price;

    let price = null;
    try {
        const url = new URL('https://steamcommunity.com/market/priceoverview/');
        url.searchParams.set('appid', '730');
        url.searchParams.set('currency', '1');
        url.searchParams.set('market_hash_name', marketHashName);
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'CS2Marketplace/1.0' },
            signal: AbortSignal.timeout(STEAM_MARKET_PRICE_TIMEOUT_MS)
        });
        if (!response.ok) throw new Error(`Steam Market returned HTTP ${response.status}`);
        const result = await response.json();
        const rawPrice = result?.lowest_price || result?.median_price || '';
        const normalizedPrice = rawPrice.replace(/[^\d.,-]/g, '').replace(/,/g, '');
        const parsedPrice = Number(normalizedPrice);
        if (result?.success && Number.isFinite(parsedPrice) && parsedPrice > 0) price = parsedPrice;
    } catch (error) {
        console.warn('تعذر جلب سعر Steam Market:', error.message);
    }

    if (steamMarketPriceCache.size >= 5000) {
        steamMarketPriceCache.delete(steamMarketPriceCache.keys().next().value);
    }
    steamMarketPriceCache.set(marketHashName, { price, cachedAt: Date.now() });
    return price;
}

async function attachSteamMarketPrices(items) {
    const candidates = items.filter(item =>
        item.marketable !== false && !Number(item.marketPrice) && typeof item.marketHashName === 'string'
    ).slice(0, 12);
    let nextCandidate = 0;

    await Promise.all(Array.from({ length: Math.min(3, candidates.length) }, async () => {
        while (nextCandidate < candidates.length) {
            const item = candidates[nextCandidate++];
            const price = await getSteamMarketPrice(item.marketHashName);
            if (price) {
                item.marketPrice = price;
                item.marketPriceSource = 'Steam Market';
            }
        }
    }));

    return items;
}

if (process.env.NODE_ENV === 'production' && (
    !BASE_URL.startsWith('https://') ||
    !process.env.SESSION_SECRET ||
    SESSION_SECRET.length < 32
)) {
    throw new Error('Production requires an HTTPS BASE_URL and a SESSION_SECRET of at least 32 characters.');
}

app.use(express.json());

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: BASE_URL.startsWith('https://')
    }
}));

app.use((req, res, next) => {
    if (req.sessionID) onlineVisitors.set(req.sessionID, Date.now());
    next();
});

app.get('/api/online-count', (req, res) => {
    const cutoff = Date.now() - ONLINE_VISITOR_WINDOW_MS;
    for (const [sessionId, lastSeenAt] of onlineVisitors) {
        if (lastSeenAt < cutoff) onlineVisitors.delete(sessionId);
    }
    res.set('Cache-Control', 'no-store');
    res.json({ count: onlineVisitors.size });
});

app.get('/api/capabilities', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({
        trade: tradeGateway.getStatus(),
        payments: {
            enabled: true,
            mode: 'paypal-sandbox',
            currency: MARKET_CURRENCY,
            message: 'يمكن شحن المحفظة عبر PayPal.'
        },
        bots: {
            enabled: false,
            mode: 'disabled',
            message: 'Purchase and sale bots are disabled until trade and payment settlement are live.'
        }
    });
});
app.use(passport.initialize());
app.use(passport.session());

passport.use(new SteamStrategy({
    returnURL: `${BASE_URL}/auth/steam/return`,
    realm: `${BASE_URL}/`,
    profile: false
}, async (identifier, profile, done) => {
    try {
        const match = identifier.match(/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)\/?$/i);
        if (!match) return done(null, false);

        const steamid = match[1];
        if (!/^\d{17}$/.test(steamid)) return done(null, false);

        const user = await User.findOneAndUpdate(
            { steamid },
            { $setOnInsert: { steamid, username: `Steam ${steamid}`, walletBalance: 0, inventory: [] } },
            { new: true, upsert: true, runValidators: true }
        );
        done(null, {
            steamid: user.steamid,
            username: user.username,
            walletBalance: user.walletBalance
        });
    } catch (error) {
        done(error);
    }
}));

passport.serializeUser((user, done) => done(null, user.steamid));
passport.deserializeUser(async (steamid, done) => {
    try {
        const user = await User.findOne({ steamid });
        done(null, user ? {
            steamid: user.steamid,
            username: user.username,
            walletBalance: user.walletBalance
        } : false);
    } catch (error) {
        done(error);
    }
});

app.use(express.static(path.join(__dirname)));

async function seedSkinsIfNeeded() {
    try {
        const count = await Skin.countDocuments();
        if (count === 0) {
            await Skin.insertMany([
                { name: "M9 Bayonet | Fade", float: 0.021, price: 1450, category: "knives", color: "#eb4b4b" },
                { name: "AK-47 | Case Hardened", float: 0.115, price: 380, category: "rifles", color: "#d32ce6" },
                { name: "Sport Gloves | Amphibious", float: 0.182, price: 950, category: "gloves", color: "#eb4b4b" },
                { name: "AWP | Asiimov", float: 0.254, price: 120, category: "rifles", color: "#8847ff" }
            ]);
            console.log('تمت تهيئة سوق الأسلحة الافتراضية بنجاح.');
        }
    } catch (err) {
        console.error("خطأ في تهيئة الأسلحة:", err.message);
    }
}

async function syncSkinCatalog() {
    try {
        await Promise.all(Object.entries(SKIN_CATALOG).map(([name, details]) =>
            Promise.all([
                Skin.updateMany({ name }, { $set: details }),
                User.updateMany(
                    { 'inventory.name': name },
                    { $set: { 'inventory.$[item].marketHashName': details.marketHashName, 'inventory.$[item].imageUrl': details.imageUrl } },
                    { arrayFilters: [{ 'item.name': name }] }
                )
            ])
        ));
    } catch (err) {
        console.error('خطأ في تحديث بيانات السكنات:', err.message);
    }
}

async function refreshMarketPrices() {
    if (priceRefreshInProgress) return;
    priceRefreshInProgress = true;
    try {
        const response = await fetch(PRICE_FEED_URL, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'CS2Marketplace/1.0' },
            signal: AbortSignal.timeout(PRICE_FETCH_TIMEOUT_MS)
        });
        if (!response.ok) throw new Error(`Price feed returned HTTP ${response.status}`);

        const prices = await response.json();
        const sourceUpdatedAt = response.headers.get('last-modified');
        const updatedAt = new Date();
        let updatedItems = 0;

        for (const details of Object.values(SKIN_CATALOG)) {
            const price = Number(prices[details.marketHashName]?.starting_at?.price);
            if (!Number.isFinite(price) || price <= 0) continue;

            const update = {
                marketPrice: Math.round(price * 100) / 100,
                marketPriceUpdatedAt: updatedAt,
                marketPriceSource: PRICE_SOURCE
            };
            await Promise.all([
                Skin.updateMany(
                    { marketHashName: details.marketHashName, isUserListing: { $ne: true } },
                    { $set: { ...update, price: update.marketPrice } }
                ),
                Skin.updateMany(
                    { marketHashName: details.marketHashName, isUserListing: true },
                    { $set: update }
                ),
                User.updateMany(
                    { 'inventory.marketHashName': details.marketHashName },
                    { $set: {
                        'inventory.$[item].marketPrice': update.marketPrice,
                        'inventory.$[item].marketPriceUpdatedAt': updatedAt,
                        'inventory.$[item].marketPriceSource': PRICE_SOURCE
                    } },
                    { arrayFilters: [{ 'item.marketHashName': details.marketHashName }] }
                )
            ]);
            updatedItems += 1;
        }

        if (!updatedItems) throw new Error('Price feed did not contain any configured CS2 items.');
        latestMarketPrices = prices;
        priceSyncStatus.updatedAt = updatedAt;
        priceSyncStatus.sourceUpdatedAt = sourceUpdatedAt ? new Date(sourceUpdatedAt) : null;
        priceSyncStatus.lastError = null;
        console.log(`Updated reference prices for ${updatedItems} CS2 items from ${PRICE_SOURCE}.`);
    } catch (err) {
        priceSyncStatus.lastError = err.message;
        console.error('تعذر تحديث أسعار السوق:', err.message);
    } finally {
        priceRefreshInProgress = false;
    }
}

// ابحث عن هذا الجزء في آخر الملف واستبدله بهذا:
connectDB().then(async () => {
    console.log('🚀 Connecting to database and syncing data...');
    
    await seedSkinsIfNeeded();  // يضيف السكنات إذا كانت القاعدة فارغة
    await syncSkinCatalog();    // هاد هو السطر المهم: بيحدث الروابط لكل السكنات الموجودة
    await refreshMarketPrices(); // بيحدث الأسعار
    
    setInterval(refreshMarketPrices, PRICE_REFRESH_INTERVAL_MS).unref();
    console.log('✅ Server is ready and images are synced!');
});

app.get('/auth/steam', passport.authenticate('steam'));

app.get('/auth/steam/return',
    passport.authenticate('steam', { failureRedirect: '/?login=failed' }),
    (req, res, next) => {
        req.session.user = {
            steamid: req.user.steamid,
            username: req.user.username,
            walletBalance: req.user.walletBalance
        };
        req.session.save(error => {
            if (error) return next(error);
            res.redirect('/');
        });
    }
);

app.get('/auth/user', async (req, res) => {
    if (!req.session?.user) return res.json({ loggedIn: false });
    try {
        const user = await User.findOne({ steamid: req.session.user.steamid });
        if (!user) return res.json({ loggedIn: false });
        const steamProfile = await getPublicSteamProfile(user.steamid);
        res.json({
            loggedIn: true,
            profileId: user.steamid,
            username: steamProfile.displayName || user.username,
            avatarUrl: steamProfile.avatarUrl,
            walletBalance: user.walletBalance,
            steamInventoryPrivate: user.steamInventoryPrivate
        });
    } catch (error) {
        res.status(500).json({ loggedIn: false, message: error.message });
    }
});

function requireAuthenticatedUser(req, res) {
    if (!req.session?.user?.steamid) {
        res.status(401).json({ message: 'سجّل الدخول عبر Steam أولاً.' });
        return false;
    }
    return true;
}

app.get('/api/support/tickets', async (req, res) => {
    if (!requireAuthenticatedUser(req, res)) return;
    try {
        const tickets = await SupportTicket.find({ ownerSteamId: req.session.user.steamid })
            .sort({ updatedAt: -1 })
            .lean();
        res.set('Cache-Control', 'private, no-store');
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'تعذر تحميل تذاكر الدعم.' });
    }
});

app.post('/api/support/tickets', rateLimit({ key: 'support-create', limit: 5, windowMs: 10 * 60 * 1000 }), async (req, res) => {
    if (!requireAuthenticatedUser(req, res)) return;
    const subject = String(req.body?.subject || '').trim();
    const body = String(req.body?.message || '').trim();
    const allowedCategories = ['technical', 'payment', 'trade', 'report', 'other'];
    const category = String(req.body?.category || 'other');
    if (subject.length < 3 || subject.length > 120) {
        return res.status(400).json({ message: 'عنوان التذكرة يجب أن يكون بين 3 و120 حرفًا.' });
    }
    if (body.length < 5 || body.length > 2000) {
        return res.status(400).json({ message: 'رسالة الدعم يجب أن تكون بين 5 و2000 حرف.' });
    }
    if (!allowedCategories.includes(category)) {
        return res.status(400).json({ message: 'تصنيف الدعم غير صالح.' });
    }

    try {
        const ticket = await SupportTicket.create({
            ownerSteamId: req.session.user.steamid,
            subject,
            category,
            messages: [{ authorSteamId: req.session.user.steamid, body }]
        });
        res.status(201).json({ ticket, message: 'تم فتح تذكرة الدعم.' });
    } catch (error) {
        res.status(500).json({ message: 'تعذر فتح تذكرة الدعم.' });
    }
});

app.post('/api/support/tickets/:ticketId/messages', rateLimit({ key: 'support-reply', limit: 20, windowMs: 10 * 60 * 1000 }), async (req, res) => {
    if (!requireAuthenticatedUser(req, res)) return;
    const message = String(req.body?.message || '').trim();
    if (message.length < 1 || message.length > 2000) {
        return res.status(400).json({ message: 'الرد يجب أن يكون بين حرف واحد و2000 حرف.' });
    }
    if (!mongoose.isValidObjectId(req.params.ticketId)) {
        return res.status(400).json({ message: 'معرّف التذكرة غير صالح.' });
    }

    try {
        const ticket = await SupportTicket.findOne({
            _id: req.params.ticketId,
            ownerSteamId: req.session.user.steamid
        });
        if (!ticket) return res.status(404).json({ message: 'تذكرة الدعم غير موجودة.' });
        if (ticket.status === 'closed') return res.status(409).json({ message: 'التذكرة مغلقة.' });
        ticket.messages.push({ authorSteamId: req.session.user.steamid, body: message });
        ticket.updatedAt = new Date();
        await ticket.save();
        res.json({ ticket, message: 'تم إضافة الرد.' });
    } catch (error) {
        res.status(500).json({ message: 'تعذر إضافة الرد.' });
    }
});

app.patch('/api/support/tickets/:ticketId/close', async (req, res) => {
    if (!requireAuthenticatedUser(req, res)) return;
    if (!mongoose.isValidObjectId(req.params.ticketId)) {
        return res.status(400).json({ message: 'معرّف التذكرة غير صالح.' });
    }
    try {
        const ticket = await SupportTicket.findOneAndUpdate(
            { _id: req.params.ticketId, ownerSteamId: req.session.user.steamid },
            { $set: { status: 'closed', updatedAt: new Date() } },
            { returnDocument: 'after' }
        );
        if (!ticket) return res.status(404).json({ message: 'تذكرة الدعم غير موجودة.' });
        res.json({ ticket, message: 'تم إغلاق التذكرة.' });
    } catch (error) {
        res.status(500).json({ message: 'تعذر إغلاق التذكرة.' });
    }
});

app.patch('/api/profile/privacy', async (req, res) => {
    if (!req.session?.user) return res.status(401).json({ message: 'سجّل الدخول عبر Steam أولاً.' });
    if (typeof req.body.steamInventoryPrivate !== 'boolean') {
        return res.status(400).json({ message: 'قيمة الخصوصية غير صالحة.' });
    }

    try {
        const user = await User.findOneAndUpdate(
            { steamid: req.session.user.steamid },
            { $set: { steamInventoryPrivate: req.body.steamInventoryPrivate } },
            { returnDocument: 'after', runValidators: true }
        );
        if (!user) return res.status(404).json({ message: 'الحساب غير موجود.' });
        res.json({ steamInventoryPrivate: user.steamInventoryPrivate });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/profiles/:steamId', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    const targetSteamId = String(req.params.steamId || '');
    if (!/^\d{17}$/.test(targetSteamId)) return res.status(400).json({ message: 'معرّف Steam غير صالح.' });

    try {
        const targetUser = await User.findOne({ steamid: targetSteamId })
            .select('username steamInventoryPrivate blockedSteamIds sellerActivatedAt sellerSuspendedUntil');
        if (!targetUser) return res.status(404).json({ message: 'ملف المستخدم غير موجود.' });

        const viewerSteamId = req.session?.user?.steamid || '';
        const [steamProfile, reportCount, salesCount, viewer, existingReport, reportableTransaction, salesListings] = await Promise.all([
            getPublicSteamProfile(targetSteamId),
            TradeReport.countDocuments({ sellerSteamId: targetSteamId }),
            MarketTransaction.countDocuments({ sellerSteamId: targetSteamId }),
            viewerSteamId ? User.findOne({ steamid: viewerSteamId }).select('blockedSteamIds') : null,
            viewerSteamId && viewerSteamId !== targetSteamId
                ? TradeReport.findOne({ sellerSteamId: targetSteamId, buyerSteamId: viewerSteamId }).select('reason')
                : null,
            viewerSteamId && viewerSteamId !== targetSteamId
                ? MarketTransaction.findOne({ sellerSteamId: targetSteamId, buyerSteamId: viewerSteamId }).select('_id').sort({ createdAt: -1 })
                : null,
            Skin.find({ sellerSteamId: targetSteamId, isUserListing: true })
                .select('name float price category imageUrl marketHashName marketPrice marketPriceSource createdAt')
                .sort({ createdAt: -1 })
                .lean()
        ]);

        let inventory = null;
        let inventoryMessage = '';
        if (targetUser.steamInventoryPrivate) {
            inventoryMessage = 'مخزون هذا المستخدم مخفي.';
        } else {
            try {
                const invData = await loadSteamInventory(targetSteamId);
                inventory = invData.items;
                if (!inventory.length) inventoryMessage = 'لا توجد عناصر CS2 عامة لعرضها.';
                else {
                    const marketHashNames = [...new Set(inventory.map(item => item.marketHashName).filter(Boolean))];
                    const marketReferences = await Skin.find({
                        marketHashName: { $in: marketHashNames },
                        marketPrice: { $gt: 0 }
                    }).select('marketHashName marketPrice marketPriceSource').lean();
                    const marketReferenceByHash = new Map(
                        marketReferences.map(reference => [reference.marketHashName, reference])
                    );
                    inventory = inventory.map(item => {
                        const storedReference = marketReferenceByHash.get(item.marketHashName);
                        const feedPrice = Number(latestMarketPrices?.[item.marketHashName]?.starting_at?.price);
                        const marketPrice = Number.isFinite(feedPrice) && feedPrice > 0
                            ? Math.round(feedPrice * 100) / 100
                            : storedReference?.marketPrice;
                        return {
                            ...item,
                            ...(storedReference || {}),
                            ...(Number(marketPrice) > 0 ? {
                                marketPrice,
                                marketPriceSource: Number.isFinite(feedPrice) && feedPrice > 0
                                    ? PRICE_SOURCE
                                    : storedReference?.marketPriceSource
                            } : {})
                        };
                    });
                }
            } catch (error) {
                inventoryMessage = error.statusCode === 403
                    ? 'مخزون Steam غير متاح للعرض.'
                    : 'تعذر تحميل مخزون Steam الآن.';
            }
        }

        if (inventory?.length) inventory = await attachSteamMarketPrices(inventory);
        const pricedSalesListings = await attachSteamMarketPrices(salesListings.map(listing => {
            const feedPrice = Number(latestMarketPrices?.[listing.marketHashName]?.starting_at?.price);
            return Number.isFinite(feedPrice) && feedPrice > 0
                ? { ...listing, marketPrice: Math.round(feedPrice * 100) / 100, marketPriceSource: PRICE_SOURCE }
                : { ...listing };
        }));

        const reputation = calculateSellerReputation(targetUser, salesCount, reportCount);
        res.json({
            steamId: targetSteamId,
            isOwner: viewerSteamId === targetSteamId,
            displayName: steamProfile.displayName || targetUser.username,
            avatarUrl: steamProfile.avatarUrl,
            inventoryPrivate: targetUser.steamInventoryPrivate,
            inventory,
            inventoryMessage,
            salesListings: pricedSalesListings,
            reputationScore: reputation.score,
            reportCount,
            salesCount,
            sellerActivated: Boolean(targetUser.sellerActivatedAt),
            reputationLabel: reputation.label,
            reportBasis: 'بلاغات من مشترين لديهم عملية شراء ناجحة مسجلة في الموقع',
            hasReported: Boolean(existingReport),
            canReport: Boolean(reportableTransaction && !existingReport),
            tradeRestricted: reputation.tradeRestricted,
            suspensionUntil: reputation.suspensionUntil,
            isBlockedByMe: Boolean(viewer?.blockedSteamIds.includes(targetSteamId))
        });
    } catch (error) {
        res.status(500).json({ message: 'تعذر تحميل الملف الشخصي.' });
    }
});

async function updatePersonalBlock(req, res, shouldBlock) {
    if (!req.session?.user) return res.status(401).json({ message: 'سجّل الدخول أولاً.' });
    const targetSteamId = String(req.params.steamId || '');
    const viewerSteamId = req.session.user.steamid;
    if (!/^\d{17}$/.test(targetSteamId)) return res.status(400).json({ message: 'معرّف Steam غير صالح.' });
    if (targetSteamId === viewerSteamId) return res.status(400).json({ message: 'لا يمكنك حظر حسابك.' });

    try {
        if (!await User.exists({ steamid: targetSteamId })) {
            return res.status(404).json({ message: 'ملف المستخدم غير موجود.' });
        }
        await User.updateOne(
            { steamid: viewerSteamId },
            shouldBlock
                ? { $addToSet: { blockedSteamIds: targetSteamId } }
                : { $pull: { blockedSteamIds: targetSteamId } }
        );
        res.json({ blocked: shouldBlock });
    } catch (error) {
        res.status(500).json({ message: 'تعذر تحديث قائمة الحظر.' });
    }
}

app.post('/api/profiles/:steamId/block', (req, res) => updatePersonalBlock(req, res, true));
app.delete('/api/profiles/:steamId/block', (req, res) => updatePersonalBlock(req, res, false));

app.post('/auth/logout', (req, res, next) => {
    req.logout(error => {
        if (error) return next(error);
        req.session.destroy(error => {
            if (error) return next(error);
            res.clearCookie('connect.sid', {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                secure: BASE_URL.startsWith('https://')
            });
            res.json({ success: true });
        });
    });
});

app.get('/api/skins', async (req, res) => {
    try {
        const skins = await Skin.find({}).lean();
        const sellerIds = [...new Set(skins.map(skin => skin.sellerSteamId).filter(Boolean))];
        const viewer = req.session?.user
            ? await User.findOne({ steamid: req.session.user.steamid }).select('blockedSteamIds')
            : null;
        const [sellers, reports, sales] = await Promise.all([
            sellerIds.length
                ? User.find({ steamid: { $in: sellerIds } })
                    .select('steamid username sellerActivatedAt sellerSuspendedUntil').lean()
                : [],
            sellerIds.length
                ? TradeReport.aggregate([
                    { $match: { sellerSteamId: { $in: sellerIds } } },
                    { $group: { _id: '$sellerSteamId', count: { $sum: 1 } } }
                ])
                : [],
            sellerIds.length
                ? MarketTransaction.aggregate([
                    { $match: { sellerSteamId: { $in: sellerIds } } },
                    { $group: { _id: '$sellerSteamId', count: { $sum: 1 } } }
                ])
                : []
        ]);
        const reportCounts = new Map(reports.map(report => [report._id, report.count]));
        const salesCounts = new Map(sales.map(sale => [sale._id, sale.count]));
        const sellerProfiles = await Promise.all(sellers.map(async seller => {
            const profile = await getPublicSteamProfile(seller.steamid);
            const reportCount = reportCounts.get(seller.steamid) || 0;
            const salesCount = salesCounts.get(seller.steamid) || 0;
            const reputation = calculateSellerReputation(seller, salesCount, reportCount);
            return [seller.steamid, {
                steamId: seller.steamid,
                displayName: profile.displayName || seller.username,
                avatarUrl: profile.avatarUrl,
                sellerActivated: Boolean(seller.sellerActivatedAt),
                salesCount: reputation.salesCount,
                reportCount: reputation.reportCount,
                reputationScore: reputation.score,
                reputationLabel: reputation.label,
                tradeRestricted: reputation.tradeRestricted,
                isBlockedByMe: Boolean(viewer?.blockedSteamIds.includes(seller.steamid))
            }];
        }));
        const sellerMap = new Map(sellerProfiles);
        res.json(skins.map(skin => ({ ...skin, seller: sellerMap.get(skin.sellerSteamId) || null })));
    } catch (err) {
        console.error('تعذر تحميل السوق:', err.message);
        res.json([]); 
    }
});

app.get('/api/market-prices/status', (req, res) => {
    res.json(priceSyncStatus);
});

app.get('/api/inventory', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'يجب تسجيل الدخول أولاً.' });
    try {
        const user = await User.findOne({ steamid: req.session.user.steamid });
        res.json(user ? user.inventory : []);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

async function loadSteamInventory(steamid) {
    const cached = steamInventoryCache.get(steamid);
    if (cached && Date.now() - cached.cachedAt < STEAM_INVENTORY_CACHE_MS) return cached.data;

    const inventoryUrl = new URL(`https://steamcommunity.com/inventory/${steamid}/730/2`);
    inventoryUrl.searchParams.set('l', 'english');
    inventoryUrl.searchParams.set('count', '2000');
    const response = await fetch(inventoryUrl, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'CS2Marketplace/1.0' },
        signal: AbortSignal.timeout(10000)
    });

    if (response.status === 403) {
        throw Object.assign(new Error('مخزون Steam خاص.'), { statusCode: 403 });
    }
    if (response.status === 429) {
        throw Object.assign(new Error('Steam يحدّ الطلبات مؤقتًا.'), { statusCode: 503 });
    }
    if (!response.ok) throw new Error(`Steam inventory returned HTTP ${response.status}`);

    const payload = await response.json();
    if (payload.success !== 1) {
        throw Object.assign(new Error('تعذر قراءة مخزون Steam العام.'), { statusCode: 403 });
    }

    const descriptions = new Map((payload.descriptions || []).map(description => [
        `${description.classid}_${description.instanceid}`,
        description
    ]));
    const items = (payload.assets || []).map(asset => {
        const description = descriptions.get(`${asset.classid}_${asset.instanceid}`) || {};
        const iconHash = typeof description.icon_url === 'string' && /^[\w-]+$/.test(description.icon_url)
            ? description.icon_url
            : '';
        return {
            assetid: String(asset.assetid),
            marketHashName: description.market_hash_name || description.name || 'CS2 item',
            name: description.market_hash_name || description.name || 'CS2 item',
            type: description.type || '',
            amount: Math.max(1, Number(asset.amount) || 1),
            imageUrl: iconHash ? `https://community.akamai.steamstatic.com/economy/image/${iconHash}` : '',
            tradable: description.tradable === 1 || description.tradable === true,
            marketable: description.marketable === 1 || description.marketable === true
        };
    });
    const data = {
        items,
        totalCount: items.reduce((total, item) => total + item.amount, 0),
        hasMore: Boolean(payload.more_items)
    };

    if (steamInventoryCache.size >= 5000) steamInventoryCache.delete(steamInventoryCache.keys().next().value);
    steamInventoryCache.set(steamid, { data, cachedAt: Date.now() });
    return data;
}

app.get('/api/steam/inventory', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    if (!req.session.user) return res.status(401).json({ message: 'سجّل الدخول عبر Steam أولاً.' });

    const steamid = String(req.session.user.steamid || '');
    if (!/^\d{17}$/.test(steamid)) return res.status(400).json({ message: 'معرّف Steam غير صالح.' });
    const user = await User.findOne({ steamid }).select('steamInventoryPrivate');
    if (!user) return res.status(404).json({ message: 'الحساب غير موجود.' });
    if (user.steamInventoryPrivate) {
        return res.status(403).json({ message: 'مخزونك مخفي في إعدادات الخصوصية لهذا الموقع.' });
    }

    try {
        res.json(await loadSteamInventory(steamid));
    } catch (error) {
        console.error('تعذر جلب مخزون Steam:', error.message);
        res.status(error.statusCode || 502).json({ message: error.statusCode === 403
            ? 'مخزون Steam خاص. غيّر الخصوصية إلى عام إذا أردت عرضه.'
            : error.statusCode === 503
                ? 'Steam يحدّ الطلبات مؤقتًا. حاول بعد قليل.'
                : 'تعذر الاتصال بمخزون Steam الآن. حاول لاحقاً.'
        });
    }
});

app.get('/api/steam/test-listings', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ message: 'إعلانات الاختبار غير متاحة.' });
    }
    if (!req.session.user) return res.status(401).json({ message: 'سجّل الدخول عبر Steam أولاً.' });

    try {
        const user = await User.findOne({ steamid: req.session.user.steamid }).select('steamTestListings').lean();
        res.set('Cache-Control', 'private, no-store');
        res.json(user?.steamTestListings || []);
    } catch (error) {
        res.status(500).json({ message: 'تعذر تحميل إعلانات الاختبار.' });
    }
});

app.post('/api/steam/test-listings', rateLimit({ key: 'test-listing-create', limit: 10, windowMs: 10 * 60 * 1000 }), async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ message: 'إعلانات الاختبار غير متاحة.' });
    }
    if (!req.session.user) return res.status(401).json({ message: 'سجّل الدخول عبر Steam أولاً.' });

    const assetId = String(req.body?.assetId || '');
    const price = Number(req.body?.price);
    if (!/^\d{1,32}$/.test(assetId)) return res.status(400).json({ message: 'معرّف عنصر Steam غير صالح.' });
    if (!Number.isFinite(price) || price < 0.01 || price > 10000000) {
        return res.status(400).json({ message: 'أدخل سعرًا بين $0.01 و $10,000,000.' });
    }

    try {
        const steamid = req.session.user.steamid;
        const [user, inventory] = await Promise.all([
            User.findOne({ steamid }).select('steamTestListings'),
            loadSteamInventory(steamid)
        ]);
        if (!user) return res.status(404).json({ message: 'الحساب غير موجود.' });
        const item = inventory.items.find(entry => entry.assetid === assetId);
        if (!item) return res.status(404).json({ message: 'هذا السكن غير موجود في مخزون Steam الحالي.' });
        if (!item.tradable || !item.marketable) {
            return res.status(400).json({ message: 'للاختبار، اختر عنصرًا قابلًا للتبادل والبيع في Steam.' });
        }
        if (user.steamTestListings.some(listing => listing.assetId === assetId)) {
            return res.status(409).json({ message: 'هذا السكن موجود مسبقًا في قائمة الاختبار الخاصة بك.' });
        }

        user.steamTestListings.push({
            assetId,
            name: item.name,
            marketHashName: item.marketHashName,
            imageUrl: item.imageUrl,
            type: item.type,
            price: Math.round(price * 100) / 100
        });
        await user.save();
        res.status(201).json({ message: 'تم إنشاء إدراج اختبار خاص بحسابك فقط. لم يتم نقل السكن أو عرضه في السوق.' });
    } catch (error) {
        console.error('تعذر إنشاء إدراج Steam تجريبي:', error.message);
        res.status(error.statusCode || 500).json({ message: error.statusCode === 403
            ? 'مخزون Steam خاص أو غير متاح.'
            : 'تعذر إنشاء إدراج الاختبار.'
        });
    }
});

app.patch('/api/steam/test-listings/:assetId', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ message: 'إعلانات الاختبار غير متاحة.' });
    }
    if (!req.session.user) return res.status(401).json({ message: 'سجّل الدخول عبر Steam أولاً.' });

    const assetId = String(req.params.assetId || '');
    const price = Number(req.body?.price);
    if (!/^\d{1,32}$/.test(assetId)) return res.status(400).json({ message: 'معرّف عنصر Steam غير صالح.' });
    if (!Number.isFinite(price) || price < 0.01 || price > 10000000) {
        return res.status(400).json({ message: 'أدخل سعرًا بين $0.01 و $10,000,000.' });
    }

    try {
        const steamid = req.session.user.steamid;
        const [user, inventory] = await Promise.all([
            User.findOne({ steamid }),
            loadSteamInventory(steamid)
        ]);
        if (!user) return res.status(404).json({ message: 'الحساب غير موجود.' });
        const item = inventory.items.find(entry => entry.assetid === assetId && entry.tradable && entry.marketable);
        if (!item) return res.status(404).json({ message: 'العنصر لم يعد متاحًا في مخزون Steam.' });
        const listing = user.steamTestListings.find(entry => entry.assetId === assetId);
        if (!listing) return res.status(404).json({ message: 'إدراج الاختبار غير موجود.' });

        listing.price = Math.round(price * 100) / 100;
        await user.save();
        res.json({ message: 'تم تحديث سعر إدراج الاختبار الخاص.' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.statusCode === 403
            ? 'مخزون Steam خاص أو غير متاح.'
            : 'تعذر تحديث سعر إدراج الاختبار.'
        });
    }
});

app.delete('/api/steam/test-listings/:assetId', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ message: 'إعلانات الاختبار غير متاحة.' });
    }
    if (!req.session.user) return res.status(401).json({ message: 'سجّل الدخول عبر Steam أولاً.' });

    const assetId = String(req.params.assetId || '');
    if (!/^\d{1,32}$/.test(assetId)) return res.status(400).json({ message: 'معرّف عنصر Steam غير صالح.' });
    try {
        const user = await User.findOne({ steamid: req.session.user.steamid }).select('steamTestListings');
        if (!user) return res.status(404).json({ message: 'الحساب غير موجود.' });
        const listing = user.steamTestListings.find(entry => entry.assetId === assetId);
        if (!listing) return res.status(404).json({ message: 'إدراج الاختبار غير موجود.' });
        user.steamTestListings.pull({ assetId });
        await user.save();
        res.json({ message: 'تم حذف إدراج الاختبار الخاص بك.' });
    } catch (error) {
        res.status(500).json({ message: 'تعذر حذف إدراج الاختبار.' });
    }
});

app.post('/api/deposit/create-order', rateLimit({ key: 'deposit-create', limit: 8, windowMs: 10 * 60 * 1000 }), async (req, res) => {
    if (!req.session?.user) return res.status(401).json({ message: 'يجب تسجيل الدخول أولاً.' });
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount < 1 || amount > 10000) {
        return res.status(400).json({ message: 'أدخل مبلغ شحن بين $1 و $10,000.' });
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: MARKET_CURRENCY,
                value: amount.toFixed(2)
            }
        }]
    });

    try {
        const order = await paypalClient.execute(request);
        await Payment.create({
            userSteamId: req.session.user.steamid,
            provider: 'paypal',
            providerOrderId: order.result.id,
            amount: Math.round(amount * 100) / 100,
            currency: MARKET_CURRENCY,
            status: 'created'
        });
        res.json({ id: order.result.id });
    } catch (err) {
        console.error('PayPal Order Error:', err.message);
        res.status(500).json({ message: 'فشل إنشاء طلب الدفع مع PayPal.' });
    }
});

app.post('/api/deposit/capture-order', rateLimit({ key: 'deposit-capture', limit: 8, windowMs: 10 * 60 * 1000 }), async (req, res) => {
    if (!req.session?.user) return res.status(401).json({ message: 'يجب تسجيل الدخول أولاً.' });
    const orderId = String(req.body?.orderId || '').trim();
    if (!orderId) return res.status(400).json({ message: 'معرف الطلب مفقود.' });

    try {
        const existingPayment = await Payment.findOne({ provider: 'paypal', providerOrderId: orderId });
        if (!existingPayment) return res.status(404).json({ message: 'طلب الدفع غير موجود.' });
        if (existingPayment.userSteamId !== req.session.user.steamid) {
            return res.status(403).json({ message: 'هذا الطلب لا يخص حسابك.' });
        }
        if (existingPayment.status === 'completed') {
            return res.json({
                success: true,
                message: `تم شحن حسابك مسبقًا بمبلغ $${existingPayment.amount.toFixed(2)}`
            });
        }

        const request = new paypal.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});
        const capture = await paypalClient.execute(request);
        const amountPaid = Number(capture.result?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value);

        if (capture.result?.status !== 'COMPLETED' || !Number.isFinite(amountPaid) || amountPaid <= 0) {
            existingPayment.status = 'failed';
            await existingPayment.save();
            return res.status(400).json({ message: 'عملية الدفع لم تكتمل.' });
        }

        const credited = await Payment.findOneAndUpdate(
            { _id: existingPayment._id, status: { $ne: 'completed' } },
            { $set: { status: 'completed', amount: amountPaid, completedAt: new Date() } },
            { returnDocument: 'after' }
        );
        if (!credited) {
            return res.json({
                success: true,
                message: `تم شحن حسابك مسبقًا بمبلغ $${amountPaid.toFixed(2)}`
            });
        }

        const user = await User.findOneAndUpdate(
            { steamid: req.session.user.steamid },
            { $inc: { walletBalance: amountPaid } },
            { returnDocument: 'after' }
        );
        if (!user) return res.status(404).json({ message: 'الحساب غير موجود.' });

        req.session.user.walletBalance = user.walletBalance;
        return res.json({ success: true, walletBalance: user.walletBalance, message: `تم شحن حسابك بنجاح بمبلغ $${amountPaid.toFixed(2)}` });
    } catch (err) {
        console.error('PayPal Capture Error:', err.message);
        res.status(500).json({ message: 'حدث خطأ أثناء تأكيد الدفع.' });
    }
});

app.post('/api/buy-skin', rateLimit({ key: 'buy-skin', limit: 10, windowMs: 10 * 60 * 1000 }), async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: "يجب تسجيل الدخول أولاً لشراء السكنات!" });
    const { skinId } = req.body;
    if (!mongoose.isValidObjectId(skinId)) return res.status(400).json({ message: 'معرّف السكن غير صالح.' });

    try {
        const listedSkin = await Skin.findById(skinId);
        if (!listedSkin) return res.status(404).json({ message: 'عذراً، هذا السكن غير متوفر!' });
        
        const sellerSteamId = listedSkin.sellerSteamId || '';
        if (sellerSteamId === req.session.user.steamid) {
            return res.status(400).json({ message: 'لا يمكنك شراء إعلانك الخاص.' });
        }

        if (sellerSteamId) {
            const [buyer, seller] = await Promise.all([
                User.findOne({ steamid: req.session.user.steamid }).select('blockedSteamIds'),
                User.findOne({ steamid: sellerSteamId }).select('blockedSteamIds sellerSuspendedUntil')
            ]);
            const personallyBlocked = buyer?.blockedSteamIds.includes(sellerSteamId) ||
                seller?.blockedSteamIds.includes(req.session.user.steamid);
            const sellerSuspended = seller?.sellerSuspendedUntil > new Date();
            if (!seller || personallyBlocked || sellerSuspended) {
                return res.status(403).json({ message: 'الشراء من هذا البائع غير متاح بسبب إعدادات الحظر أو البلاغات.' });
            }
        }

        const purchaseInventoryId = new mongoose.Types.ObjectId();
        const user = await User.findOneAndUpdate(
            { steamid: req.session.user.steamid, walletBalance: { $gte: listedSkin.price } },
            {
                $inc: { walletBalance: -listedSkin.price },
                $push: {
                    inventory: {
                        _id: purchaseInventoryId,
                        name: listedSkin.name,
                        float: listedSkin.float,
                        price: listedSkin.price,
                        category: listedSkin.category,
                        img: listedSkin.img,
                        color: listedSkin.color,
                        imageUrl: listedSkin.imageUrl,
                        marketHashName: listedSkin.marketHashName,
                        marketPrice: listedSkin.marketPrice,
                        marketPriceUpdatedAt: listedSkin.marketPriceUpdatedAt,
                        marketPriceSource: listedSkin.marketPriceSource
                    }
                }
            },
            { returnDocument: 'after' }
        );

        if (!user) {
            return res.status(400).json({ message: 'رصيد محفظتك غير كافٍ.' });
        }

        const deletedSkin = await Skin.findByIdAndDelete(skinId);
        if (!deletedSkin) {
            await User.updateOne(
                { steamid: req.session.user.steamid },
                { $inc: { walletBalance: listedSkin.price }, $pull: { inventory: { _id: purchaseInventoryId } } }
            );
            return res.status(500).json({ message: 'حدث خطأ تقني أثناء إتمام العملية.' });
        }

        if (sellerSteamId) {
            await User.findOneAndUpdate(
                { steamid: sellerSteamId },
                { $inc: { walletBalance: deletedSkin.price } }
            );

            await MarketTransaction.create({
                listingId: deletedSkin._id,
                buyerSteamId: req.session.user.steamid,
                sellerSteamId,
                itemName: deletedSkin.name,
                price: deletedSkin.price
            });
        }

        req.session.user.walletBalance = user.walletBalance;
        await seedSkinsIfNeeded();
        res.json({ message: `تم شراء ${deletedSkin.name} بنجاح.` });

    } catch (err) {
        console.error('Buy Skin Error:', err);
        res.status(500).json({ message: 'حدث خطأ غير متوقع أثناء عملية الشراء.' });
    }
});

app.post('/api/sell-skin', rateLimit({ key: 'sell-skin', limit: 10, windowMs: 10 * 60 * 1000 }), async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: "يجب تسجيل الدخول أولاً!" });
    const { skinId } = req.body;
    if (!mongoose.isValidObjectId(skinId)) return res.status(400).json({ message: 'معرّف السكن غير صالح.' });
    const listingPrice = Number(req.body.price);
    if (!Number.isFinite(listingPrice) || listingPrice < 0.01 || listingPrice > 10000000) {
        return res.status(400).json({ message: 'أدخل سعرًا بين $0.01 و $10,000,000.' });
    }
    const normalizedListingPrice = Math.round(listingPrice * 100) / 100;

    try {
        const userBeforeSale = await User.findOne({ steamid: req.session.user.steamid });
        if (!userBeforeSale) return res.status(404).json({ message: 'المستخدم غير موجود!' });

        const inventoryItem = userBeforeSale.inventory.id(skinId);
        if (!inventoryItem) return res.status(404).json({ message: 'السلاح غير موجود في مخزنك!' });
        const soldSkin = inventoryItem.toObject();

        const user = await User.findOneAndUpdate(
            {
                steamid: req.session.user.steamid,
                inventory: { $elemMatch: { _id: inventoryItem._id, price: inventoryItem.price } }
            },
            {
                $pull: { inventory: { _id: inventoryItem._id } }
            },
            { returnDocument: 'after' }
        );
        if (!user) return res.status(404).json({ message: 'السلاح غير موجود في مخزنك!' });

        try {
            await Skin.create({
                name: soldSkin.name,
                float: soldSkin.float,
                price: normalizedListingPrice,
                category: soldSkin.category,
                img: soldSkin.img,
                color: soldSkin.color,
                imageUrl: soldSkin.imageUrl,
                marketHashName: soldSkin.marketHashName,
                marketPrice: soldSkin.marketPrice,
                marketPriceUpdatedAt: soldSkin.marketPriceUpdatedAt,
                marketPriceSource: soldSkin.marketPriceSource,
                isUserListing: true,
                sellerSteamId: req.session.user.steamid,
                sellerCost: soldSkin.price
            });
        } catch (error) {
            await User.findOneAndUpdate(
                { steamid: req.session.user.steamid },
                { $push: { inventory: soldSkin } }
            );
            throw error;
        }

        await User.updateOne(
            { steamid: req.session.user.steamid, sellerActivatedAt: null },
            { $set: { sellerActivatedAt: new Date() } }
        );

        req.session.user.walletBalance = user.walletBalance;
        res.json({ message: `تم عرض السكن في السوق بسعر $${normalizedListingPrice.toFixed(2)}.` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.patch('/api/market/listings/:skinId', rateLimit({ key: 'listing-price', limit: 20, windowMs: 10 * 60 * 1000 }), async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'سجّل الدخول أولاً.' });
    const { skinId } = req.params;
    const price = Number(req.body.price);
    if (!mongoose.isValidObjectId(skinId)) return res.status(400).json({ message: 'معرّف الإعلان غير صالح.' });
    if (!Number.isFinite(price) || price < 0.01 || price > 10000000) {
        return res.status(400).json({ message: 'أدخل سعرًا بين $0.01 و $10,000,000.' });
    }

    try {
        const listing = await Skin.findOneAndUpdate(
            { _id: skinId, isUserListing: true, sellerSteamId: req.session.user.steamid },
            { $set: { price: Math.round(price * 100) / 100 } },
            { returnDocument: 'after', runValidators: true }
        );
        if (!listing) return res.status(404).json({ message: 'الإعلان غير موجود أو لا تملكه.' });
        res.json({ message: 'تم تحديث سعر الإعلان.', price: listing.price });
    } catch (error) {
        res.status(500).json({ message: 'تعذر تحديث الإعلان.' });
    }
});

app.delete('/api/market/listings/:skinId', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'سجّل الدخول أولاً.' });
    const { skinId } = req.params;
    if (!mongoose.isValidObjectId(skinId)) return res.status(400).json({ message: 'معرّف الإعلان غير صالح.' });

    let listing;
    try {
        listing = await Skin.findOneAndDelete({
            _id: skinId,
            isUserListing: true,
            sellerSteamId: req.session.user.steamid
        });
        if (!listing) return res.status(404).json({ message: 'الإعلان غير موجود أو لا تملكه.' });

        const owner = await User.findOneAndUpdate(
            { steamid: req.session.user.steamid },
            { $push: { inventory: {
                name: listing.name,
                float: listing.float,
                price: listing.sellerCost ?? listing.price,
                category: listing.category,
                img: listing.img,
                color: listing.color,
                imageUrl: listing.imageUrl,
                marketHashName: listing.marketHashName,
                marketPrice: listing.marketPrice,
                marketPriceUpdatedAt: listing.marketPriceUpdatedAt,
                marketPriceSource: listing.marketPriceSource
            } } },
            { returnDocument: 'after' }
        );
        if (!owner) throw new Error('تعذر إعادة السكن إلى مخزونك.');
        res.json({ message: 'تم إلغاء الإعلان وإعادة السكن إلى مخزونك.' });
    } catch (error) {
        if (listing) {
            await Skin.create(listing.toObject()).catch(restoreError => {
                console.error('تعذر إعادة الإعلان بعد فشل الإلغاء:', restoreError.message);
            });
        }
        res.status(500).json({ message: 'تعذر إلغاء الإعلان.' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/profile/:steamId', (req, res) => {
    if (req.params.steamId !== 'me' && !/^\d{17}$/.test(req.params.steamId)) {
        return res.status(404).send('ملف المستخدم غير موجود.');
    }
    res.sendFile(path.join(__dirname, 'profile.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running perfectly on: http://localhost:${PORT}`);
});
