import crypto from 'crypto';

// Валидация номера карты по алгоритму Луна
export function validateCardNumber(cardNumber) {
  // Удаляем все нецифровые символы
  const cleaned = cardNumber.replace(/\D/g, '');
  
  // Проверяем базовую длину
  if (cleaned.length < 13 || cleaned.length > 19) {
    return { valid: false, error: 'Invalid card length' };
  }

  // Алгоритм Луна
  let sum = 0;
  let isSecondDigit = false; // начинаем с последней цифры
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);
    
    if (isSecondDigit) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isSecondDigit = !isSecondDigit;
  }
  
  const isValid = sum % 10 === 0;
  
  return {
    valid: isValid,
    error: isValid ? null : 'Invalid card number (Luhn check failed)'
  };
}

// Определение типа карты
export function getCardType(cardNumber) {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  // American Express (15 цифр)
  if (/^3[47]/.test(cleaned) && cleaned.length === 15) {
    return 'amex';
  }
  
  // Visa (13 или 16 цифр)
  if (/^4/.test(cleaned) && (cleaned.length === 13 || cleaned.length === 16)) {
    return 'visa';
  }
  
  // MasterCard (16 цифр)
  if (/^5[1-5]/.test(cleaned) && cleaned.length === 16) {
    return 'mastercard';
  }
  
  // Discover (16 цифр)
  if (/^6(?:011|5[0-9]{2})/.test(cleaned) && cleaned.length === 16) {
    return 'discover';
  }
  
  return 'unknown';
}

// Валидация CVV
export function validateCVV(cvv, cardType) {
  const cleaned = cvv.replace(/\D/g, '');
  
  if (cardType === 'amex') {
    return {
      valid: cleaned.length === 4,
      error: cleaned.length === 4 ? null : 'Amex CVV must be 4 digits'
    };
  }
  
  return {
    valid: cleaned.length === 3,
    error: cleaned.length === 3 ? null : 'CVV must be 3 digits'
  };
}

// Валидация срока действия
export function validateExpiry(month, year) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  const expMonth = parseInt(month);
  const expYear = parseInt(year);
  
  if (expMonth < 1 || expMonth > 12) {
    return { valid: false, error: 'Invalid month' };
  }
  
  if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
    return { valid: false, error: 'Card has expired' };
  }
  
  return { valid: true, error: null };
}

// Маскировка номера карты
export function maskCardNumber(cardNumber) {
  const cleaned = cardNumber.replace(/\D/g, '');
  const lastFour = cleaned.slice(-4);
  const masked = cleaned.slice(0, -4).replace(/\d/g, '*');
  
  return `${masked}${lastFour}`;
}

// Генерация transaction ID
export function generateTransactionId() {
  return `txn_${Date.now()}_${crypto.randomBytes(4).toString('hex').slice(0, 8)}`;
}

// Полная валидация карты
export function validateCard(cardData) {
  const { cardNumber, cvv, expiryMonth, expiryYear } = cardData;
  
  const cardType = getCardType(cardNumber);
  const cardNumberValidation = validateCardNumber(cardNumber);
  const cvvValidation = validateCVV(cvv, cardType);
  const expiryValidation = validateExpiry(expiryMonth, expiryYear);
  
  const results = {
    cardNumber: cardNumberValidation,
    cardType: cardType,
    cvv: cvvValidation,
    expiry: expiryValidation,
    maskedNumber: maskCardNumber(cardNumber)
  };
  
  const isValid = cardNumberValidation.valid && 
                  cvvValidation.valid && 
                  expiryValidation.valid &&
                  cardType !== 'unknown';
  
  return {
    valid: isValid,
    results,
    errors: [
      cardNumberValidation.error,
      cvvValidation.error,
      expiryValidation.error,
      cardType === 'unknown' ? 'Unknown card type' : null
    ].filter(error => error !== null)
  };
}
