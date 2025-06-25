require('dotenv').config();
const db = require('./db');

async function updateThresholds() {
  try {
    console.log('Updating trade thresholds for testing...');
    
    // Lower the min trade worth values for testing
    await db.none('UPDATE MinTradeWorth SET worth = $1 WHERE symbol = $2', [1000, 'BTCU']);
    await db.none('UPDATE MinTradeWorth SET worth = $1 WHERE symbol = $2', [500, 'ETH']);
    await db.none('UPDATE MinTradeWorth SET worth = $1 WHERE symbol = $2', [500, 'ETHU']);
    await db.none('UPDATE MinTradeWorth SET worth = $1 WHERE symbol = $2', [300, 'SOL']);
    await db.none('UPDATE MinTradeWorth SET worth = $1 WHERE symbol = $2', [300, 'SOLU']);
    
    // Set volume filter to 0 (accept all volumes)
    await db.none('UPDATE VolumeFilter SET percent = $1 WHERE type = $2', [0, 'trade']);
    
    console.log('✅ Thresholds updated successfully!');
    console.log('New thresholds:');
    
    const minWorth = await db.many('SELECT * FROM MinTradeWorth');
    console.log('Min worth:', minWorth);
    
    const volumeFilter = await db.one('SELECT percent FROM VolumeFilter WHERE type = $1', ['trade']);
    console.log('Volume filter:', volumeFilter.percent);
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating thresholds:', error);
    process.exit(1);
  }
}

updateThresholds();
