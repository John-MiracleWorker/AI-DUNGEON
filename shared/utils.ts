import { VALIDATION_RULES } from './constants';

export function validatePlayerInput(input: string): { isValid: boolean; error?: string } {
  if (!input || input.trim().length === 0) {
    return { isValid: false, error: 'Input cannot be empty' };
  }

  if (input.length > VALIDATION_RULES.MAX_INPUT_LENGTH) {
    return { 
      isValid: false, 
      error: `Input too long (max ${VALIDATION_RULES.MAX_INPUT_LENGTH} characters)` 
    };
  }

  // Basic content filtering
  const prohibitedPatterns = [
    /\b(hack|exploit|cheat)\b/i,
    /<script/i,
    /javascript:/i,
  ];

  for (const pattern of prohibitedPatterns) {
    if (pattern.test(input)) {
      return { isValid: false, error: 'Input contains prohibited content' };
    }
  }

  return { isValid: true };
}

export function validateSaveName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Save name cannot be empty' };
  }

  if (name.length > VALIDATION_RULES.MAX_SAVE_NAME_LENGTH) {
    return { 
      isValid: false, 
      error: `Save name too long (max ${VALIDATION_RULES.MAX_SAVE_NAME_LENGTH} characters)` 
    };
  }

  // Check for valid characters
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
    return { 
      isValid: false, 
      error: 'Save name can only contain letters, numbers, spaces, hyphens, and underscores' 
    };
  }

  return { isValid: true };
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: schemes
    .slice(0, VALIDATION_RULES.MAX_INPUT_LENGTH); // Ensure max length
}

export function generateSessionId(): string {
  return 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function generateTurnId(): string {
  return 'turn_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatTimestamp(date: Date): string {
  return date.toISOString();
}

export function parseTimestamp(timestamp: string): Date {
  return new Date(timestamp);
}

export function calculateProcessingTime(startTime: number): number {
  return Date.now() - startTime;
}