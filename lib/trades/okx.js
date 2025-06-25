const message = require('../message');
const volumes = require('../volume').exchange_volumes;
const alerts = require('../../config').trade.alerts;
const trades = require('../../db/trades');
const {usd_values} = require('../pairs');

let min_worth = {};
trades.getMinWorth().then((data) => {
  min_worth = data;
  console.log('OKX: Loaded min_worth from DB:', min_worth);
});

let volume_filter = 0; // Recommended value = 0.001
trades.getVolFilter().then((data) => {
  volume_filter = data/100;
  console.log('OKX: Loaded volume_filter from DB:', volume_filter, '(raw value:', data, ')');
});

const updateLimits = () => {
  trades.getMinWorth().then((data) => {
    min_worth = data;
  });
  trades.getVolFilter().then((data) => {
    volume_filter = data/100;
  });
}

const okx = (trade) => {
  // Handle OKX V5 WebSocket trade message format
  // Expected format: {"arg":{"channel":"trades","instId":"BTC-USDT"},"data":[{"instId":"BTC-USDT","tradeId":"id","px":"price","sz":"size","side":"buy/sell","ts":"timestamp"}]}
  
  if (trade.arg && trade.arg.channel === 'trades' && trade.data && Array.isArray(trade.data)) {
    trade.data.forEach(tradeData => {
      processOKXTrade(tradeData);
    });
  }
}

const processOKXTrade = (tradeData) => {
  let quantity = parseFloat(tradeData.sz); // size
  let price = parseFloat(tradeData.px); // price
  let symbol = tradeData.instId; // e.g., BTC-USDT
  let side = tradeData.side; // buy or sell
  
  // Convert OKX symbol format (BTC-USDT) to our format (BTCUSDT)
  let parts = symbol.split('-');
  let currency = parts[0]; // BTC
  let base = parts[1]; // USDT
  
  let usdtExp = /^USDT$/;
  
  let trade_worth = quantity * price * 
    (usdtExp.test(base) ? 1 : usd_values[base]);

  // Debug logging
  console.log(`OKX Trade: ${symbol} - ${side} ${quantity} at ${price}`);
  console.log(`Trade worth: $${trade_worth.toFixed(2)}`);
  
  // Try different currency name formats to match database
  let currencyKey = currency;
  if (!min_worth[currency] && min_worth[currency + 'U']) {
    currencyKey = currency + 'U'; // Try BTCU, ETHU, SOLU format
  }
  
  console.log(`Currency: ${currency}, Currency key: ${currencyKey}`);
  console.log(`Min worth for ${currencyKey}: ${min_worth[currencyKey] || 'undefined'}`);
  console.log(`Volume filter: ${volume_filter}`);
  console.log(`Alerts enabled: ${alerts}`);

  let minThreshold = min_worth[currencyKey] || min_worth.default || 70000;
  if (trade_worth > minThreshold) {
    let volume = volumes.okx && volumes.okx[symbol] ? volumes.okx[symbol] : undefined;
    console.log(`Volume for ${symbol}: ${volume}`);
    
    // Enhanced volume filter logic with better fallback handling
    let passesVolumeFilter = true; // Default to true
    
    if (volume_filter > 0 && volume !== undefined && volume > 0) {
      // Only apply volume filter if we have both valid filter and volume data
      passesVolumeFilter = quantity >= (volume_filter * volume);
      console.log(`Filter check: ${quantity} >= ${volume_filter} * ${volume} = ${passesVolumeFilter}`);
    } else if (volume_filter > 0 && (volume === undefined || volume <= 0)) {
      // If volume filter is set but volume data is missing, apply a conservative approach
      // Allow trades that are significantly large (> 0.1 BTC, > 2 ETH, > 50 SOL)
      const conservativeThresholds = {
        'BTC': 0.1,
        'ETH': 2,
        'SOL': 50,
        'BTCU': 0.1,
        'ETHU': 2,
        'SOLU': 50
      };
      
      const conservativeThreshold = conservativeThresholds[currencyKey] || 1;
      passesVolumeFilter = quantity >= conservativeThreshold;
      console.log(`Conservative filter check (volume unavailable): ${quantity} >= ${conservativeThreshold} = ${passesVolumeFilter}`);
    } else {
      // volume_filter is 0 or disabled, pass all trades above min threshold
      console.log(`Volume filter disabled (${volume_filter}), allowing trade`);
    }
    
    let messageObj = {
      event: "TRADE",
      symbol: currency + base, // BTCUSDT format
      quantity: side === "sell" ? -quantity : quantity, // Negative for sells
      price,
      exchange: "OKX"
    }
    
    if (passesVolumeFilter && alerts) {
      console.log(`📧 Sending message for ${symbol} trade!`);
      message(messageObj);
    } else {
      console.log(`❌ Trade not sent - volume filter: ${passesVolumeFilter}, alerts: ${alerts}`);
    }
  } else {
    console.log(`❌ Trade worth ${trade_worth.toFixed(2)} below threshold ${minThreshold}`);
  }
}

module.exports = {okx, updateLimits};
