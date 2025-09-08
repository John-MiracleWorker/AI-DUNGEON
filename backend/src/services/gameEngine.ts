import { GameSession, SavedGame, CustomAdventure } from '../models';
import { openAIService, GameContext } from './openAIService';
import { CustomAdventureValidator } from './customAdventureValidator';
import { logger } from '../utils/logger';
import { CustomError } from '../middleware/errorHandler';
import { HTTP_STATUS, ERROR_MESSAGES, VALIDATION_RULES } from '../../../shared/constants';
import { 
  NewGameRequest, 
  NewGameResponse, 
  TurnRequest, 
  TurnResponse, 
  WorldState, 
  Turn,
  SaveGameRequest,
  SavedGamesResponse,
  CustomAdventureRequest,
  CustomAdventureResponse,
  PromptAdventureRequest,
  AdventureDetails
} from '../../../shared/types';
import { 
  validatePlayerInput, 
  validateSaveName, 
  sanitizeInput, 
  generateSessionId, 
  generateTurnId,
  calculateProcessingTime 
} from '../../../shared/utils';
import { ImageEnhancementService } from './imageEnhancementService';

class GameEngine {
  private imageEnhancementService = new ImageEnhancementService();
  
  async createNewGame(request: NewGameRequest, userId: string): Promise<NewGameResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('Creating new game', { userId, genre: request.genre, imageStyle: request.image_style });
      
      const sessionId = generateSessionId();
      
      // Create initial world state
      const initialWorldState: WorldState = {
        location: this.getStartingLocation(request.genre),
        inventory: [],
        npcs: [],
        flags: {},
        current_chapter: 'Prologue'
      };

      // Generate prologue using AI
      const gameContext: GameContext = {
        genre: request.genre,
        worldState: initialWorldState,
        recentHistory: [],
        playerInput: 'BEGIN_ADVENTURE',
        sessionId
      };

      logger.info('Generating prologue with AI', { sessionId, userId });
      const prologueResponse = await openAIService.generateNarration(gameContext);
      logger.info('Prologue generated successfully', { sessionId, userId, responseLength: prologueResponse.narration.length });
      
      // Generate initial image with enhanced fallback and retry mechanism
      let imageUrl = '';
      let imageError: any = null;
      try {
        logger.info('Generating prologue image', { sessionId, userId, imagePrompt: prologueResponse.image_prompt });
        const imageResult = await this.imageEnhancementService.getCachedOrGenerateImage(
          prologueResponse.image_prompt, 
          request.image_style,
          (prompt, style, config) => openAIService.generateImage(prompt, style, undefined, config)
        );
        imageUrl = imageResult.url;
        imageError = imageResult.error;
        logger.info('Prologue image generated', { sessionId, userId, imageUrl: imageUrl ? 'success' : 'failed' });
      } catch (error: any) {
        logger.warn('Failed to generate prologue image:', { error: error.message || error, sessionId, userId });
      }

      // Create initial turn
      const initialTurn: Turn = {
        turn_id: generateTurnId(),
        turn_number: 0,
        player_input: 'START',
        narration: prologueResponse.narration,
        image_prompt: prologueResponse.image_prompt,
        image_url: imageUrl,
        quick_actions: prologueResponse.quick_actions,
        world_state_snapshot: { ...initialWorldState },
        timestamp: new Date(),
        processing_metadata: {
          ai_response_time: 0,
          image_generation_time: 0,
          tokens_used: 0
        }
      };

      // Apply any state changes from prologue
      const updatedWorldState = this.applyStateChanges(
        initialWorldState, 
        prologueResponse.state_changes
      );

      // Create and save game session
      const gameSession = new GameSession({
        session_id: sessionId,
        user_id: userId,
        world_state: updatedWorldState,
        turn_history: [initialTurn],
        metadata: {
          genre: request.genre,
          image_style: request.image_style,
          created_at: new Date(),
          last_played: new Date(),
          total_turns: 1
        },
        settings: {
          difficulty: 'normal',
          safety_filter: request.safety_filter ?? false
        },
        adventure_type: 'preset'
      });

