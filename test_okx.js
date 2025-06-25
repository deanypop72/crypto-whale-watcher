require('dotenv').config();
const WebSocket = require('ws');
const { okx } = require('./lib/trades/okx');

console.log('Testing OKX WebSocket connection...');

const ws = new WebSocket('wss://ws.okx.com:8443/ws/v5/public');

ws.on('open', () => {
  console.log('✅ OKX WebSocket connected');
  
  const subscribeMsg = {
    "op": "subscribe",
    "args": [
      { "channel": "trades", "instId": "BTC-USDT" },
      { "channel": "trades", "instId": "ETH-USDT" },
      { "channel": "trades", "instId": "SOL-USDT" }
    ]
  };
  
  console.log('📡 Subscribing to trades...');
  ws.send(JSON.stringify(subscribeMsg));
});

ws.on('message', (data) => {
  try {
    if (data.toString() === 'pong') {
      console.log('💓 Heartbeat pong received');
      return;
    }
    
    const obj = JSON.parse(data);
    
    if (obj.event === 'subscribe') {
      console.log('✅ Subscription confirmed:', obj.arg);
      return;
    }
    
    if (obj.arg && obj.arg.channel === 'trades') {
      console.log('\\n📊 Trade data received:', obj.arg.instId);
      console.log('Data count:', obj.data.length);
      
      // Process each trade through our handler
      okx(obj);
    }
  } catch (e) {
    console.log('❌ JSON parse error:', e.message);
  }
});

ws.on('error', (err) => {
  console.log('❌ WebSocket error:', err.message);
});

ws.on('close', (code, reason) => {
  console.log(`💔 Connection closed: ${code} ${reason}`);
});

// Send ping every 30 seconds
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send('ping');
    console.log('📡 Ping sent');
  }
}, 30000);

console.log('🔄 Listening for trades... (Ctrl+C to stop)');
