const crypto = require('crypto');
const algorithm = 'aes-256-gcm';

// Get encryption key and IV from environment variables
const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
const iv = Buffer.from(process.env.ENCRYPTION_IV || '', 'hex');

if (!process.env.ENCRYPTION_KEY || !process.env.ENCRYPTION_IV) {
  console.error('Encryption key and IV must be set in environment variables');
  process.exit(1);
}

function encrypt(text) {
  if (!text) return text;
  try {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    // Store auth tag with encrypted data
    return `${encrypted}:${authTag}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
}

function decrypt(text) {
  if (!text) return text;
  try {
    const [encryptedText, authTag] = text.split(':');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed');
  }
}

// Generate new encryption keys - use this function to generate new keys when needed
function generateEncryptionKeys() {
  const newKey = crypto.randomBytes(32).toString('hex');
  const newIV = crypto.randomBytes(12).toString('hex');
  return {
    key: newKey,
    iv: newIV
  };
}

module.exports = { encrypt, decrypt, generateEncryptionKeys };