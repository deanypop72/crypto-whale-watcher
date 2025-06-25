#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

console.log('Starting bot...');
console.log('Environment variables loaded');
console.log('BOT_TOKEN:', process.env.BOT_TOKEN ? 'Set' : 'Not set');
console.log('CHAT_ID:', process.env.CHAT_ID ? 'Set' : 'Not set');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

try {
  console.log('Loading main application...');
  require('./bin/www');
} catch (error) {
  console.error('Error starting bot:', error);
  process.exit(1);
}
