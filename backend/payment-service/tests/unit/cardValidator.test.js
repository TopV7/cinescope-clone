import { jest } from '@jest/globals';
import {
  validateCardNumber,
  getCardType,
  validateCVV,
  validateExpiry,
  maskCardNumber,
  generateTransactionId,
  validateCard
} from '../../src/utils/cardValidator.js';

describe('Card Validator Utils', () => {
  describe('validateCardNumber', () => {
    it('should validate valid card numbers', () => {
      // Valid Visa
      expect(validateCardNumber('4111111111111111')).toEqual({
        valid: true,
        error: null
      });

      // Valid MasterCard
      expect(validateCardNumber('5555555555554444')).toEqual({
        valid: true,
        error: null
      });

      // Valid Amex
      expect(validateCardNumber('378282246310005')).toEqual({
        valid: true,
        error: null
      });
    });

    it('should reject invalid card numbers', () => {
      // Invalid length
      expect(validateCardNumber('411111111111')).toEqual({
        valid: false,
        error: 'Invalid card length'
      });

      // Luhn check failure
      expect(validateCardNumber('4111111111111112')).toEqual({
        valid: false,
        error: 'Invalid card number (Luhn check failed)'
      });

      // Non-numeric characters
      expect(validateCardNumber('4111-1111-1111-1111')).toEqual({
        valid: true,
        error: null
      });
    });
  });

  describe('getCardType', () => {
    it('should identify Visa cards', () => {
      expect(getCardType('4111111111111111')).toBe('visa');
      expect(getCardType('4012888888881881')).toBe('visa');
    });

    it('should identify MasterCard cards', () => {
      expect(getCardType('5555555555554444')).toBe('mastercard');
      expect(getCardType('5105105105105100')).toBe('mastercard');
    });

    it('should identify Amex cards', () => {
      expect(getCardType('378282246310005')).toBe('amex');
      expect(getCardType('371449635398431')).toBe('amex');
    });

    it('should identify Discover cards', () => {
      expect(getCardType('6011111111111117')).toBe('discover');
    });

    it('should return unknown for unrecognized cards', () => {
      expect(getCardType('9999999999999999')).toBe('unknown');
      expect(getCardType('1234567890123456')).toBe('unknown');
    });
  });

  describe('validateCVV', () => {
    it('should validate 3-digit CVV for non-Amex cards', () => {
      expect(validateCVV('123', 'visa')).toEqual({
        valid: true,
        error: null
      });

      expect(validateCVV('123', 'mastercard')).toEqual({
        valid: true,
        error: null
      });
    });

    it('should validate 4-digit CVV for Amex cards', () => {
      expect(validateCVV('1234', 'amex')).toEqual({
        valid: true,
        error: null
      });
    });

    it('should reject invalid CVV lengths', () => {
      expect(validateCVV('12', 'visa')).toEqual({
        valid: false,
        error: 'CVV must be 3 digits'
      });

      expect(validateCVV('12345', 'amex')).toEqual({
        valid: false,
        error: 'Amex CVV must be 4 digits'
      });

      expect(validateCVV('123', 'amex')).toEqual({
        valid: false,
        error: 'Amex CVV must be 4 digits'
      });
    });

    it('should handle non-numeric CVV', () => {
      expect(validateCVV('12a', 'visa')).toEqual({
        valid: false,
        error: 'CVV must be 3 digits'
      });
    });
  });

  describe('validateExpiry', () => {
    beforeAll(() => {
      // Mock current date to ensure consistent tests
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should validate future expiry dates', () => {
      expect(validateExpiry('12', '2025')).toEqual({
        valid: true,
        error: null
      });

      expect(validateExpiry('06', '2024')).toEqual({
        valid: true,
        error: null
      });
    });

    it('should reject expired cards', () => {
      expect(validateExpiry('01', '2024')).toEqual({
        valid: false,
        error: 'Card has expired'
      });

      expect(validateExpiry('12', '2023')).toEqual({
        valid: false,
        error: 'Card has expired'
      });
    });

    it('should reject invalid months', () => {
      expect(validateExpiry('13', '2025')).toEqual({
        valid: false,
        error: 'Invalid month'
      });

      expect(validateExpiry('0', '2025')).toEqual({
        valid: false,
        error: 'Invalid month'
      });
    });
  });

  describe('maskCardNumber', () => {
    it('should mask card numbers correctly', () => {
      expect(maskCardNumber('4111111111111111')).toBe('************1111');
      expect(maskCardNumber('378282246310005')).toBe('***********0005');
      expect(maskCardNumber('5555555555554444')).toBe('************4444');
    });

    it('should handle short card numbers', () => {
      expect(maskCardNumber('411111111')).toBe('*****1111');
    });
  });

  describe('generateTransactionId', () => {
    it('should generate unique transaction IDs', () => {
      const id1 = generateTransactionId();
      const id2 = generateTransactionId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^txn_\d+_[a-f0-9]{8}$/);
      expect(id2).toMatch(/^txn_\d+_[a-f0-9]{8}$/);
    });
  });

  describe('validateCard', () => {
    it('should validate complete valid card data', () => {
      const cardData = {
        cardNumber: '4111111111111111',
        cvv: '123',
        expiryMonth: '12',
        expiryYear: '2025'
      };

      const result = validateCard(cardData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.results.cardType).toBe('visa');
      expect(result.results.maskedNumber).toBe('************1111');
    });

    it('should collect multiple validation errors', () => {
      const cardData = {
        cardNumber: '4111111111111112', // Invalid Luhn
        cvv: '12', // Invalid length
        expiryMonth: '13', // Invalid month
        expiryYear: '2023' // Expired
      };

      const result = validateCard(cardData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});
