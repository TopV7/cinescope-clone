import { jest } from '@jest/globals';
import { validateMovieData } from '../../src/routes/movies.js';

describe('Movie Validation', () => {
  describe('validateMovieData', () => {
    it('should validate valid movie data', () => {
      const validData = {
        title: 'Test Movie',
        duration: 120,
        genre: 'Action'
      };

      const result = validateMovieData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate movie data with optional fields', () => {
      const validData = {
        title: 'Test Movie',
        duration: 120,
        genre: 'Action',
        description: 'A great movie',
        rating: 8.5
      };

      const result = validateMovieData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing title', () => {
      const invalidData = {
        duration: 120,
        genre: 'Action'
      };

      const result = validateMovieData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required and must be a non-empty string');
    });

    it('should reject empty title', () => {
      const invalidData = {
        title: '',
        duration: 120,
        genre: 'Action'
      };

      const result = validateMovieData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required and must be a non-empty string');
    });

    it('should reject non-string title', () => {
      const invalidData = {
        title: 123,
        duration: 120,
        genre: 'Action'
      };

      const result = validateMovieData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required and must be a non-empty string');
    });

    it('should reject missing duration', () => {
      const invalidData = {
        title: 'Test Movie',
        genre: 'Action'
      };

      const result = validateMovieData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duration is required and must be a positive number');
    });

    it('should reject non-positive duration', () => {
      const invalidData = {
        title: 'Test Movie',
        duration: 0,
        genre: 'Action'
      };

      const result = validateMovieData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duration is required and must be a positive number');
    });

    it('should reject negative duration', () => {
      const invalidData = {
        title: 'Test Movie',
        duration: -10,
        genre: 'Action'
      };

      const result = validateMovieData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duration is required and must be a positive number');
    });

    it('should reject non-number duration', () => {
      const invalidData = {
        title: 'Test Movie',
        duration: '120',
        genre: 'Action'
      };

      const result = validateMovieData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duration is required and must be a positive number');
    });

    it('should reject missing genre', () => {
      const invalidData = {
        title: 'Test Movie',
        duration: 120
      };

      const result = validateMovieData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Genre is required and must be a non-empty string');
    });

    it('should reject empty genre', () => {
      const invalidData = {
        title: 'Test Movie',
        duration: 120,
        genre: ''
      };

      const result = validateMovieData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Genre is required and must be a non-empty string');
    });

    it('should reject invalid rating (too high)', () => {
      const invalidData = {
        title: 'Test Movie',
        duration: 120,
        genre: 'Action',
        rating: 15
      };

      const result = validateMovieData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Rating must be a number between 0 and 10');
    });

    it('should reject invalid rating (negative)', () => {
      const invalidData = {
        title: 'Test Movie',
        duration: 120,
        genre: 'Action',
        rating: -1
      };

      const result = validateMovieData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Rating must be a number between 0 and 10');
    });

    it('should reject non-number rating', () => {
      const invalidData = {
        title: 'Test Movie',
        duration: 120,
        genre: 'Action',
        rating: '8.5'
      };

      const result = validateMovieData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Rating must be a number between 0 and 10');
    });

    it('should handle multiple validation errors', () => {
      const invalidData = {
        title: '',
        duration: -5,
        genre: '',
        rating: 20
      };

      const result = validateMovieData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
    });
  });
});
