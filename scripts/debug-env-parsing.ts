import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 1. Parse using dotenv
const result = dotenv.config({ path: '.env.local' });

if (result.error) {
  console.error('Dotenv error:', result.error);
}

console.log('--- Dotenv Parse Result ---');
// Check keys
const keys = Object.keys(process.env).filter(k => k.includes('ID') || k.includes('App'));
keys.forEach(k => {
  const val = process.env[k];
  console.log(`Key: '${k}', Length: ${val?.length}, Value: '${val}'`);
});

// Check if there are keys with spaces
const allKeys = Object.keys(result.parsed || {});
allKeys.forEach(k => {
  if (k.trim() !== k) {
    console.log(`WARNING: Key '${k}' has whitespace!`);
  }
});
