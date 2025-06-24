const axios = require('axios');
const {getPairs} = require('./pairs');


let exchange_volumes = {
  binance: {},
  bitfinex: {},
  gdax: {}
};

const refresh_volumes = async () => {
  // Binance volumes
  getPairs("binance").forEach(async (symbol) => {
    try {
      const response = await axios.get(`https://api.binance.com/api/v1/ticker/24hr?symbol=${symbol}`);
      exchange_volumes.binance[symbol] = parseFloat(response.data.volume);
    } catch (err) {
      console.log("binance:", err.message);
    }
  });
  
  // Bitfinex volumes
  getPairs().forEach(async (symbol) => {
    try {
      const response = await axios.get(`https://api.bitfinex.com/v2/candles/trade:1D:t${symbol}/last`);
      exchange_volumes.bitfinex[symbol] = response.data[5];
    } catch (err) {
      console.log("bitfinex:", err.message);
    }
  });
  
  // GDAX/Coinbase volumes
  getPairs("gdax").forEach(async (symbol) => {
    try {
      const response = await axios.get(`https://api.pro.coinbase.com/products/${symbol}/ticker`);
      exchange_volumes.gdax[symbol] = parseFloat(response.data.volume);
    } catch (err) {
      console.log("gdax", err.message);
    }
  });
}

refresh_volumes()
setInterval(refresh_volumes, 3600000);

module.exports = {exchange_volumes, refresh_volumes}