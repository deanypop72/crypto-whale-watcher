require('dotenv').config();
const message = require('./lib/message');

console.log('Testing message sending...');

// Test message object - simulating a small trade for testing
const testMessage = {
  event: "TRADE",
  symbol: "BTCUSDT",
  quantity: 0.1, // Small amount for testing
  price: 95000,
  exchange: "OKX_TEST"
};

console.log('Sending test message:', testMessage);
message(testMessage);

console.log('Test message sent! Check your Telegram chat.');
