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

let channel_pair = {};

const updateLimits = () => {
  trades.getMinWorth().then((data) => {
    min_worth = data;
  });
  trades.getVolFilter().then((data) => {
    volume_filter = data/100;
  });
}

const bitfinex = (trade) => {
  try {
    // console.log(min_worth.BTC);
    let channel_id = -1;

    // Bitfinex API does not provide symbols after first stream message.
    // Instead it provides a channel-id associated with a stream for a crypto pair.
    if(trade.chanId) {
      channel_id = trade.chanId;
      channel_pair[channel_id] = trade.pair;  // Associating channel_id with symbol (pair) for future lookup.
    } else if(typeof trade[0] == "number") {
      channel_id = trade[0];
    }
    
    // Enhanced validation for Bitfinex data structure
    if(!Array.isArray(trade) || trade.length < 3) {
      return; // Not a trade message
    }
    
    if(trade[2] === null || trade[2] === undefined || !Array.isArray(trade[2])) {
      console.log('bitfinex: Invalid trade[2] data structure:', trade[2]);
      return;
    }
    
    // Check if trade[2] has minimum required length (at least 4 elements)
    if(trade[2].length < 4) {
      console.log('bitfinex: trade[2] array too short, length:', trade[2].length);
      return;
    }
    
    // Safely extract trade data with additional validation
    let quantity = trade[2][2];
    let price = trade[2][3];
    
    // Validate quantity
    if(quantity === null || quantity === undefined || isNaN(quantity)) {
      console.log('bitfinex: Invalid quantity:', quantity);
      return;
    }
    
    // Validate price  
    if(price === null || price === undefined || isNaN(price)) {
      console.log('bitfinex: Invalid price:', price);
      return;
    }
    
    let absQuant = Math.abs(quantity);
    let symbol = channel_pair[channel_id];
    
    // Additional safety checks
    if (!symbol || typeof symbol !== 'string') {
      console.log('bitfinex: Invalid or missing symbol for channel_id:', channel_id);
      return;
    }
    
    let base = symbol.substr((symbol.substr(-4) == "USDT"?-4:-3)); // Base Exchange currency
    let currency = symbol.replace(base, ""); // Actual Traded Currency

    let usdExp = /^USD(T)?$/;

    let trade_worth = absQuant * price * 
      (usdExp.test(base)?1:(usd_values[base] || 1));

    if(trade[1] == "tu" && (trade_worth > (min_worth[currency] || min_worth.default || 100))) {
      let volume = volumes.bitfinex && volumes.bitfinex[symbol] ? volumes.bitfinex[symbol] : 1000000; // Default volume if not available
      
      let messageObj = {
        event: "TRADE",
        symbol,
        quantity,
        price,
        exchange: "Bitfinex"
      }
      
      if(volume && absQuant >= volume_filter*volume && alerts) {
        message(messageObj);
      }
    }
  } catch (error) {
    console.log('bitfinex: Error processing trade data:', error.message);
    console.log('bitfinex: Trade data:', JSON.stringify(trade).substring(0, 200));
  }
}

module.exports = {bitfinex, updateLimits};