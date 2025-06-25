const default_pairs = require('../config.js').currencies;

const request = require('request-promise-native');

const usd_values = {};


const refreshUsdValues = () => {
  let base_currencies = [];
  let request_string = "";
  
  default_pairs.forEach((pair, index) => {
    let base = pair.substr(-3).toUpperCase();
    if(base != "SDT" && base != "BTC" && base_currencies.indexOf(base) == -1) {
      request_string += `t${base}USD,`;
      base_currencies.push(base);
    }
  });
  
  request_string = request_string.replace(/,$/g, "");
  
  if(request_string) {
    let tickerOptions = {
      uri: `https://api.bitfinex.com/v2/tickers?symbols=${request_string}`,
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true
    };
    
    request(tickerOptions).then((data) => {
      data.forEach((ticker) => {
        usd_values[ticker[0].substr(1, ticker[0].length-4)] = ticker[7];
      });
    }).catch((error) => console.log(error));
  }
  
  // Set USDT as 1:1 with USD
  usd_values['USDT'] = 1;
}
refreshUsdValues();
let  interval_id = setInterval(refreshUsdValues, 3600000);

const getPairs = (exchange) => {
  let pairs = [];
  if(exchange == undefined) {
    pairs = default_pairs;
  }
  else if(exchange.toLowerCase() === "binance") {
    // Binance uses USDT format directly - no conversion needed
    pairs = default_pairs.slice(); // Copy array
  }
  else if(exchange.toLowerCase() === "bybit") {
    // Bybit uses USDT format directly - no conversion needed
    pairs = default_pairs.slice(); // Copy array
  }
  else if(exchange.toLowerCase() === "okx") {
    // OKX uses hyphen format: BTC-USDT, ETH-USDT, SOL-USDT
    default_pairs.forEach((pair) => {
      if(pair.includes("USDT")) {
        let currency = pair.replace("USDT", "");
        pairs.push(currency + "-USDT");
      } else if(pair.includes("BTC")) {
        let currency = pair.replace("BTC", "");
        pairs.push(currency + "-BTC");
      }
    });
  }
  else if(exchange.toLowerCase() === "gdax" || exchange.toLowerCase() === "coinbase") {
    // Convert USDT to USD for Coinbase format
    default_pairs.forEach((pair) => {
      if(pair.includes("USDT")) {
        let currency = pair.replace("USDT", "");
        pairs.push(currency + "-USD");
      } else if(pair.includes("BTC")) {
        let currency = pair.replace("BTC", "");
        pairs.push(currency + "-BTC");
      }
    });
  }
  else if(exchange.toLowerCase() === "bitfinex") {
    // Bitfinex uses "UST" for Tether pairs and no separators
    default_pairs.forEach((pair) => {
      if(pair.includes("USDT")) {
        let currency = pair.replace("USDT", "");
        pairs.push(currency + "UST");
      } else if(pair.includes("BTC")) {
        let currency = pair.replace("BTC", "");
        pairs.push(currency + "BTC");
      }
    });
  }
  
  return pairs;
}
  
  const getCurrencies = () => {
  let trading_currencies = [];
  
  default_pairs.forEach((pair) => {
    let base = pair.substr(-3); // Base Exchange currency
    let currency = pair.replace(base, ""); // Actual Traded Currency
    if(trading_currencies.indexOf(currency) == -1) {
      trading_currencies.push(currency);
    }
  });
  return trading_currencies.sort();
}

module.exports = {getPairs, getCurrencies, usd_values, interval_id};
