module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  // PARSE_EMODE: "",
  CHAT_ID: process.env.CHAT_ID,
  TESTING: (process.env.TESTING === 'true'),  // Ignore, unless you want to send alerts to a seperate channel while testing, set this to true
  TEST_CHAT_ID: (process.env.TEST_CHAT_ID?process.env.TEST_CHAT_ID:""), // Used when "TESTING" is set to true.
  
  /**
   * These are only names of existing exchanges.
   * 
   * Just adding the name will not add the exchange to the subscriptions.
   * If you add an exchange here, you also have to implement it. :)
   */
  exchanges: {
    "binance": true, 
    "bitfinex": true, 
    "coinbase": false,  // Disabled until Advanced Trade API migration
    "bybit": true,      // Re-enabled for VPN testing
    "okx": true
  },

  currencies: [
    "BTCUSDT", "ETHUSDT", "SOLUSDT", // USDT pairs
    "ETHBTC", "SOLBTC",  // BTC Comparative
  ],
  
  trade: {
    alerts: true,
    min_worth: {  // Used while migrating alert limits to the database
      default: 70000, // Lowered for testing
      BTC: 1000000,    // Lowered for testing
      ETH: 550000,     // Lowered for testing
      SOL: 400000      // Lowered for testing
    }
  },
  
  order: {
    alerts: true,
    min_worth: {  // Used while migrating alert limits to the database
      default: 700000, // Default value for when specific value is not specified below
      BTC: 1000000,
      ETH: 650000,
      SOL: 500000  // Added Solana with appropriate limit
    }
  }
}