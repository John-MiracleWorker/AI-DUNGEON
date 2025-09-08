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

      // Parse the JSON response from AI
      let parsedResponse: NarrationResponse;
      try {
        parsedResponse = JSON.parse(aiResponse);
        
        // Validate and sanitize the response structure
        if (!parsedResponse.narration) {
          parsedResponse.narration = aiResponse;
        }
        if (!parsedResponse.image_prompt) {
          parsedResponse.image_prompt = `${context.worldState.location}, ${context.genre} scene`;
        }
        if (!Array.isArray(parsedResponse.quick_actions)) {
          parsedResponse.quick_actions = ['Look around', 'Continue'];
        }
        if (!parsedResponse.state_changes) {
          parsedResponse.state_changes = {};
        }
        
        // Ensure inventory in state_changes is always an array if present
        if (parsedResponse.state_changes.inventory && !Array.isArray(parsedResponse.state_changes.inventory)) {
          logger.warn('AI returned non-array inventory, converting to array:', parsedResponse.state_changes.inventory);
          parsedResponse.state_changes.inventory = [];
        }
        
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

      if (error.status === 429) {
        throw new CustomError(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED, HTTP_STATUS.TOO_MANY_REQUESTS);
      }

      if (error.status === 401) {
        throw new CustomError('Invalid OpenAI API key', HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }

      throw new CustomError(ERROR_MESSAGES.AI_SERVICE_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Generate custom adventure prologue
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
        
        // Validate prologue response
        if (!parsedResponse.narration) {
          throw new Error('Prologue missing narration');
        }
        if (!parsedResponse.image_prompt) {
          parsedResponse.image_prompt = `${adventureDetails.setting.world_description}, opening scene`;
        }
        if (!Array.isArray(parsedResponse.quick_actions)) {
          parsedResponse.quick_actions = ['Look around', 'Continue', 'Examine surroundings'];
        }
        if (!parsedResponse.state_changes) {
          parsedResponse.state_changes = {};
        }
        
      } catch (parseError) {
        logger.error('Failed to parse custom prologue response:', aiResponse);
        throw new Error('Invalid prologue response format');
      }

      const processingTime = Date.now() - startTime;
      logger.info(`Custom adventure prologue generated in ${processingTime}ms`);

      return parsedResponse;

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      logger.error(`Custom prologue generation failed after ${processingTime}ms:`, error);

      if (error.status === 429) {
        throw new CustomError(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED, HTTP_STATUS.TOO_MANY_REQUESTS);
      }

      if (error.status === 401) {
        throw new CustomError('Invalid OpenAI API key', HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }

      throw new CustomError(ERROR_MESSAGES.AI_SERVICE_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
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
        size: imageConfig.size as any,
        response_format: 'url'
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
      size: config.size as any,
      response_format: 'url'
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
        style: config.style,
        response_format: 'url'
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