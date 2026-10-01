const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';

function isConfigured() {
    return process.env.PAYMENT_PROVIDER === 'paypal'
        && Boolean(PAYPAL_CLIENT_ID)
        && Boolean(PAYPAL_CLIENT_SECRET);
}

async function getAccessToken() {
    if (!isConfigured()) throw new Error('PayPal is not configured.');
    const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials',
        signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error(`PayPal token request failed with HTTP ${response.status}`);
    const data = await response.json();
    if (!data.access_token) throw new Error('PayPal token response was invalid.');
    return data.access_token;
}

async function paypalRequest(path, options = {}) {
    const accessToken = await getAccessToken();
    const response = await fetch(`${PAYPAL_BASE_URL}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        signal: AbortSignal.timeout(15000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(`PayPal request failed with HTTP ${response.status}`);
        error.statusCode = response.status;
        error.details = data;
        throw error;
    }
    return data;
}

async function createOrder({ amount, returnUrl, cancelUrl }) {
    return paypalRequest('/v2/checkout/orders', {
        method: 'POST',
        body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [{ amount: { currency_code: 'USD', value: amount.toFixed(2) } }],
            application_context: {
                user_action: 'PAY_NOW',
                return_url: returnUrl,
                cancel_url: cancelUrl
            }
        })
    });
}

async function captureOrder(orderId) {
    return paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
        method: 'POST',
        body: '{}'
    });
}

module.exports = { isConfigured, createOrder, captureOrder };
