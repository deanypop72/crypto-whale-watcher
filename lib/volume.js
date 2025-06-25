const request = require('request-promise-native');
const {getPairs} = require('./pairs');


let exchange_volumes = {
  binance: {},
  bitfinex: {},
  gdax: {},
  bybit: {},
  okx: {}
};

let tickerOptions = {
  uri: '',
  headers: {
    'User-Agent': 'Request-Promise'
  },
  json: true
};

const refresh_volumes = () => {
  console.log('🔄 Refreshing volumes for all exchanges...');
  
  getPairs("binance").forEach((symbol) => {
    tickerOptions.uri = `https://api.binance.com/api/v1/ticker/24hr?symbol=${symbol}`;
    request(tickerOptions)
    .then(function (tickerResponse) {
      exchange_volumes.binance[symbol] = parseFloat(tickerResponse.volume);
      console.log(`📊 Binance ${symbol}: ${exchange_volumes.binance[symbol]}`);
    }).catch(function (err) {
      console.log("binance:", err.message);
    });
  });
  
  getPairs().forEach((symbol) => {
    tickerOptions.uri = `https://api.bitfinex.com/v2/candles/trade:1D:t${symbol}/last`;
    request(tickerOptions)
    .then(function (tickerResponse) {
      if (Array.isArray(tickerResponse) && tickerResponse.length >= 6 && tickerResponse[5] != null) {
        exchange_volumes.bitfinex[symbol] = parseFloat(tickerResponse[5]);
        console.log(`📊 Bitfinex ${symbol}: ${exchange_volumes.bitfinex[symbol]}`);
      } else {
        console.log('bitfinex: Unexpected ticker response for', symbol, '-', JSON.stringify(tickerResponse).substring(0, 100));
      }
    }).catch(function (err) {
      console.log("bitfinex:", err.message);
    });
  });
  
  getPairs("gdax").forEach((symbol) => {
    tickerOptions.uri = `https://api.gdax.com/products/${symbol}/ticker`;  
    request(tickerOptions)
    .then(function (tickerResponse) {
      exchange_volumes.gdax[symbol] = parseFloat(tickerResponse.volume);
      console.log(`📊 GDAX ${symbol}: ${exchange_volumes.gdax[symbol]}`);
    }).catch(function (err) {
      console.log("gdax", err.message);
    });
  });
  
  // Bybit volume tracking
  const bybitPairs = getPairs("bybit");
  console.log(`📝 Bybit pairs to fetch: ${bybitPairs.join(', ')}`);
  bybitPairs.forEach((symbol) => {
    tickerOptions.uri = `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`;
    console.log(`🔍 Fetching Bybit volume: ${tickerOptions.uri}`);
    request(tickerOptions)
    .then(function (tickerResponse) {
      if(tickerResponse.result && tickerResponse.result.list && tickerResponse.result.list[0]) {
        exchange_volumes.bybit[symbol] = parseFloat(tickerResponse.result.list[0].volume24h);
        console.log(`📊 Bybit ${symbol}: ${exchange_volumes.bybit[symbol]}`);
      } else {
        console.log(`❌ Bybit ${symbol}: No data received`);
      }
    }).catch(function (err) {
      console.log("bybit:", err.message);
    });
  });
  
  // OKX volume tracking  
  const okxPairs = getPairs("okx");
  console.log(`📝 OKX pairs to fetch: ${okxPairs.join(', ')}`);
  okxPairs.forEach((symbol) => {
    tickerOptions.uri = `https://www.okx.com/api/v5/market/ticker?instId=${symbol}`;
    console.log(`🔍 Fetching OKX volume: ${tickerOptions.uri}`);
    request(tickerOptions)
    .then(function (tickerResponse) {
      if(tickerResponse.data && tickerResponse.data[0]) {
        exchange_volumes.okx[symbol] = parseFloat(tickerResponse.data[0].vol24h);
        console.log(`📊 OKX ${symbol}: ${exchange_volumes.okx[symbol]}`);
      } else {
        console.log(`❌ OKX ${symbol}: No data received`, tickerResponse);
      }
    }).catch(function (err) {
      console.log("okx:", err.message);
    });
  });
  
  // Show current volume state after 3 seconds
  setTimeout(() => {
    console.log('📊 Current exchange volumes:');
    console.log('Binance:', exchange_volumes.binance);
    console.log('Bitfinex:', exchange_volumes.bitfinex);
    console.log('GDAX:', exchange_volumes.gdax);
    console.log('Bybit:', exchange_volumes.bybit);
    console.log('OKX:', exchange_volumes.okx);
  }, 3000);
}

refresh_volumes()
setInterval(refresh_volumes, 3600000);

module.exports = {exchange_volumes, refresh_volumes}