      await gameSession.save();
      logger.info('Game session saved to database', { sessionId, userId });

      const processingTime = calculateProcessingTime(startTime);
      logger.info(`New game created successfully in ${processingTime}ms for user ${userId}`, { sessionId, processingTime });

      return {
        session_id: sessionId,
        prologue: {
          narration: prologueResponse.narration,
          image_url: imageUrl,
          quick_actions: prologueResponse.quick_actions
        },
        world_state: updatedWorldState
      };

    } catch (error: any) {
      logger.error('Failed to create new game:', { 
        error: error.message || String(error), 
        stack: error.stack,
        userId,
        request: { 
          genre: request.genre, 
          imageStyle: request.image_style 
        }
      });
      throw error;
    }
  }

  /**
   * Create a new custom adventure game
   */
  async createCustomGame(request: CustomAdventureRequest, userId: string): Promise<CustomAdventureResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('Creating custom adventure', { 
        userId, 
        title: request.adventure_details.title,
        imageStyle: request.image_style 
      });
      
      // Validate the custom adventure request
      const validation = CustomAdventureValidator.validateCustomAdventureRequest(request);
      if (!validation.isValid) {
        logger.warn('Custom adventure validation failed', { 
          userId, 
          errors: validation.errors 
        });
        throw new CustomError(
          `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`, 
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Sanitize adventure content
      const sanitizedDetails = CustomAdventureValidator.sanitizeAdventureContent(request.adventure_details);
      
      // Ensure all required fields are present
      if (!sanitizedDetails.title || !sanitizedDetails.description) {
        logger.warn('Missing required adventure details', { 
          userId, 
          hasTitle: !!sanitizedDetails.title,
          hasDescription: !!sanitizedDetails.description
        });
        throw new CustomError('Missing required adventure details', HTTP_STATUS.BAD_REQUEST);
      }
      
      const sessionId = generateSessionId();
      const adventureId = `adv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Save the custom adventure
      const customAdventure = new CustomAdventure({
        adventure_id: adventureId,
        user_id: userId,
        title: sanitizedDetails.title,
        description: sanitizedDetails.description,
        setting: sanitizedDetails.setting,
        characters: sanitizedDetails.characters,
        plot: sanitizedDetails.plot,
        style_preferences: sanitizedDetails.style_preferences,
        created_at: new Date(),
        is_template: false,
        usage_count: 1
      });

      await customAdventure.save();
      logger.info('Custom adventure saved to database', { adventureId, userId });

      // Create initial world state based on custom adventure
      const initialWorldState: WorldState = {
        location: this.getCustomStartingLocation(sanitizedDetails),
        inventory: this.getCustomStartingInventory(sanitizedDetails),
        npcs: [],
        flags: { adventure_id: adventureId },
        current_chapter: 'Prologue'
      };

      // Generate custom prologue using AI
      logger.info('Generating custom adventure prologue with AI', { adventureId, userId });
      const prologueResponse = await openAIService.generateCustomPrologue(sanitizedDetails);
      logger.info('Custom adventure prologue generated', { 
        adventureId, 
        userId, 
        responseLength: prologueResponse.narration.length 
      });
      
      // Generate initial image with enhanced fallback and retry mechanism
      let imageUrl = '';
      let imageError: any = null;
      try {
        logger.info('Generating custom adventure prologue image', { 
          adventureId, 
          userId, 
          imagePrompt: prologueResponse.image_prompt 
        });
        const imageResult = await this.imageEnhancementService.getCachedOrGenerateImage(
          prologueResponse.image_prompt, 
          request.image_style,
          (prompt, style, config) => openAIService.generateImage(prompt, style, sanitizedDetails, config)
        );
        imageUrl = imageResult.url;
        imageError = imageResult.error;
        logger.info('Custom adventure prologue image generated', { 
          adventureId, 
          userId, 
          imageUrl: imageUrl ? 'success' : 'failed' 
        });
      } catch (error: any) {
        logger.warn('Failed to generate custom adventure prologue image:', { 
          error: error.message || String(error), 
          adventureId, 
          userId 
        });
      }

      // Create initial turn
      const initialTurn: Turn = {
        turn_id: generateTurnId(),
        turn_number: 0,
        player_input: 'START',
        narration: prologueResponse.narration,
        image_prompt: prologueResponse.image_prompt,
        image_url: imageUrl,
        quick_actions: prologueResponse.quick_actions,
        world_state_snapshot: { ...initialWorldState },
        timestamp: new Date(),
        processing_metadata: {
          ai_response_time: 0,
          image_generation_time: 0,
          tokens_used: 0
        }
      };

      // Apply any state changes from prologue
      const updatedWorldState = this.applyStateChanges(
        initialWorldState, 
        prologueResponse.state_changes
      );

      // Create and save custom game session
      const gameSession = new GameSession({
        session_id: sessionId,
        user_id: userId,
        world_state: updatedWorldState,
        turn_history: [initialTurn],
        metadata: {
          genre: 'custom',
          image_style: request.image_style,
          created_at: new Date(),
          last_played: new Date(),
          total_turns: 1
        },
        settings: {
          difficulty: 'normal',
          safety_filter: request.safety_filter ?? false
        },
        adventure_type: 'custom',
        custom_adventure: {
          adventure_id: adventureId,
          original_details: sanitizedDetails,
          adaptive_elements: {
            discovered_locations: [],
            met_npcs: [],
            completed_objectives: [],
            story_branches: [],
            unlocked_plot_hooks: []
          }
        }
      });

      await gameSession.save();
      logger.info('Custom game session saved to database', { sessionId, adventureId, userId });

      const processingTime = calculateProcessingTime(startTime);
      logger.info(`Custom adventure created successfully in ${processingTime}ms for user ${userId}`, { 
        sessionId, 
        adventureId, 
        processingTime 
      });

      return {
        adventure_id: adventureId,
        session_id: sessionId,
        prologue: {
          narration: prologueResponse.narration,
          image_url: imageUrl,
          quick_actions: prologueResponse.quick_actions
        },
        world_state: updatedWorldState
      };

    } catch (error: any) {
      logger.error('Failed to create custom adventure:', { 
        error: error.message || String(error), 
        stack: error.stack,
        userId
      });
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to create custom adventure', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  async createCustomGameFromPrompt(request: PromptAdventureRequest, userId: string): Promise<CustomAdventureResponse> {
    try {
      logger.info('Creating custom game from prompt', { 
        userId, 
        promptLength: request.prompt.length 
      });
      
      const adventureDetails = await openAIService.generateAdventureFromPrompt(request.prompt);
      logger.info('Adventure details generated from prompt', { 
        userId, 
        title: adventureDetails.title,
        descriptionLength: adventureDetails.description.length 
      });
      
      const customRequest: CustomAdventureRequest = {
        genre: 'custom',
        style_preference: request.style_preference || 'detailed',
        image_style: request.image_style || 'fantasy_art',
        safety_filter: request.safety_filter,
        content_rating: request.content_rating,
        adventure_details: adventureDetails
      };
      
      return this.createCustomGame(customRequest, userId);
    } catch (error: any) {
      logger.error('Failed to create custom game from prompt:', {
        error: error.message || String(error),
        stack: error.stack,
        userId,
        prompt: request.prompt.substring(0, 100) + '...' // Log first 100 chars only
      });
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to generate adventure from prompt', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  async processTurn(request: TurnRequest, userId: string): Promise<TurnResponse> {
    const startTime = Date.now();

    try {
      // Validate input
      const validation = validatePlayerInput(request.player_input);
      if (!validation.isValid) {
        throw new CustomError(validation.error || ERROR_MESSAGES.INVALID_INPUT, HTTP_STATUS.BAD_REQUEST);
      }

      // Load game session
      const gameSession = await GameSession.findOne({ 
        session_id: request.session_id,
        user_id: userId 
      });

      if (!gameSession) {
        throw new CustomError(ERROR_MESSAGES.SESSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      // Check turn limit
      if (gameSession.turn_history.length >= VALIDATION_RULES.MAX_TURNS_PER_SESSION) {
        throw new CustomError('Maximum turns reached for this session', HTTP_STATUS.BAD_REQUEST);
      }

      // Sanitize input
      const sanitizedInput = sanitizeInput(request.player_input);

      // Content moderation
      if (gameSession.settings.safety_filter) {
        const isContentSafe = await openAIService.moderateContent(sanitizedInput);
        if (!isContentSafe) {
          throw new CustomError('Input contains inappropriate content', HTTP_STATUS.BAD_REQUEST);
        }
      }

      // Build context for AI
      const gameContext: GameContext = {
        genre: gameSession.metadata.genre,
        worldState: gameSession.world_state,
        recentHistory: gameSession.turn_history.slice(-5), // Last 5 turns
        playerInput: sanitizedInput,
        sessionId: request.session_id,
        adventureDetails: gameSession.adventure_type === 'custom' ? 
          gameSession.custom_adventure?.original_details : undefined,
        adaptiveElements: gameSession.adventure_type === 'custom' ? 
          gameSession.custom_adventure?.adaptive_elements : undefined
      };

      // Generate AI response
      const aiStartTime = Date.now();
      const aiResponse = await openAIService.generateNarration(gameContext);
      const aiResponseTime = calculateProcessingTime(aiStartTime);

      // Generate image with enhanced fallback and retry mechanism
      let imageUrl = '';
      let imageError: any = null;
      let imageGenerationTime = 0;
      try {
        const imageStartTime = Date.now();
        const adventureDetails = gameSession.adventure_type === 'custom' ? 
          gameSession.custom_adventure?.original_details : undefined;
        const imageResult = await this.imageEnhancementService.getCachedOrGenerateImage(
          aiResponse.image_prompt,
          gameSession.metadata.image_style,
          (prompt, style, config) => openAIService.generateImage(prompt, style, adventureDetails, config)
        );
        imageUrl = imageResult.url;
        imageError = imageResult.error;
        imageGenerationTime = calculateProcessingTime(imageStartTime);
      } catch (error) {
        logger.warn('Failed to generate turn image:', error);
      }

      // Apply state changes
      const updatedWorldState = gameSession.adventure_type === 'custom' ?
        await this.applyStateChangesWithTracking(gameSession.world_state, aiResponse.state_changes, gameSession) :
        this.applyStateChanges(gameSession.world_state, aiResponse.state_changes);

      // Create new turn
      const newTurn: Turn = {
        turn_id: generateTurnId(),
        turn_number: gameSession.turn_history.length,
        player_input: sanitizedInput,
        narration: aiResponse.narration,
        image_prompt: aiResponse.image_prompt,
        image_url: imageUrl,
        quick_actions: aiResponse.quick_actions,
        world_state_snapshot: { ...updatedWorldState },
        timestamp: new Date(),
        processing_metadata: {
          ai_response_time: aiResponseTime,
          image_generation_time: imageGenerationTime,
          tokens_used: 0 // Would need to track from OpenAI response
        }
      };

      // Update game session
      gameSession.world_state = updatedWorldState;
      gameSession.turn_history.push(newTurn);
      gameSession.metadata.total_turns = gameSession.turn_history.length;
      gameSession.metadata.last_played = new Date();

      await gameSession.save();

      const totalProcessingTime = calculateProcessingTime(startTime);
      logger.info(`Turn processed in ${totalProcessingTime}ms for session ${request.session_id}`);

      // Prepare response
      const worldStateChanges = this.calculateWorldStateChanges(
        gameSession.turn_history[gameSession.turn_history.length - 2]?.world_state_snapshot,
        updatedWorldState
      );

      return {
        turn_id: newTurn.turn_id,
        narration: aiResponse.narration,
        image_url: imageUrl,
        image_error: imageError,
        quick_actions: aiResponse.quick_actions,
        world_state_changes: worldStateChanges,
        metadata: {
          turn_number: newTurn.turn_number,
          timestamp: newTurn.timestamp.toISOString(),
          processing_time_ms: totalProcessingTime
        }
      };

    } catch (error: any) {
      logger.error('Failed to process turn:', error.message || String(error));
      throw error;
    }
  }

  async loadGame(sessionId: string, userId: string) {
    try {
      const gameSession = await GameSession.findOne({
        session_id: sessionId,
        user_id: userId
      });

      if (!gameSession) {
        throw new CustomError(ERROR_MESSAGES.SESSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      // Update last played timestamp
      gameSession.metadata.last_played = new Date();
      await gameSession.save();

      return {
        session_id: gameSession.session_id,
        world_state: gameSession.world_state,
        turn_history: gameSession.turn_history,
        metadata: {
          created_at: gameSession.metadata.created_at.toISOString(),
          last_played: gameSession.metadata.last_played.toISOString(),
          total_turns: gameSession.metadata.total_turns
        }
      };

    } catch (error: any) {
      logger.error('Failed to load game:', error.message || String(error));
      throw error;
    }
  }

  async saveGame(request: SaveGameRequest, userId: string) {
    try {
      // Validate save name
      const validation = validateSaveName(request.save_name);
      if (!validation.isValid) {
        throw new CustomError(validation.error || 'Invalid save name', HTTP_STATUS.BAD_REQUEST);
      }

      // Load current session
      const gameSession = await GameSession.findOne({
        session_id: request.session_id,
        user_id: userId
      });

      if (!gameSession) {
        throw new CustomError(ERROR_MESSAGES.SESSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      // Create save record
      const saveId = generateSessionId(); // Reuse function for unique ID
      const savedGame = new SavedGame({
        save_id: saveId,
        save_name: request.save_name.trim(),
        session_id: request.session_id,
        user_id: userId,
        created_at: new Date(),
        turn_count: gameSession.turn_history.length,
        preview_image: gameSession.turn_history[gameSession.turn_history.length - 1]?.image_url || '',
        session_snapshot: gameSession.toObject()
      });

      await savedGame.save();

      logger.info(`Game saved as "${request.save_name}" for user ${userId}`);

      return {
        save_id: saveId,
        message: 'Game saved successfully'
      };

    } catch (error: any) {
      if (error.code === 11000) {
        throw new CustomError('A save with this name already exists', HTTP_STATUS.BAD_REQUEST);
      }
      logger.error('Failed to save game:', error.message || String(error));
      throw error;
    }
  }

  async getSavedGames(userId: string): Promise<SavedGamesResponse> {
    try {
      const savedGames = await SavedGame.find({ user_id: userId })
        .sort({ created_at: -1 })
        .limit(50);

      return {
        saves: savedGames.map(save => ({
          save_id: save.save_id,
          save_name: save.save_name,
          session_id: save.session_id,
          created_at: save.created_at.toISOString(),
          turn_count: save.turn_count,
          preview_image: save.preview_image
        }))
      };

    } catch (error: any) {
      logger.error('Failed to get saved games:', error.message || String(error));
      throw error;
    }
  }

  private getStartingLocation(genre: string): string {
    const locations = {
      fantasy: 'A misty crossroads where ancient stone paths meet beneath towering oak trees',
      'sci-fi': 'A sterile white corridor aboard a massive space station',
      horror: 'A dimly lit Victorian mansion foyer with creaking floorboards',
      modern: 'A bustling city street corner during the evening rush hour',
      custom: 'The beginning of your custom adventure'
    };

    return locations[genre as keyof typeof locations] || locations.fantasy;
  }

  /**
   * Get starting location for custom adventure
   */
  private getCustomStartingLocation(adventureDetails: AdventureDetails): string {
    // Extract a suitable starting location from the adventure details
    const { setting, plot } = adventureDetails;
    
    // Try to derive from setting or use a generic opening based on environment
    if (setting.locations && setting.locations.length > 0) {
      return setting.locations[0];
    }
    
    // Generate based on environment and world description
    const environment = setting.environment.toLowerCase();
    const worldDesc = setting.world_description.toLowerCase();
    
    if (environment.includes('city') || worldDesc.includes('urban')) {
      return `A bustling area in the heart of ${setting.environment}`;
    } else if (environment.includes('forest') || worldDesc.includes('woods')) {
      return `A forest clearing in ${setting.environment}`;
    } else if (environment.includes('dungeon') || worldDesc.includes('underground')) {
      return `The entrance to ${setting.environment}`;
    } else if (environment.includes('tavern') || environment.includes('inn')) {
      return `Inside ${setting.environment}`;
    } else {
      return `At the beginning of your journey in ${setting.environment}`;
    }
  }

  /**
   * Get starting inventory for custom adventure
   */
  private getCustomStartingInventory(adventureDetails: AdventureDetails): string[] {
    const { characters, setting } = adventureDetails;
    const inventory: string[] = [];
    
    // Add basic items based on player role
    const role = characters.player_role.toLowerCase();
    
    if (role.includes('warrior') || role.includes('fighter') || role.includes('soldier')) {
      inventory.push('sword', 'leather armor');
    } else if (role.includes('mage') || role.includes('wizard') || role.includes('sorcerer')) {
      inventory.push('spellbook', 'staff', 'magic pouch');
    } else if (role.includes('rogue') || role.includes('thief') || role.includes('assassin')) {
      inventory.push('lockpicks', 'daggers', 'hood');
    } else if (role.includes('ranger') || role.includes('hunter') || role.includes('scout')) {
      inventory.push('bow', 'arrows', 'rope');
    } else if (role.includes('cleric') || role.includes('priest') || role.includes('healer')) {
      inventory.push('holy symbol', 'healing herbs', 'prayer beads');
    } else if (role.includes('merchant') || role.includes('trader')) {
      inventory.push('coin purse', 'trade goods', 'ledger');
    }
    
    // Add environment-specific items
    const environment = setting.environment.toLowerCase();
    if (environment.includes('cold') || environment.includes('winter') || environment.includes('snow')) {
      inventory.push('warm cloak');
    } else if (environment.includes('desert') || environment.includes('hot')) {
      inventory.push('water flask');
    } else if (environment.includes('underwater') || environment.includes('ship')) {
      inventory.push('waterproof pack');
    }
    
    // Limit to 3-5 starting items
    return inventory.slice(0, Math.min(5, inventory.length));
  }

  /**
   * Apply state changes and optionally track custom adventure progress
   */
  private async applyStateChangesWithTracking(currentState: WorldState, changes: any, gameSession?: any): Promise<WorldState> {
    const newState = { ...currentState };

    if (changes.location) {
      newState.location = changes.location;
      
      // Track discovered locations for custom adventures
      if (gameSession?.adventure_type === 'custom' && gameSession.custom_adventure) {
        await gameSession.addDiscoveredLocation(changes.location);
      }
    }

    if (changes.inventory && Array.isArray(changes.inventory)) {
      // Ensure inventory is always an array
      if (!Array.isArray(newState.inventory)) {
        newState.inventory = [];
      }
      newState.inventory = [...newState.inventory, ...changes.inventory];
    }

    if (changes.flags) {
      newState.flags = { ...newState.flags, ...changes.flags };
      
      // Track objectives and story progress for custom adventures
      if (gameSession?.adventure_type === 'custom' && gameSession.custom_adventure) {
        // Check for objective completion flags
        for (const [key, value] of Object.entries(changes.flags)) {
          if (key.includes('objective') && value === 'complete') {
            await gameSession.completeObjective(key);
          }
        }
      }
    }

    return newState;
  }

  /**
   * Apply state changes (synchronous version for backward compatibility)
   */
  private applyStateChanges(currentState: WorldState, changes: any): WorldState {
    const newState = { ...currentState };

    if (changes.location) {
      newState.location = changes.location;
    }

    if (changes.inventory && Array.isArray(changes.inventory)) {
      // Ensure inventory is always an array
      if (!Array.isArray(newState.inventory)) {
        newState.inventory = [];
      }
      newState.inventory = [...newState.inventory, ...changes.inventory];
    }

    if (changes.flags) {
      newState.flags = { ...newState.flags, ...changes.flags };
    }

    return newState;
  }

  private calculateWorldStateChanges(previousState: WorldState | undefined, currentState: WorldState) {
    // Ensure inventories are always arrays
    const currentInventory = Array.isArray(currentState.inventory) ? currentState.inventory : [];
    
    if (!previousState) {
      return {
        location: currentState.location,
        inventory_changes: {
          added: currentInventory,
          removed: []
        },
        flags_updated: currentState.flags
      };
    }

    const previousInventory = Array.isArray(previousState.inventory) ? previousState.inventory : [];
    const addedItems = currentInventory.filter(item => !previousInventory.includes(item));
    const removedItems = previousInventory.filter(item => !currentInventory.includes(item));

    const flagsUpdated: Record<string, any> = {};
    for (const [key, value] of Object.entries(currentState.flags)) {
      if (previousState.flags[key] !== value) {
        flagsUpdated[key] = value;
      }
    }

    return {
      location: currentState.location !== previousState.location ? currentState.location : undefined,
      inventory_changes: {
        added: addedItems,
        removed: removedItems
      },
      flags_updated: flagsUpdated
    };
  }

  /**
   * Get user's custom adventures
   */
  async getUserCustomAdventures(userId: string) {
    try {
      const adventures = await CustomAdventure.findByUserId(userId);
      
      return {
        adventures: adventures.map((adventure: any) => ({
          adventure_id: adventure.adventure_id,
          title: adventure.title,
          description: adventure.description,
          created_at: adventure.created_at.toISOString(),
          usage_count: adventure.usage_count,
          is_template: adventure.is_template,
          tags: adventure.tags || []
        }))
      };
    } catch (error) {
      logger.error('Failed to get user custom adventures:', error);
      throw error;
    }
  }

  /**
   * Save adventure as template
   */
  async saveAdventureAsTemplate(adventureId: string, userId: string, isPublic: boolean = false) {
    try {
      const adventure = await CustomAdventure.findOne({
        adventure_id: adventureId,
        user_id: userId
      });
      
      if (!adventure) {
        throw new CustomError('Adventure not found', HTTP_STATUS.NOT_FOUND);
      }
      
      adventure.is_template = true;
      adventure.is_public = isPublic;
      await adventure.save();
      
      logger.info(`Adventure ${adventureId} saved as template by user ${userId}`);
      
      return {
        message: 'Adventure saved as template successfully',
        template_id: adventure.adventure_id
      };
    } catch (error) {
      logger.error('Failed to save adventure as template:', error);
      throw error;
    }
  }

  /**
   * Get public adventure templates
   */
  async getPublicAdventureTemplates(limit: number = 20) {
    try {
      const templates = await CustomAdventure.findPublicTemplates(limit);
      
      return {
        templates: templates.map((template: any) => ({
          adventure_id: template.adventure_id,
          title: template.title,
          description: template.description,
          usage_count: template.usage_count,
          created_at: template.created_at.toISOString(),
          tags: template.tags || [],
          estimated_duration: template.estimatedDuration
        }))
      };
    } catch (error) {
      logger.error('Failed to get public adventure templates:', error);
      throw error;
    }
  }

  /**
   * Create game from template
   */
  async createGameFromTemplate(templateId: string, request: NewGameRequest, userId: string): Promise<CustomAdventureResponse> {
    try {
      const template = await CustomAdventure.findOne({
        adventure_id: templateId,
        is_template: true
      });
      
      if (!template) {
        throw new CustomError('Template not found', HTTP_STATUS.NOT_FOUND);
      }
      
      // Increment usage count
      await template.incrementUsage();
      
      // Create custom adventure request from template
      const customRequest: CustomAdventureRequest = {
        ...request,
        genre: 'custom',
        adventure_details: {
          title: template.title,
          description: template.description,
          setting: template.setting,
          characters: template.characters,
          plot: template.plot,
          style_preferences: template.style_preferences
        }
      };
      
      return this.createCustomGame(customRequest, userId);
    } catch (error) {
      logger.error('Failed to create game from template:', error);
      throw error;
    }
  }
}

export const gameEngine = new GameEngine();