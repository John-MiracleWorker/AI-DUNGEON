import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { CustomError } from '../middleware/errorHandler';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../../shared/constants';
import { 
  WorldState, 
  Turn, 
  StyleConfig, 
  AdventureDetails,
  CustomPromptContext,
  ImageGenerationConfig
} from '../../../shared/types';

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

// Add TTS configuration interface
export interface TTSConfig {
  model: 'tts-1' | 'tts-1-hd';
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed: number; // 0.25 - 4.0
  response_format: 'mp3' | 'opus' | 'aac' | 'flac';
}

export interface GameContext {
  genre: string;
  worldState: WorldState;
  recentHistory: Turn[];
  playerInput: string;
  sessionId: string;
  adventureDetails?: AdventureDetails;
  adaptiveElements?: {
    discovered_locations: string[];
    met_npcs: string[];
    completed_objectives: string[];
    story_branches: string[];
  };
}

class OpenAIService {
  private openai: OpenAI;
  private styleConfig: StyleConfig;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey) {
      logger.error('OpenAI API key not configured - please set OPENAI_API_KEY environment variable');
    } else {
      logger.info('OpenAI API key configured successfully');
    }

    this.openai = new OpenAI({
      apiKey: apiKey
    });

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

  /**
   * Standardized error handling for OpenAI API calls
   */
  private handleOpenAIError(error: any, context: string, fallbackResponse?: any): any {
    logger.error(`OpenAI API error in ${context}:`, error);

    if (error.status === 429) {
      throw new CustomError(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED, HTTP_STATUS.TOO_MANY_REQUESTS);
    }

    if (error.status === 401) {
      throw new CustomError('Invalid OpenAI API key', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    if (error.status === 400) {
      logger.error(`Bad request in ${context}:`, error.message);
      throw new CustomError(`Invalid request to OpenAI API: ${error.message}`, HTTP_STATUS.BAD_REQUEST);
    }

    // If we have a fallback response, return it instead of throwing an error
    if (fallbackResponse !== undefined) {
      return fallbackResponse;
    }

    throw new CustomError(ERROR_MESSAGES.AI_SERVICE_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  /**
   * Generate narration with standardized error handling
   */
  async generateNarration(context: GameContext): Promise<NarrationResponse> {
    if (!this.openai.apiKey) {
      throw new CustomError(ERROR_MESSAGES.AI_SERVICE_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const startTime = Date.now();

    try {
      const systemPrompt = context.adventureDetails 
        ? this.buildCustomSystemPrompt(context.adventureDetails, context.adaptiveElements)
        : this.buildSystemPrompt(context.genre);
      
      const contextPrompt = context.adventureDetails
        ? this.buildCustomContextPrompt(context)
        : this.buildContextPrompt(context);
      
      const userPrompt = this.buildPlayerActionPrompt(context.playerInput);

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contextPrompt },
        { role: 'user', content: userPrompt }
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages as any,
        temperature: 0.8,
        max_tokens: 800,
        top_p: 0.9,
        frequency_penalty: 0.3,
        presence_penalty: 0.3,
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response from AI with enhanced validation
      let parsedResponse: NarrationResponse;
      try {
        parsedResponse = JSON.parse(aiResponse);
        // Validate and sanitize the response structure with comprehensive validation
        parsedResponse = this.validateNarrationResponse(parsedResponse, context);
      } catch (parseError) {
        logger.error('Failed to parse AI response:', aiResponse);
        // Try intelligent recovery before falling back
        const extractedResponse = this.extractInfoFromRawResponse(aiResponse, context);
        if (extractedResponse !== null) {
          parsedResponse = extractedResponse;
        } else {
          // Final fallback response if all recovery attempts fail
          parsedResponse = {
            narration: aiResponse,
            image_prompt: `${context.worldState.location}, ${context.genre} scene`,
            quick_actions: ['Look around', 'Continue'],
            state_changes: {}
          };
        }
      }

      const processingTime = Date.now() - startTime;
      logger.info(`AI narration generated in ${processingTime}ms`);

      return parsedResponse;

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      return this.handleOpenAIError(error, 'generateNarration', {
        narration: 'The AI encountered an error. Please try again.',
        image_prompt: `${context.worldState.location}, ${context.genre} scene`,
        quick_actions: ['Look around', 'Continue'],
        state_changes: {}
      });
    }
  }

  /**
   * Generate custom adventure prologue with standardized error handling
   */
  async generateCustomPrologue(adventureDetails: AdventureDetails): Promise<NarrationResponse> {
    if (!this.openai.apiKey) {
      throw new CustomError(ERROR_MESSAGES.AI_SERVICE_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const startTime = Date.now();

    try {
      const systemPrompt = this.buildCustomPrologueSystemPrompt(adventureDetails);
      const prologuePrompt = this.buildProloguePrompt(adventureDetails);

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prologuePrompt }
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages as any,
        temperature: 0.9,
        max_tokens: 1000,
        top_p: 0.95,
        frequency_penalty: 0.2,
        presence_penalty: 0.4,
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No prologue response from OpenAI');
      }

      let parsedResponse: NarrationResponse;
      try {
        parsedResponse = JSON.parse(aiResponse);
        // Validate prologue response with comprehensive validation
        parsedResponse = this.validatePrologueResponse(parsedResponse, adventureDetails);
      } catch (parseError) {
        logger.error('Failed to parse custom prologue response:', aiResponse);
        // Try intelligent recovery before throwing error
        const extractedResponse = this.extractInfoFromRawResponse(aiResponse, {
          genre: 'custom',
          worldState: {
            location: '',
            inventory: [],
            npcs: [],
            flags: {},
            current_chapter: 'prologue'
          },
          recentHistory: [],
          playerInput: 'START',
          sessionId: 'prologue'
        } as GameContext);
        if (extractedResponse !== null) {
          parsedResponse = extractedResponse;
        } else {
          throw new Error('Invalid prologue response format');
        }
      }

      const processingTime = Date.now() - startTime;
      logger.info(`Custom adventure prologue generated in ${processingTime}ms`);

      return parsedResponse;

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      return this.handleOpenAIError(error, 'generateCustomPrologue', {
        narration: 'Failed to generate adventure prologue. Please try again.',
        image_prompt: `${adventureDetails.setting.world_description}, opening scene`,
        quick_actions: ['Look around', 'Continue', 'Examine surroundings'],
        state_changes: {
          flags: { prologue_failed: true }
        }
      });
    }
  }

  /**
   * Generate adventure from prompt with standardized error handling
   */
  async generateAdventureFromPrompt(prompt: string): Promise<AdventureDetails> {
    const startTime = Date.now();
    const fallbackAdventure: AdventureDetails = {
      title: 'Default Adventure',
      description: 'A default adventure generated due to an error',
      setting: {
        world_description:
          'A mysterious realm filled with ancient ruins and untold magical secrets, challenging every brave explorer who enters',
        time_period: { type: 'predefined', value: 'medieval' },
        environment: 'Unknown territory'
      },
      characters: {
        player_role: 'Adventurer',
        key_npcs: []
      },
      plot: {
        main_objective: 'Explore and discover',
        secondary_goals: [],
        plot_hooks: [],
        victory_conditions: 'Complete your journey'
      },
      style_preferences: {
        tone: 'serious',
        complexity: 'moderate',
        pacing: 'moderate'
      }
    };

    try {
      if (!this.openai.apiKey) {
        return this.handleOpenAIError({ message: 'Missing OpenAI API key' }, 'generateAdventureFromPrompt', fallbackAdventure);
      }

      const systemPrompt = 'You are an AI that creates detailed JSON for text adventures. Return a JSON matching the AdventureDetails interface.';
      const userPrompt = `Prompt: ${prompt}\nReturn only valid JSON`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      const requestOptions: any = {
        model: 'gpt-4',
        messages: messages as any,
        temperature: 0.8,
        max_tokens: 1000,
      };

      // Only include the JSON response format parameter for models that support it
      if (process.env.OPENAI_JSON_RESPONSE === 'true') {
        requestOptions.response_format = { type: 'json_object' };
      }

      const response = await this.openai.chat.completions.create(requestOptions);

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new CustomError('No adventure details returned from OpenAI', HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }

      let adventureDetails: AdventureDetails;
      try {
        adventureDetails = JSON.parse(aiResponse);
        // Validate adventure details with comprehensive validation
        adventureDetails = this.validateAdventureDetails(adventureDetails);
      } catch (err) {
        logger.error('Failed to parse adventure details:', aiResponse);
        // Try intelligent recovery for adventure details
        const recoveredDetails = this.extractAdventureDetailsFromRawResponse(aiResponse);
        if (recoveredDetails) {
          adventureDetails = recoveredDetails;
        } else {
          throw new CustomError('Invalid adventure details format from AI service', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
      }

      const processingTime = Date.now() - startTime;
      logger.info(`Adventure generated in ${processingTime}ms`);

      return adventureDetails;
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      return this.handleOpenAIError(error, 'generateAdventureFromPrompt', fallbackAdventure);
    }
  }

  async generateImage(prompt: string, style: string, adventureDetails?: AdventureDetails, config?: ImageGenerationConfig): Promise<string> {
    if (!this.openai.apiKey) {
      throw new CustomError(ERROR_MESSAGES.IMAGE_GENERATION_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const startTime = Date.now();

    // Default to GPT-image-1 (newest model) with fallback to DALL-E 3
    const imageConfig: ImageGenerationConfig = config || {
      model: 'gpt-image-1',
      size: '1024x1024',
      quality: 'hd',
      style: 'vivid',
      enhancementLevel: 'detailed'
    };

    try {
      const enhancedPrompt = this.enhanceImagePrompt(prompt, style, adventureDetails);

      // Validate the prompt before sending to OpenAI
      const validation = await this.validateImagePrompt(enhancedPrompt);
      if (!validation.isValid) {
        logger.warn('Image prompt validation failed:', validation.errors);
        throw new Error('Invalid image prompt: ' + validation.errors.join(', '));
      }

      const params: any = {
        model: imageConfig.model,
        prompt: enhancedPrompt,
        n: 1,
        size: imageConfig.size as any
      };
      if (['gpt-image-1', 'dall-e-3'].includes(imageConfig.model)) {
        params.quality = imageConfig.quality;
        params.style = imageConfig.style;
      }

      const response = await this.openai.images.generate(params);

      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error('No image URL returned from OpenAI');
      }

      const processingTime = Date.now() - startTime;
      logger.info(`Image generated with ${imageConfig.model} in ${processingTime}ms`);

      return imageUrl;

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error.response?.data?.error?.message || error.message;
      logger.error(`Image generation failed after ${processingTime}ms using model ${imageConfig.model}: ${errorMessage}`, error);

      if (error.response?.status === 429) {
        throw new CustomError(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED, HTTP_STATUS.TOO_MANY_REQUESTS);
      }

      if (error.response?.status === 400) {
        logger.error('Image prompt rejected:', prompt);
        if (error.response?.data?.error?.message) {
          logger.error(`OpenAI error details: ${error.response.data.error.message}`);
        }
        if (!config || config.model === 'gpt-image-1') {
          const fallbackConfig = {
            model: 'dall-e-3',
            size: '1024x1024',
            quality: 'standard',
            style: 'vivid',
            enhancementLevel: 'detailed'
          } as ImageGenerationConfig;
          logger.info(`Falling back to ${fallbackConfig.model} for image generation`);
          try {
            return await this.generateImageWithModel(prompt, style, adventureDetails, fallbackConfig);
          } catch (fallbackError: any) {
            const fallbackMessage = fallbackError.response?.data?.error?.message || fallbackError.message;
            logger.error(`Fallback image generation failed with model ${fallbackConfig.model}: ${fallbackMessage}`, fallbackError);
            throw new CustomError(ERROR_MESSAGES.IMAGE_GENERATION_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
          }
        }
        throw new CustomError(ERROR_MESSAGES.IMAGE_GENERATION_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }

      throw new CustomError(ERROR_MESSAGES.IMAGE_GENERATION_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Generate image with specific model to avoid infinite recursion
   */
  private async generateImageWithModel(prompt: string, style: string, adventureDetails: AdventureDetails | undefined, config: ImageGenerationConfig): Promise<string> {
    const enhancedPrompt = this.enhanceImagePrompt(prompt, style, adventureDetails);
    
    // Validate the prompt before sending to OpenAI
    const validation = await this.validateImagePrompt(enhancedPrompt);
    if (!validation.isValid) {
      logger.warn('Image prompt validation failed:', validation.errors);
      throw new Error('Invalid image prompt: ' + validation.errors.join(', '));
    }
    
    const params: any = {
      model: config.model,
      prompt: enhancedPrompt,
      n: 1,
      size: config.size as any
    };
    if (['gpt-image-1', 'dall-e-3'].includes(config.model)) {
      params.quality = config.quality;
      params.style = config.style;
    }

    try {
      const response = await this.openai.images.generate(params);
      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error(`No image URL returned from ${config.model}`);
      }
      return imageUrl;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      logger.error(`Image generation failed with model ${config.model}: ${errorMessage}`, error);
      throw error;
    }
  }

  /**
   * Validate image prompt to prevent rejections by OpenAI
   */
  private async validateImagePrompt(prompt: string): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Length validation
    if (prompt.length > 4000) {
      errors.push('Prompt exceeds maximum length of 4000 characters');
    }

    // Content validation for clearly inappropriate patterns
    const inappropriatePatterns = [
      /gore/gi,
      /explicit/gi,
      /nudity/gi,
      /sexual/gi
    ];

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(prompt)) {
        errors.push(`Prompt contains potentially inappropriate content: ${pattern}`);
      }
    }

    // Moderation API check for additional safety
    const isAllowed = await this.moderateContent(prompt);
    if (!isAllowed) {
      errors.push('Prompt flagged by content moderation');
    }

    // Check for special characters that might cause issues
    if (prompt.includes('```') || prompt.includes('"""')) {
      errors.push('Prompt contains invalid formatting characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Enhanced image generation with full configuration support
   */
  async generateImageEnhanced(
    prompt: string, 
    config: ImageGenerationConfig,
    adventureContext?: AdventureDetails
  ): Promise<string> {
    if (!this.openai.apiKey) {
      throw new CustomError(ERROR_MESSAGES.IMAGE_GENERATION_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const startTime = Date.now();

    try {
      const enhancedPrompt = this.buildContextualPrompt(prompt, adventureContext);
      
      // Validate the prompt before sending to OpenAI
      const validation = await this.validateImagePrompt(enhancedPrompt);
      if (!validation.isValid) {
        logger.warn('Enhanced image prompt validation failed:', validation.errors);
        throw new Error('Invalid image prompt: ' + validation.errors.join(', '));
      }
      
      const response = await this.openai.images.generate({
        model: config.model,
        prompt: enhancedPrompt,
        n: 1,
        size: config.size as any,
        quality: config.quality,
        style: config.style
      });

      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error(`No image URL returned from ${config.model}`);
      }

      const processingTime = Date.now() - startTime;
      logger.info(`Enhanced image generated with ${config.model} in ${processingTime}ms`);

      return imageUrl;

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      logger.error(`Enhanced image generation failed after ${processingTime}ms:`, error);

      if (error.response?.status === 429) {
        throw new CustomError(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED, HTTP_STATUS.TOO_MANY_REQUESTS);
      }

      if (error.response?.status === 400) {
        logger.error('Enhanced image prompt rejected:', prompt);
        // Try fallback model if current fails, but only once
        if (config.model === 'gpt-image-1') {
          logger.info('Falling back to DALL-E 3 for enhanced image generation');
          const fallbackConfig = { model: 'dall-e-3', size: config.size || '1024x1024', quality: 'standard', style: config.style || 'vivid', enhancementLevel: 'detailed' } as ImageGenerationConfig;
          try {
            return await this.generateImageWithModel(prompt, 'fantasy_art', adventureContext, fallbackConfig);
          } catch (fallbackError) {
            logger.error('Fallback image generation also failed:', fallbackError);
          }
        }
        // Return a placeholder image URL or empty string
        return '';
      }

      throw new CustomError(ERROR_MESSAGES.IMAGE_GENERATION_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Build contextual prompt with adventure details
   */
  private buildContextualPrompt(
    basePrompt: string, 
    context?: AdventureDetails
  ): string {
    if (!context) return basePrompt;
    
    let enhancedPrompt = basePrompt;
    
    // Add time period context
    if (context.setting.time_period.type === 'custom') {
      enhancedPrompt += `, set in ${context.setting.time_period.customDescription || context.setting.time_period.value}`;
      if (context.setting.time_period.technologicalLevel) {
        enhancedPrompt += `, ${context.setting.time_period.technologicalLevel} technology level`;
      }
      if (context.setting.time_period.culturalContext) {
        enhancedPrompt += `, ${context.setting.time_period.culturalContext}`;
      }
    } else {
      enhancedPrompt += `, ${context.setting.time_period.value} time period`;
    }
    
    // Add style and atmosphere
    enhancedPrompt += `, ${context.style_preferences.tone} atmosphere`;
    
    // Add environment context
    if (context.setting.environment) {
      enhancedPrompt += `, ${context.setting.environment}`;
    }
    
    return enhancedPrompt;
  }

  async moderateContent(text: string): Promise<boolean> {
    if (!this.openai.apiKey) {
      return true; // Allow content if moderation is unavailable
    }

    try {
      const response = await this.openai.moderations.create({
        input: text,
      });

      const result = response.results[0];
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
- Allows mature themes and content (R-rated) including violence, adult themes, and complex moral situations
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

  /**
   * Build system prompt for custom adventures
   */
  private buildCustomSystemPrompt(
    adventureDetails: AdventureDetails, 
    adaptiveElements?: {
      discovered_locations: string[];
      met_npcs: string[];
      completed_objectives: string[];
      story_branches: string[];
    }
  ): string {
    const { title, setting, characters, plot, style_preferences } = adventureDetails;
    
    let systemPrompt = `You are an expert Dungeon Master running "${title}", a custom interactive adventure.

ADVENTURE WORLD:
${setting.world_description}

TIME PERIOD: ${typeof setting.time_period === 'object' ? 
  (setting.time_period.type === 'custom' ? 
    (setting.time_period.customDescription || setting.time_period.value) : 
    setting.time_period.value
  ) : setting.time_period}
ENVIRONMENT: ${setting.environment}`;

    if (setting.special_rules) {
      systemPrompt += `\nSPECIAL RULES: ${setting.special_rules}`;
    }

    systemPrompt += `\n\nPLAYER ROLE: ${characters.player_role}`;

    if (characters.key_npcs && characters.key_npcs.length > 0) {
      systemPrompt += `\n\nKEY NPCs:`;
      characters.key_npcs.forEach(npc => {
        systemPrompt += `\n- ${npc.name}: ${npc.description} (${npc.relationship})`;
        if (npc.personality) {
          systemPrompt += ` Personality: ${npc.personality}`;
        }
        if (npc.goals) {
          systemPrompt += ` Goals: ${npc.goals}`;
        }
      });
    }

    systemPrompt += `\n\nMAIN OBJECTIVE: ${plot.main_objective}`;
    systemPrompt += `\nVICTORY CONDITIONS: ${plot.victory_conditions}`;

    if (plot.secondary_goals && plot.secondary_goals.length > 0) {
      systemPrompt += `\nSECONDARY GOALS: ${plot.secondary_goals.join(', ')}`;
    }

    if (plot.plot_hooks && plot.plot_hooks.length > 0) {
      systemPrompt += `\nPOTENTIAL PLOT HOOKS: ${plot.plot_hooks.join(', ')}`;
    }

    // Add style preferences
    systemPrompt += `\n\nSTYLE PREFERENCES:
- Tone: ${style_preferences.tone}
- Complexity: ${style_preferences.complexity}
- Pacing: ${style_preferences.pacing}`;

    // Add adaptive elements if available
    if (adaptiveElements) {
      if (adaptiveElements.discovered_locations.length > 0) {
        systemPrompt += `\n\nDISCOVERED LOCATIONS: ${adaptiveElements.discovered_locations.join(', ')}`;
      }
      if (adaptiveElements.met_npcs.length > 0) {
        systemPrompt += `\nMET NPCs: ${adaptiveElements.met_npcs.join(', ')}`;
      }
      if (adaptiveElements.completed_objectives.length > 0) {
        systemPrompt += `\nCOMPLETED OBJECTIVES: ${adaptiveElements.completed_objectives.join(', ')}`;
      }
    }

    systemPrompt += `\n\nCreate immersive second-person narration that:
- Stays true to the adventure's world, characters, and objectives
- Responds naturally to player actions with vivid detail
- Maintains consistency with the established setting and NPCs
- Provides rich sensory descriptions appropriate to the tone
- Moves toward the main objective while allowing exploration
- Suggests 2-3 logical actions that fit the adventure's style
- Uses the specified tone (${style_preferences.tone}) and pacing (${style_preferences.pacing})

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

    return systemPrompt;
  }

  /**
   * Build system prompt specifically for custom adventure prologues
   */
  private buildCustomPrologueSystemPrompt(adventureDetails: AdventureDetails): string {
    const { title, setting, characters, plot, style_preferences } = adventureDetails;
    
    return `You are an expert Dungeon Master creating the opening scene for "${title}", a custom interactive adventure.

ADVENTURE SETUP:
- World: ${setting.world_description}
- Time Period: ${typeof setting.time_period === 'object' ? 
    (setting.time_period.type === 'custom' ? 
      (setting.time_period.customDescription || setting.time_period.value) : 
      setting.time_period.value
    ) : setting.time_period}
- Environment: ${setting.environment}
- Player Role: ${characters.player_role}
- Main Objective: ${plot.main_objective}
- Tone: ${style_preferences.tone}
- Pacing: ${style_preferences.pacing}

Create an engaging opening scene that:
- Establishes the world and atmosphere immediately
- Introduces the player character in their role
- Sets up the main adventure hook naturally
- Matches the specified tone and style
- Provides a vivid, immersive introduction
- Ends with clear options for the player to begin their journey

Your prologue should be ${style_preferences.pacing === 'fast' ? 'concise and action-packed' : 
  style_preferences.pacing === 'slow' ? 'detailed and atmospheric' : 'balanced between description and action'}.

CRITICAL: Respond with valid JSON in this exact format:
{
  "narration": "Your engaging prologue in second person",
  "image_prompt": "Detailed opening scene description for image generation",
  "quick_actions": ["Starting Action 1", "Starting Action 2", "Starting Action 3"],
  "state_changes": {
    "location": "starting location name",
    "inventory": ["starting items if any"],
    "flags": {"prologue_complete": true}
  }
}

Do not include any text outside the JSON structure.`;
  }

  /**
   * Build prologue generation prompt
   */
  private buildProloguePrompt(adventureDetails: AdventureDetails): string {
    return `Generate the opening scene for this custom adventure. The player should be introduced to their role and the world in an engaging way that naturally leads to the main quest.

Remember:
- Set the scene vividly in ${adventureDetails.setting.environment}
- Show, don't tell, the player's role as ${adventureDetails.characters.player_role}
- Create intrigue around the main objective without revealing everything
- Match the ${adventureDetails.style_preferences.tone} tone throughout
- Provide meaningful starting choices for the player`;
  }

  /**
   * Build context prompt for custom adventures
   */
  private buildCustomContextPrompt(context: GameContext): string {
    const { worldState, recentHistory, adventureDetails, adaptiveElements } = context;
    
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

    // Add custom adventure specific context
    if (adventureDetails) {
      contextStr += `\n\nADVENTURE PROGRESS:`;
      if (adaptiveElements) {
        if (adaptiveElements.discovered_locations.length > 0) {
          contextStr += `\nLocations discovered: ${adaptiveElements.discovered_locations.join(', ')}`;
        }
        if (adaptiveElements.met_npcs.length > 0) {
          contextStr += `\nNPCs encountered: ${adaptiveElements.met_npcs.join(', ')}`;
        }
        if (adaptiveElements.completed_objectives.length > 0) {
          contextStr += `\nObjectives completed: ${adaptiveElements.completed_objectives.join(', ')}`;
        }
      }
    }

    if (recentHistory.length > 0) {
      contextStr += '\n\nRECENT EVENTS:';
      recentHistory.slice(-3).forEach((turn, index) => {
        contextStr += `\n${index + 1}. Player: "${turn.player_input}" → ${turn.narration.substring(0, 100)}...`;
      });
    }

    return contextStr;
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

  private enhanceImagePrompt(prompt: string, style: string, adventureDetails?: AdventureDetails): string {
    const styleKey = style as keyof StyleConfig;
    const config = this.styleConfig[styleKey] || this.styleConfig.fantasy_art;
    
    let enhancedPrompt = prompt;
    
    // Add custom adventure context to image prompt if available
    if (adventureDetails) {
      const { setting, style_preferences } = adventureDetails;
      
      // Incorporate setting details - handle both old string and new object format
      const timePeriod = typeof setting.time_period === 'object' 
        ? (setting.time_period.type === 'custom' 
            ? (setting.time_period.customDescription || setting.time_period.value)
            : setting.time_period.value)
        : setting.time_period;
      
      if (timePeriod !== 'custom') {
        enhancedPrompt += `, ${timePeriod} time period`;
      }
      
      // Add technological and cultural context for custom time periods
      if (typeof setting.time_period === 'object' && setting.time_period.type === 'custom') {
        if (setting.time_period.technologicalLevel) {
          enhancedPrompt += `, ${setting.time_period.technologicalLevel} technology`;
        }
        if (setting.time_period.culturalContext) {
          enhancedPrompt += `, ${setting.time_period.culturalContext}`;
        }
      }
      
      // Add environmental context
      enhancedPrompt += `, ${setting.environment}`;
      
      // Adjust based on tone
      if (style_preferences.tone === 'serious') {
        enhancedPrompt += ', moody lighting, dramatic atmosphere';
      } else if (style_preferences.tone === 'humorous') {
        enhancedPrompt += ', whimsical, lighthearted atmosphere';
      } else if (style_preferences.tone === 'dramatic') {
        enhancedPrompt += ', cinematic lighting, epic composition';
      }
    }
    
    // Add style prefixes and suffixes
    enhancedPrompt = `${config.prefix} ${enhancedPrompt}, ${config.suffix}`;
    
    // Ensure prompt length is within limits
    if (enhancedPrompt.length > 4000) {
      enhancedPrompt = enhancedPrompt.substring(0, 3950) + '...';
    }
    
    return enhancedPrompt;
  }

  /**
   * Validate narration response structure with comprehensive validation
   */
  private validateNarrationResponse(response: any, context: GameContext): NarrationResponse {
    const validatedResponse: NarrationResponse = {
      narration: typeof response.narration === 'string' ? response.narration : '',
      image_prompt: typeof response.image_prompt === 'string' ? response.image_prompt : `${context.worldState.location}, ${context.genre} scene`,
      quick_actions: this.validateQuickActions(response.quick_actions),
      state_changes: this.validateStateChanges(response.state_changes, context)
    };

    // If narration is empty, use the context to create a meaningful fallback
    if (!validatedResponse.narration) {
      validatedResponse.narration = `You are in ${context.worldState.location}. What would you like to do?`;
    }

    return validatedResponse;
  }

  /**
   * Validate prologue response structure
   */
  private validatePrologueResponse(response: any, adventureDetails: AdventureDetails): NarrationResponse {
    const validatedResponse: NarrationResponse = {
      narration: typeof response.narration === 'string' ? response.narration : '',
      image_prompt: typeof response.image_prompt === 'string' ? response.image_prompt : `${adventureDetails.setting.world_description}, opening scene`,
      quick_actions: this.validateQuickActions(response.quick_actions),
      state_changes: this.validateStateChanges(response.state_changes, {
        genre: 'custom',
        worldState: {
          location: '',
          inventory: [],
          npcs: [],
          flags: {},
          current_chapter: 'prologue'
        },
        recentHistory: [],
        playerInput: 'START',
        sessionId: 'prologue'
      } as GameContext)
    };

    // Ensure prologue has narration
    if (!validatedResponse.narration) {
      throw new Error('Prologue missing narration');
    }

    // Ensure prologue has appropriate quick actions
    if (validatedResponse.quick_actions.length === 0) {
      validatedResponse.quick_actions = ['Look around', 'Continue', 'Examine surroundings'];
    }

    return validatedResponse;
  }

  /**
   * Validate adventure details structure
   */
  private validateAdventureDetails(details: any): AdventureDetails {
    // Validate required top-level fields
    if (!details || typeof details !== 'object') {
      throw new Error('Invalid adventure details structure');
    }

    const validatedDetails: AdventureDetails = {
      title: typeof details.title === 'string' ? details.title : 'Untitled Adventure',
      description: typeof details.description === 'string' ? details.description : '',
      setting: this.validateAdventureSetting(details.setting),
      characters: this.validateAdventureCharacters(details.characters),
      plot: this.validateAdventurePlot(details.plot),
      style_preferences: this.validateStylePreferences(details.style_preferences)
    };

    return validatedDetails;
  }

  /**
   * Validate quick actions array
   */
  private validateQuickActions(actions: any): string[] {
    if (!Array.isArray(actions)) {
      return ['Look around', 'Continue'];
    }

    // Filter to ensure all actions are strings and limit to 5 actions
    const validatedActions = actions
      .filter((action: any) => typeof action === 'string' && action.length > 0)
      .slice(0, 5);

    // If no valid actions, provide defaults
    if (validatedActions.length === 0) {
      return ['Look around', 'Continue'];
    }

    return validatedActions;
  }

  /**
   * Validate state changes object
   */
  private validateStateChanges(stateChanges: any, context: GameContext): NarrationResponse['state_changes'] {
    const validatedStateChanges: NarrationResponse['state_changes'] = {};

    if (!stateChanges || typeof stateChanges !== 'object') {
      return validatedStateChanges;
    }

    // Validate location
    if (typeof stateChanges.location === 'string' && stateChanges.location.length > 0) {
      validatedStateChanges.location = stateChanges.location;
    }

    // Validate inventory with enhanced structure validation
    validatedStateChanges.inventory = this.validateInventoryStructure(stateChanges.inventory);

    // Validate flags
    if (stateChanges.flags && typeof stateChanges.flags === 'object' && stateChanges.flags !== null) {
      validatedStateChanges.flags = stateChanges.flags;
    } else {
      validatedStateChanges.flags = {};
    }

    return validatedStateChanges;
  }

  /**
   * Enhanced inventory structure validation
   */
  private validateInventoryStructure(inventory: any): string[] {
    if (!inventory) return [];

    // If it's already a valid array of strings
    if (Array.isArray(inventory) && inventory.every(item => typeof item === 'string')) {
      return inventory;
    }

    // If it's an array but contains non-strings, convert to strings
    if (Array.isArray(inventory)) {
      return inventory.map(item => String(item)).filter(item => item.length > 0);
    }

    // If it's a single item, convert to array
    return [String(inventory)];
  }

  /**
   * Validate adventure setting
   */
  private validateAdventureSetting(setting: any): AdventureDetails['setting'] {
    if (!setting || typeof setting !== 'object') {
      throw new Error('Invalid adventure setting structure');
    }

    // Handle time period validation for both old string and new object format
    let validatedTimePeriod: any;
    if (typeof setting.time_period === 'string') {
      validatedTimePeriod = { type: 'predefined', value: setting.time_period };
    } else if (setting.time_period && typeof setting.time_period === 'object') {
      validatedTimePeriod = {
        type: setting.time_period.type || 'predefined',
        value: setting.time_period.value || 'medieval'
      };
      if (setting.time_period.customDescription) {
        validatedTimePeriod.customDescription = setting.time_period.customDescription;
      }
      if (setting.time_period.technologicalLevel) {
        validatedTimePeriod.technologicalLevel = setting.time_period.technologicalLevel;
      }
      if (setting.time_period.culturalContext) {
        validatedTimePeriod.culturalContext = setting.time_period.culturalContext;
      }
    } else {
      validatedTimePeriod = { type: 'predefined', value: 'medieval' };
    }

    return {
      world_description: typeof setting.world_description === 'string' ? setting.world_description : '',
      time_period: validatedTimePeriod,
      environment: typeof setting.environment === 'string' ? setting.environment : '',
      special_rules: typeof setting.special_rules === 'string' ? setting.special_rules : undefined,
      locations: Array.isArray(setting.locations) ? setting.locations : undefined
    };
  }

  /**
   * Validate adventure characters
   */
  private validateAdventureCharacters(characters: any): AdventureDetails['characters'] {
    if (!characters || typeof characters !== 'object') {
      throw new Error('Invalid adventure characters structure');
    }

    const validatedKeyNpcs = Array.isArray(characters.key_npcs) 
      ? characters.key_npcs.map((npc: any) => this.validateAdventureNpc(npc))
      : [];

    return {
      player_role: typeof characters.player_role === 'string' ? characters.player_role : '',
      key_npcs: validatedKeyNpcs,
      relationships: Array.isArray(characters.relationships) ? characters.relationships : undefined
    };
  }

  /**
   * Validate individual adventure NPC
   */
  private validateAdventureNpc(npc: any): AdventureDetails['characters']['key_npcs'][0] {
    if (!npc || typeof npc !== 'object') {
      return {
        id: 'npc_' + Date.now(),
        name: 'Unknown Character',
        description: 'A mysterious figure',
        relationship: 'neutral',
        traits: [],
        importance: 'minor',
        relationships: []
      };
    }

    return {
      id: typeof npc.id === 'string' ? npc.id : 'npc_' + Date.now(),
      name: typeof npc.name === 'string' ? npc.name : 'Unknown Character',
      description: typeof npc.description === 'string' ? npc.description : 'A mysterious figure',
      relationship: typeof npc.relationship === 'string' ? npc.relationship : 'neutral',
      personality: typeof npc.personality === 'string' ? npc.personality : undefined,
      goals: typeof npc.goals === 'string' ? npc.goals : undefined,
      traits: Array.isArray(npc.traits) ? npc.traits.filter((trait: any) => typeof trait === 'string') : [],
      backstory: typeof npc.backstory === 'string' ? npc.backstory : undefined,
      importance: ['major', 'minor', 'background'].includes(npc.importance) ? npc.importance : 'minor',
      templateId: typeof npc.templateId === 'string' ? npc.templateId : undefined,
      relationships: Array.isArray(npc.relationships) ? npc.relationships.map((rel: any) => this.validateNpcRelationship(rel)) : []
    };
  }

  /**
   * Validate NPC relationship
   */
  private validateNpcRelationship(relationship: any): AdventureDetails['characters']['key_npcs'][0]['relationships'][0] {
    if (!relationship || typeof relationship !== 'object') {
      return {
        targetNpcId: '',
        type: 'neutral',
        description: 'A relationship',
        strength: 5
      };
    }

    return {
      targetNpcId: typeof relationship.targetNpcId === 'string' ? relationship.targetNpcId : '',
      type: ['ally', 'enemy', 'neutral', 'family', 'romantic', 'rival'].includes(relationship.type) ? relationship.type : 'neutral',
      description: typeof relationship.description === 'string' ? relationship.description : 'A relationship',
      strength: typeof relationship.strength === 'number' && relationship.strength >= 1 && relationship.strength <= 10 ? relationship.strength : 5
    };
  }

  /**
   * Validate adventure plot
   */
  private validateAdventurePlot(plot: any): AdventureDetails['plot'] {
    if (!plot || typeof plot !== 'object') {
      throw new Error('Invalid adventure plot structure');
    }

    return {
      main_objective: typeof plot.main_objective === 'string' ? plot.main_objective : '',
      secondary_goals: Array.isArray(plot.secondary_goals) 
        ? plot.secondary_goals.filter((goal: any) => typeof goal === 'string') 
        : [],
      plot_hooks: Array.isArray(plot.plot_hooks) 
        ? plot.plot_hooks.filter((hook: any) => typeof hook === 'string') 
        : [],
      victory_conditions: typeof plot.victory_conditions === 'string' ? plot.victory_conditions : '',
      estimated_turns: typeof plot.estimated_turns === 'number' ? plot.estimated_turns : undefined,
      themes: Array.isArray(plot.themes) 
        ? plot.themes.filter((theme: any) => typeof theme === 'string') 
        : undefined
    };
  }

  /**
   * Validate style preferences
   */
  private validateStylePreferences(stylePrefs: any): AdventureDetails['style_preferences'] {
    if (!stylePrefs || typeof stylePrefs !== 'object') {
      return {
        tone: 'serious',
        complexity: 'moderate',
        pacing: 'moderate'
      };
    }

    return {
      tone: ['serious', 'humorous', 'dramatic', 'mixed'].includes(stylePrefs.tone) ? stylePrefs.tone : 'serious',
      complexity: ['simple', 'moderate', 'complex'].includes(stylePrefs.complexity) ? stylePrefs.complexity : 'moderate',
      pacing: ['slow', 'moderate', 'fast'].includes(stylePrefs.pacing) ? stylePrefs.pacing : 'moderate'
    };
  }

  /**
   * Extract information from raw AI response using intelligent parsing
   */
  private extractInfoFromRawResponse(rawResponse: string, context: GameContext): NarrationResponse | null {
    try {
      const extracted: Partial<NarrationResponse> = {};
      
      // Try to extract JSON from markdown code blocks first
      const jsonMatch = rawResponse.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          return this.validateNarrationResponse(parsed, context);
        } catch (e) {
          // If JSON parsing fails, continue with regex extraction
        }
      }
      
      // Extract narration (everything if no clear structure)
      extracted.narration = rawResponse.trim();
      
      // Try to extract quick actions from common patterns
      const actionPatterns = [
        /Actions?:\s*([^\n]+)/i,
        /Options?:\s*([^\n]+)/i,
        /You can:\s*([^\n]+)/i
      ];
      
      for (const pattern of actionPatterns) {
        const match = rawResponse.match(pattern);
        if (match) {
          // Try to parse as list
          const actions = match[1].split(/[,;]|\band\b/).map(action => action.trim());
          if (actions.length > 0) {
            extracted.quick_actions = actions.slice(0, 3); // Limit to 3 actions
            break;
          }
        }
      }
      
      // Create a basic validated response
      const basicResponse: any = {
        narration: extracted.narration || `You are in ${context.worldState.location}. What would you like to do?`,
        image_prompt: `${context.worldState.location}, ${context.genre} scene`,
        quick_actions: extracted.quick_actions || ['Look around', 'Continue'],
        state_changes: {}
      };
      
      return this.validateNarrationResponse(basicResponse, context);
    } catch (error) {
      logger.warn('Failed to extract info from raw response:', error);
      return null;
    }
  }

  /**
   * Extract adventure details from raw AI response
   */
  private extractAdventureDetailsFromRawResponse(rawResponse: string): AdventureDetails | null {
    try {
      // Try to extract JSON from markdown code blocks first
      const jsonMatch = rawResponse.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          return this.validateAdventureDetails(parsed);
        } catch (e) {
          // If JSON parsing fails, return null
          return null;
        }
      }
      
      // If no JSON found in code blocks, return null
      return null;
    } catch (error) {
      logger.warn('Failed to extract adventure details from raw response:', error);
      return null;
    }
  }

  /**
   * Generate speech from text using OpenAI TTS
   */
  async generateSpeech(text: string, voice: string, speed: number = 1.0, quality: 'standard' | 'high' = 'standard'): Promise<Buffer> {
    if (!this.openai.apiKey) {
      throw new CustomError('OpenAI API key not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    // Validate text length
    if (!text || text.length > 4096) {
      throw new CustomError('Text must be between 1 and 4096 characters', HTTP_STATUS.BAD_REQUEST);
    }

    // Validate voice
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    if (!validVoices.includes(voice)) {
      throw new CustomError(`Invalid voice. Valid voices: ${validVoices.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
    }

    // Validate speed
    if (speed < 0.25 || speed > 4.0) {
      throw new CustomError('Speed must be between 0.25 and 4.0', HTTP_STATUS.BAD_REQUEST);
    }

    try {
      const model = quality === 'high' ? 'tts-1-hd' : 'tts-1';
      const response_format = quality === 'high' ? 'flac' : 'mp3';

      const response = await this.openai.audio.speech.create({
        model: model,
        voice: voice as any,
        input: text,
        speed: speed,
        response_format: response_format
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer;
    } catch (error: any) {
      logger.error('TTS generation error:', error);
      throw new CustomError('Failed to generate speech', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get available voices for TTS
   */
  getAvailableVoices(): Array<{id: string, name: string, gender: string}> {
    return [
      {id: 'alloy', name: 'Alloy', gender: 'neutral'},
      {id: 'echo', name: 'Echo', gender: 'male'},
      {id: 'fable', name: 'Fable', gender: 'male'},
      {id: 'onyx', name: 'Onyx', gender: 'male'},
      {id: 'nova', name: 'Nova', gender: 'female'},
      {id: 'shimmer', name: 'Shimmer', gender: 'female'}
    ];
  }

  /**
   * Validate TTS request text
   */
  validateTTSRequest(text: string): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }
    
    // Check length
    if (text.length > 4096) {
      return false;
    }
    
    // Check for empty or whitespace-only text
    if (text.trim().length === 0) {
      return false;
    }
    
    return true;
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
      // Use the direct model method to avoid recursion
      const config: ImageGenerationConfig = { model: 'dall-e-3', size: '1024x1024', quality: 'standard', style: 'vivid', enhancementLevel: 'detailed' };
      return await this.generateImageWithModel(randomPrompt, style, undefined, config);
    } catch (error) {
      logger.error('Fallback image generation also failed:', error);
      // Return a placeholder image URL or empty string
      return '';
    }
  }
}

export const openAIService = new OpenAIService();