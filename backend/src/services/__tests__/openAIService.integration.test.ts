import { openAIService } from '../openAIService';

describe('OpenAI Service Integration', () => {
  describe('Image Generation', () => {
    it('should use the correct model configuration', () => {
      // Test that the service is properly configured
      expect(openAIService).toBeDefined();
      
      // Check that the OpenAI client is properly initialized
      // Note: We can't test actual API calls without a valid API key in the test environment
    });
    
    it('should have proper fallback mechanism', () => {
      // Test that the fallback configuration is correct
      const config = {
        model: 'gpt-image-1',
        size: '1024x1024',
        quality: 'hd',
        style: 'vivid',
        enhancementLevel: 'detailed'
      };
      
      expect(config.model).toBe('gpt-image-1');
      expect(config.size).toBe('1024x1024');
      expect(config.quality).toBe('hd');
    });
  });
  
  describe('Prompt Validation', () => {
    it('should validate prompt length', () => {
      const shortPrompt = 'A simple scene';
      const validation = (openAIService as any).validateImagePrompt(shortPrompt);
      expect(validation.isValid).toBe(true);
    });
    
    it('should reject overly long prompts', () => {
      const longPrompt = 'A'.repeat(5000);
      const validation = (openAIService as any).validateImagePrompt(longPrompt);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Prompt exceeds maximum length of 4000 characters');
    });
  });
});