const message = require('../message');
const volumes = require('../volume').exchange_volumes;
const alerts = require('../../config').trade.alerts;
const trades = require('../../db/trades');
const {usd_values} = require('../pairs');

let min_worth = {};
trades.getMinWorth().then((data) => {
  min_worth = data;
});

let volume_filter = 0; // Recommended value = 0.001
trades.getVolFilter().then((data) => {
  volume_filter = data/100;
});

const updateLimits = () => {
  trades.getMinWorth().then((data) => {
    min_worth = data;
  });
  trades.getVolFilter().then((data) => {
    volume_filter = data/100;
  });
}

const bybit = (trade) => {
  // Handle Bybit V5 WebSocket trade message format
  // Expected format: {"topic":"publicTrade.BTCUSDT","type":"snapshot","ts":1672304486868,"data":[{"T":1672304486865,"s":"BTCUSDT","S":"Buy","v":"0.001","p":"16578.50","L":"PlusTick","i":"id","BT":false}]}
  
  if (trade.topic && trade.topic.startsWith('publicTrade.') && trade.data && Array.isArray(trade.data)) {
    trade.data.forEach(tradeData => {
      processBybitTrade(tradeData);
    });
  }
}

const processBybitTrade = (tradeData) => {
  let quantity = parseFloat(tradeData.v); // volume
  let price = parseFloat(tradeData.p); // price
  let symbol = tradeData.s; // e.g., BTCUSDT
  let side = tradeData.S; // Buy or Sell
  
  // Get currency and base from symbol (BTCUSDT -> BTC, USDT)
  let currency, base;
  if (symbol.endsWith('USDT')) {
    currency = symbol.replace('USDT', '');
    base = 'USDT';
  } else if (symbol.endsWith('BTC')) {
    currency = symbol.replace('BTC', '');
    base = 'BTC';
  } else {
    return; // Skip unsupported pairs
  }
  
  let usdtExp = /^USDT$/;
  
  let trade_worth = quantity * price * 
    (usdtExp.test(base) ? 1 : usd_values[base]);

  if (trade_worth > min_worth[currency]) {
    let volume = volumes.bybit ? volumes.bybit[symbol] : 1000000; // Default volume if not available
    let messageObj = {
      event: "TRADE",
      symbol: currency + base, // Keep original format: BTCUSDT
      quantity: side === "Sell" ? -quantity : quantity, // Negative for sells
      price,
      exchange: "Bybit"
    }
    
    if (quantity >= volume_filter * volume && alerts) {
      message(messageObj);
    }
  }
}

module.exports = {bybit, updateLimits};
