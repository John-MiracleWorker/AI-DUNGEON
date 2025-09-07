import { validatePlayerInput, validateSaveName, sanitizeInput } from '../../../shared/utils';

describe('Utility Functions', () => {
  describe('validatePlayerInput', () => {
    it('should accept valid input', () => {
      const result = validatePlayerInput('Look around the room');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty input', () => {
      const result = validatePlayerInput('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Input cannot be empty');
    });

    it('should reject whitespace-only input', () => {
      const result = validatePlayerInput('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Input cannot be empty');
    });

    it('should reject input that is too long', () => {
      const longInput = 'a'.repeat(501);
      const result = validatePlayerInput(longInput);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Input too long');
    });

    it('should reject prohibited content', () => {
      const result = validatePlayerInput('hack the system');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Input contains prohibited content');
    });

    it('should reject script injection attempts', () => {
      const result = validatePlayerInput('<script>alert("xss")</script>');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Input contains prohibited content');
    });
  });

  describe('validateSaveName', () => {
    it('should accept valid save names', () => {
      const result = validateSaveName('My Adventure');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept names with numbers and hyphens', () => {
      const result = validateSaveName('Adventure-2024_v1');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty save names', () => {
      const result = validateSaveName('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Save name cannot be empty');
    });

    it('should reject save names that are too long', () => {
      const longName = 'a'.repeat(51);
      const result = validateSaveName(longName);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Save name too long');
    });

    it('should reject save names with invalid characters', () => {
      const result = validateSaveName('Save@#$%');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('can only contain');
    });
  });

  describe('sanitizeInput', () => {
    it('should remove angle brackets', () => {
      const result = sanitizeInput('<script>alert("test")</script>');
      expect(result).toBe('scriptalert("test")/script');
    });

    it('should remove javascript: schemes', () => {
      const result = sanitizeInput('javascript:alert("xss")');
      expect(result).toBe('alert("xss")');
    });

    it('should trim whitespace', () => {
      const result = sanitizeInput('  hello world  ');
      expect(result).toBe('hello world');
    });

    it('should enforce max length', () => {
      const longInput = 'a'.repeat(600);
      const result = sanitizeInput(longInput);
      expect(result.length).toBeLessThanOrEqual(500);
    });
  });
});