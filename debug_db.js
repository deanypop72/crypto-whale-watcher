require('dotenv').config();
const trades = require('./db/trades');

console.log('Testing database connection and values...');

async function testDB() {
  try {
    console.log('1. Testing getMinWorth...');
    const minWorth = await trades.getMinWorth();
    console.log('Min worth values:', minWorth);
    
    console.log('\n2. Testing getVolFilter...');
    const volFilter = await trades.getVolFilter();
    console.log('Volume filter raw value:', volFilter);
    console.log('Volume filter processed (divided by 100):', volFilter/100);
    
    console.log('\n3. Testing alerts config...');
    const config = require('./config');
    console.log('Alerts enabled:', config.trade.alerts);
    console.log('Exchanges:', config.exchanges);
    
    console.log('\n4. Testing volumes...');
    const volumes = require('./lib/volume').exchange_volumes;
    console.log('Volume data:', volumes);
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing DB:', error);
    process.exit(1);
  }
}

testDB();
