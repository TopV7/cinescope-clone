import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'utf8');
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Шифрует данные
 * @param {string} text - Текст для шифрования
 * @returns {string} - Зашифрованные данные в формате iv:encrypted
 */
export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipher(ALGORITHM, KEY);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Расшифровывает данные
 * @param {string} encryptedText - Зашифрованные данные в формате iv:encrypted
 * @returns {string} - Расшифрованный текст
 */
export function decrypt(encryptedText) {
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];

  const decipher = crypto.createDecipher(ALGORITHM, KEY);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
