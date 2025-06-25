const fs = require('fs');
const path = require('path');

// Test dotenv loading
try {
  require('dotenv').config();
  console.log('✓ dotenv loaded successfully');
  console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
  console.log('BOT_TOKEN set:', !!process.env.BOT_TOKEN);
} catch (e) {
  console.error('✗ Error loading dotenv:', e.message);
  process.exit(1);
}

// Test database connection
try {
  const pg = require('pg-promise')();
  const db = pg(process.env.DATABASE_URL);
  
  db.connect()
    .then(obj => {
      console.log('✓ Database connection successful');
      obj.done(); // success, release connection
    })
    .catch(error => {
      console.error('✗ Database connection failed:', error.message);
      process.exit(1);
    });
} catch (e) {
  console.error('✗ Error connecting to database:', e.message);
  process.exit(1);
}
