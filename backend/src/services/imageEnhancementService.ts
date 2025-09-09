import { logger } from '../utils/logger';
import { ImageGenerationConfig, ImageGenerationError } from '../../../shared/types';

export class ImageEnhancementService {
  private imageCache = new Map<string, { url: string; timestamp: number }>();
  private readonly MAX_CACHE_SIZE = 100;
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  /**
   * Enhanced image generation with multi-stage fallback system
   */
  async generateImageWithFallbacks(
    prompt: string, 
    style: string,
    generateImage: (prompt: string, style: string, config?: ImageGenerationConfig) => Promise<string>
  ): Promise<{ url: string; error?: ImageGenerationError }> {
    const models = [
      { model: 'gpt-image-1', quality: 'hd', style: 'vivid' },
      { model: 'dall-e-3', quality: 'standard', style: 'vivid' },
      { model: 'dall-e-3', quality: 'standard', style: 'natural' },
      { model: 'dall-e-2', quality: 'standard', style: 'vivid' }
    ];
    
    let lastError: any = null;
    
    for (const modelConfig of models) {
      try {
        const imageUrl = await generateImage(prompt, style, {
          model: modelConfig.model as any,
          size: '1024x1024',
          quality: modelConfig.quality as any,
          style: modelConfig.style as any,
          enhancementLevel: 'detailed'
        });
        return { url: imageUrl };
      } catch (error) {
        lastError = error;
        logger.warn(`Image generation failed for model ${modelConfig.model}:`, error);
        // Continue to next fallback model
      }
    }
    
    // If all models fail, return placeholder with error info
    const errorInfo: ImageGenerationError = {
      model: lastError?.model || 'unknown',
      errorType: this.determineErrorType(lastError),
      errorMessage: lastError?.message || 'Unknown error',
      timestamp: new Date(),
      fallbackUsed: false
    };
    
    return { url: this.getPlaceholderImageUrl(), error: errorInfo };
  }

  /**
   * Generate image with retry logic and exponential backoff
   */
  async generateImageWithRetry(
    prompt: string, 
    style: string,
    maxRetries: number = 3,
    generateImage: (prompt: string, style: string, config?: ImageGenerationConfig) => Promise<string>
  ): Promise<{ url: string; error?: ImageGenerationError }> {
    let lastError: any = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.generateImageWithFallbacks(prompt, style, generateImage);
        return result;
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If all retries fail, return placeholder with error info
    const errorInfo: ImageGenerationError = {
      model: lastError?.model || 'unknown',
      errorType: this.determineErrorType(lastError),
      errorMessage: lastError?.message || 'Unknown error',
      timestamp: new Date(),
      fallbackUsed: false
    };
    
    return { url: this.getPlaceholderImageUrl(), error: errorInfo };
  }

  /**
   * Get cached or generate image with caching mechanism
   */
  async getCachedOrGenerateImage(
    prompt: string,
    style: string,
    generateImage: (prompt: string, style: string, config?: ImageGenerationConfig) => Promise<string>
  ): Promise<{ url: string; error?: ImageGenerationError }> {
    this.cleanupCache();
    const cacheKey = `${prompt}_${style}`;
    const cached = this.imageCache.get(cacheKey);

    if (cached) {
      this.imageCache.delete(cacheKey); // move to end for LRU
      this.imageCache.set(cacheKey, cached);
      return { url: cached.url };
    }
    
    const result = await this.generateImageWithRetry(prompt, style, 3, generateImage);
    
    // Cache successful results
    if (result.url && !result.url.includes('placeholder')) {
      this.cleanupCache();
      this.imageCache.set(cacheKey, {
        url: result.url,
        timestamp: Date.now()
      });
      this.enforceCacheLimit();
    }
    
    return result;
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.imageCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL_MS) {
        this.imageCache.delete(key);
      }
    }
  }

  private enforceCacheLimit(): void {
    while (this.imageCache.size > this.MAX_CACHE_SIZE) {
      const oldestKey = this.imageCache.keys().next().value;
      this.imageCache.delete(oldestKey);
    }
  }

  /**
   * Determine error type from error object
   */
  private determineErrorType(error: any): ImageGenerationError['errorType'] {
    if (error?.response?.status === 429) {
      return 'rate_limit';
    }
    
    if (error?.response?.status === 400) {
      return 'content_policy';
    }
    
    if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNRESET') {
      return 'network';
    }
    
    return 'unknown';
  }

  /**
   * Get placeholder image URL
   */
  private getPlaceholderImageUrl(): string {
    // In a real implementation, this would return a URL to a placeholder image
    return '';
  }
}