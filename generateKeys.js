import crypto from 'crypto';

// Generate a 256-bit (32-byte) encryption key
const ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex'); // 64 characters in hex

// Generate a 16-byte initialization vector (IV)
const IV = crypto.randomBytes(16).toString('hex'); // 32 characters in hex

console.log('ENCRYPTION_KEY:', ENCRYPTION_KEY);
console.log('IV:', IV);
