#!/usr/bin/env node

/**
 * Health Check Script for Crypto Whale Watcher
 * Monitors the status of all exchange connections
 */

require('dotenv').config();
const WebSocket = require('ws');
const {getPairs} = require('./lib/pairs');
const exchanges = require('./config.js').exchanges;

let connectionStatus = {
  binance: 'not_enabled',
  bitfinex: 'not_enabled', 
  bybit: 'not_enabled',
  okx: 'not_enabled',
  coinbase: 'not_enabled'
};

// Test Bybit connection
const testBybitConnection = () => {
  if (!exchanges.bybit) return;
  
  console.log('🔍 Testing Bybit connection...');
  connectionStatus.bybit = 'testing';
  
  const bybitEndpoints = [
    'wss://stream.bybit.com/v5/public/spot',
    'wss://stream-testnet.bybit.com/v5/public/spot'
  ];
  
  let testIndex = 0;
  const testEndpoint = (endpointIndex) => {
    if (endpointIndex >= bybitEndpoints.length) {
      console.log('❌ Bybit: All endpoints failed');
      connectionStatus.bybit = 'failed';
      return;
    }
    
    const endpoint = bybitEndpoints[endpointIndex];
    console.log(`   Testing ${endpoint}...`);
    
    const ws = new WebSocket(endpoint, {
      perMessageDeflate: false,
      handshakeTimeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const timeout = setTimeout(() => {
      ws.terminate();
      console.log(`   ❌ ${endpoint} - timeout`);
      testEndpoint(endpointIndex + 1);
    }, 10000);
    
    ws.on('open', () => {
      clearTimeout(timeout);
      console.log(`   ✅ ${endpoint} - connected successfully`);
      connectionStatus.bybit = 'success';
      ws.close();
    });
    
    ws.on('error', (err) => {
      clearTimeout(timeout);
      console.log(`   ❌ ${endpoint} - error: ${err.message}`);
      testEndpoint(endpointIndex + 1);
    });
  };
  
  testEndpoint(0);
};

// Test Bitfinex connection
const testBitfinexConnection = () => {
  if (!exchanges.bitfinex) return;
  
  console.log('🔍 Testing Bitfinex connection...');
  connectionStatus.bitfinex = 'testing';
  
  const ws = new WebSocket('wss://api.bitfinex.com/ws/2');
  
  const timeout = setTimeout(() => {
    ws.terminate();
    console.log('   ❌ Bitfinex - timeout');
    connectionStatus.bitfinex = 'failed';
  }, 10000);
  
  ws.on('open', () => {
    clearTimeout(timeout);
    console.log('   ✅ Bitfinex - connected successfully');
    connectionStatus.bitfinex = 'success';
    ws.close();
  });
  
  ws.on('error', (err) => {
    clearTimeout(timeout);
    console.log(`   ❌ Bitfinex - error: ${err.message}`);
    connectionStatus.bitfinex = 'failed';
  });
};

// Test OKX connection
const testOKXConnection = () => {
  if (!exchanges.okx) return;
  
  console.log('🔍 Testing OKX connection...');
  connectionStatus.okx = 'testing';
  
  const ws = new WebSocket('wss://ws.okx.com:8443/ws/v5/public');
  
  const timeout = setTimeout(() => {
    ws.terminate();
    console.log('   ❌ OKX - timeout');
    connectionStatus.okx = 'failed';
  }, 10000);
  
  ws.on('open', () => {
    clearTimeout(timeout);
    console.log('   ✅ OKX - connected successfully');
    connectionStatus.okx = 'success';
    ws.close();
  });
  
  ws.on('error', (err) => {
    clearTimeout(timeout);
    console.log(`   ❌ OKX - error: ${err.message}`);
    connectionStatus.okx = 'failed';
  });
};

// Main health check function
const runHealthCheck = () => {
  console.log('🏥 Starting Health Check for Crypto Whale Watcher...\n');
  
  // Update status for enabled exchanges
  if (exchanges.binance) connectionStatus.binance = 'enabled';
  if (exchanges.bitfinex) connectionStatus.bitfinex = 'enabled';
  if (exchanges.bybit) connectionStatus.bybit = 'enabled';
  if (exchanges.okx) connectionStatus.okx = 'enabled';
  if (exchanges.coinbase) connectionStatus.coinbase = 'enabled';
  
  // Test connections
  testBybitConnection();
  testBitfinexConnection();
  testOKXConnection();
  
  // Show results after 15 seconds
  setTimeout(() => {
    console.log('\n📊 Health Check Results:');
    console.log('========================');
    
    Object.entries(connectionStatus).forEach(([exchange, status]) => {
      const icon = {
        'success': '✅',
        'failed': '❌',
        'testing': '🔄',
        'enabled': '⚪',
        'not_enabled': '⚫'
      }[status] || '❓';
      
      console.log(`${icon} ${exchange.toUpperCase()}: ${status}`);
    });
    
    console.log('\n💡 Recommendations:');
    if (connectionStatus.bybit === 'failed') {
      console.log('- Bybit: Check internet connection or geographic restrictions');
      console.log('- Consider using VPN or proxy if in restricted region');
    }
    if (connectionStatus.bitfinex === 'failed') {
      console.log('- Bitfinex: Check API endpoint availability');
    }
    
    process.exit(0);
  }, 15000);
};

// Run the health check
runHealthCheck();
