const configured = () => process.env.STEAM_TRADE_PROVIDER === 'enabled'
    && Boolean(process.env.STEAM_TRADE_BOT_ID)
    && Boolean(process.env.STEAM_TRADE_CALLBACK_SECRET);

function getStatus() {
    return {
        enabled: configured(),
        mode: configured() ? 'provider-required' : 'disabled',
        message: configured()
            ? 'Steam trade provider credentials are present; provider implementation is still required.'
            : 'Steam trading is disabled until a verified trade provider and bot account are configured.'
    };
}

async function createOffer() {
    throw new Error('Steam trading is disabled until a verified provider is configured.');
}

module.exports = { configured, getStatus, createOffer };
