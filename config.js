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
    "coinbase": true
  },

  currencies: [
    // USD пары
    "BTCUSD", "ETHUSD", "EOSUSD", "LTCUSD", 
    "SOLUSD", "MATICUSD", "AVAXUSD", "ADAUSD", "DOTUSD", "LINKUSD",
    // BTC пары
    "ETHBTC", "EOSBTC", "LTCBTC", 
    "SOLBTC", "MATICBTC", "AVAXBTC", "ADABTC", "DOTBTC", "LINKBTC"
  ],
  
  trade: {
    alerts: true,
    min_worth: {  // Used while migrating alert limits to the database
      default: 70000, // Default value for when specific value is not specified below
      BTC: 100000,
      LTC: 45000,
      ETH: 65000,
      EOS: 60000,
      SOL: 50000,
      MATIC: 40000,
      AVAX: 45000,
      ADA: 35000,
      DOT: 40000,
      LINK: 40000
    }
  },
  
  order: {
    alerts: true,
    min_worth: {  // Used while migrating alert limits to the database
      default: 700000, // Default value for when specific value is not specified below
      BTC: 1000000,
      LTC: 500000,
      ETH: 800000,
      SOL: 600000,
      MATIC: 400000,
      AVAX: 500000,
      ADA: 350000,
      DOT: 450000,
      LINK: 450000
    }
  }
}