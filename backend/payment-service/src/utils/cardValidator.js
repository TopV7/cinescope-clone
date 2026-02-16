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
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
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
  
  // Visa
  if (/^4/.test(cleaned)) {
    return 'visa';
  }
  
  // MasterCard
  if (/^5[1-5]/.test(cleaned)) {
    return 'mastercard';
  }
  
  // American Express
  if (/^3[47]/.test(cleaned)) {
    return 'amex';
  }
  
  // Discover
  if (/^6(?:011|5[0-9]{2})/.test(cleaned)) {
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
  
  const results = {
    cardNumber: validateCardNumber(cardNumber),
    cardType: getCardType(cardNumber),
    cvv: validateCVV(cvv, getCardType(cardNumber)),
    expiry: validateExpiry(expiryMonth, expiryYear),
    maskedNumber: maskCardNumber(cardNumber)
  };
  
  const isValid = Object.values(results).every(result => 
    typeof result === 'string' || result.valid
  );
  
  return {
    valid: isValid,
    results,
    errors: Object.values(results)
      .filter(result => result.error)
      .map(result => result.error)
  };
}
