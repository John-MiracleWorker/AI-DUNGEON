import axios from 'axios';
import { logger } from '../utils/logger';
import { CustomError } from '../middleware/errorHandler';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../../shared/constants';
import { WorldState, Turn, StyleConfig } from '../../../shared/types';

export interface NarrationResponse {
  narration: string;
  image_prompt: string;
  quick_actions: string[];
  state_changes: {
    location?: string;
    inventory?: string[];
    flags?: Record<string, any>;
  };
}

export interface GameContext {
  genre: string;
  worldState: WorldState;
  recentHistory: Turn[];
  playerInput: string;
  sessionId: string;
}

class OpenAIService {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';
  private styleConfig: StyleConfig;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      logger.error('OpenAI API key not configured - please set OPENAI_API_KEY environment variable');
    } else {
      logger.info('OpenAI API key configured successfully');
    }

    this.styleConfig = {
      fantasy_art: {
        prefix: 'Fantasy digital art, detailed illustration,',
        suffix: 'epic lighting, high detail, artstation style, masterpiece'
      },
      comic_book: {
        prefix: 'Comic book style illustration,',
        suffix: 'bold lines, vibrant colors, graphic novel art, dynamic composition'
      },
      painterly: {
        prefix: 'Oil painting style,',
        suffix: 'impressionist brushstrokes, artistic lighting, fine art'
      }
    };
  }

  async generateNarration(context: GameContext): Promise<NarrationResponse> {
    if (!this.apiKey) {
      throw new CustomError(ERROR_MESSAGES.AI_SERVICE_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const startTime = Date.now();

    try {
      const systemPrompt = this.buildSystemPrompt(context.genre);
      const contextPrompt = this.buildContextPrompt(context);
      const userPrompt = this.buildPlayerActionPrompt(context.playerInput);

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contextPrompt },
        { role: 'user', content: userPrompt }
      ];

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-4',
          messages,
          temperature: 0.8,
          max_tokens: 800,
          top_p: 0.9,
          frequency_penalty: 0.3,
          presence_penalty: 0.3,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const aiResponse = response.data.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response from AI
      let parsedResponse: NarrationResponse;
      try {
        parsedResponse = JSON.parse(aiResponse);
      } catch (parseError) {
        logger.error('Failed to parse AI response:', aiResponse);
        // Fallback response if JSON parsing fails
        parsedResponse = {
          narration: aiResponse,
          image_prompt: `${context.worldState.location}, ${context.genre} scene`,
          quick_actions: ['Look around', 'Continue'],
          state_changes: {}
        };
      }

      const processingTime = Date.now() - startTime;
      logger.info(`AI narration generated in ${processingTime}ms`);

      return parsedResponse;

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      logger.error(`AI narration failed after ${processingTime}ms:`, error);

      if (error.response?.status === 429) {
        throw new CustomError(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED, HTTP_STATUS.TOO_MANY_REQUESTS);
      }

      if (error.response?.status === 401) {
        throw new CustomError('Invalid OpenAI API key', HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }

      throw new CustomError(ERROR_MESSAGES.AI_SERVICE_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  async generateImage(prompt: string, style: string): Promise<string> {
    if (!this.apiKey) {
      throw new CustomError(ERROR_MESSAGES.IMAGE_GENERATION_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const startTime = Date.now();

    try {
      const enhancedPrompt = this.enhanceImagePrompt(prompt, style);

      const response = await axios.post(
        `${this.baseURL}/images/generations`,
        {
          model: 'dall-e-3',
          prompt: enhancedPrompt,
          size: '1024x1024',
          quality: 'standard',
          n: 1,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // Image generation takes longer
        }
      );

      const imageUrl = response.data.data[0]?.url;
      if (!imageUrl) {
        throw new Error('No image URL returned from DALL-E');
      }

      const processingTime = Date.now() - startTime;
      logger.info(`Image generated in ${processingTime}ms`);

      return imageUrl;

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      logger.error(`Image generation failed after ${processingTime}ms:`, error);

      if (error.response?.status === 429) {
        throw new CustomError(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED, HTTP_STATUS.TOO_MANY_REQUESTS);
      }

      if (error.response?.status === 400) {
        logger.error('Image prompt rejected:', prompt);
        // Return a placeholder or retry with safer prompt
        return this.generateFallbackImage(style);
      }

      throw new CustomError(ERROR_MESSAGES.IMAGE_GENERATION_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  async moderateContent(text: string): Promise<boolean> {
    if (!this.apiKey) {
      return true; // Allow content if moderation is unavailable
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/moderations`,
        { input: text },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const result = response.data.results[0];
      return !result.flagged;

    } catch (error) {
      logger.error('Content moderation failed:', error);
      return true; // Allow content if moderation fails
    }
  }

  private buildSystemPrompt(genre: string): string {
    return `You are an expert Dungeon Master running an interactive ${genre} adventure game. 
Create immersive second-person narration that:
- Responds naturally to player actions with vivid detail
- Maintains world consistency and logical consequences
- Provides rich sensory descriptions (sight, sound, smell, touch)
- Keeps content appropriate (PG-13 rating)
- Moves the story forward meaningfully
- Suggests 2-3 logical next actions for the player

CRITICAL: Always respond with valid JSON in this exact format:
{
  "narration": "Your rich, descriptive response in second person",
  "image_prompt": "Detailed scene description for image generation",
  "quick_actions": ["Action 1", "Action 2", "Action 3"],
  "state_changes": {
    "location": "new location name if changed",
    "inventory": ["items to add to inventory"],
    "flags": {"story_flag": "value"}
  }
}

Do not include any text outside the JSON structure.`;
  }

  private buildContextPrompt(context: GameContext): string {
    const { worldState, recentHistory } = context;
    
    let contextStr = `CURRENT WORLD STATE:
Location: ${worldState.location}
Inventory: ${worldState.inventory.join(', ') || 'empty'}
Chapter: ${worldState.current_chapter}`;

    if (worldState.npcs && worldState.npcs.length > 0) {
      contextStr += `\nNPCs present: ${worldState.npcs.map(npc => npc.name).join(', ')}`;
    }

    if (Object.keys(worldState.flags).length > 0) {
      contextStr += `\nStory flags: ${JSON.stringify(worldState.flags)}`;
    }

    if (recentHistory.length > 0) {
      contextStr += '\n\nRECENT EVENTS:';
      recentHistory.slice(-3).forEach((turn, index) => {
        contextStr += `\n${index + 1}. Player: "${turn.player_input}" → ${turn.narration.substring(0, 100)}...`;
      });
    }

    return contextStr;
  }

  private buildPlayerActionPrompt(input: string): string {
    return `PLAYER ACTION: "${input}"

Please respond with how the world reacts to this action. Be creative but logical.`;
  }

  private enhanceImagePrompt(prompt: string, style: string): string {
    const styleKey = style as keyof StyleConfig;
    const config = this.styleConfig[styleKey] || this.styleConfig.fantasy_art;
    
    // Add style prefixes and suffixes
    let enhancedPrompt = `${config.prefix} ${prompt}, ${config.suffix}`;
    
    // Add safety and quality modifiers
    enhancedPrompt += ', safe for work, no violence, no inappropriate content';
    
    // Ensure prompt length is within limits
    if (enhancedPrompt.length > 4000) {
      enhancedPrompt = enhancedPrompt.substring(0, 3950) + '...';
    }
    
    return enhancedPrompt;
  }

  private async generateFallbackImage(style: string): Promise<string> {
    try {
      const fallbackPrompts = [
        'A mysterious fantasy landscape with ancient ruins',
        'A peaceful fantasy village with cobblestone paths',
        'A magical forest clearing with soft sunlight',
        'An ancient library filled with mysterious books'
      ];
      
      const randomPrompt = fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)];
      return await this.generateImage(randomPrompt, style);
    } catch (error) {
      logger.error('Fallback image generation also failed:', error);
      // Return a placeholder image URL or empty string
      return '';
    }
  }
}

export const openAIService = new OpenAIService();