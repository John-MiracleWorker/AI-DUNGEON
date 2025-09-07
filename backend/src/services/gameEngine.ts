import { GameSession, SavedGame } from '../models';
import { openAIService, GameContext } from './openAIService';
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
  SavedGamesResponse 
} from '../../../shared/types';
import { 
  validatePlayerInput, 
  validateSaveName, 
  sanitizeInput, 
  generateSessionId, 
  generateTurnId,
  calculateProcessingTime 
} from '../../../shared/utils';

class GameEngine {
  async createNewGame(request: NewGameRequest, userId: string): Promise<NewGameResponse> {
    const startTime = Date.now();
    
    try {
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

      const prologueResponse = await openAIService.generateNarration(gameContext);
      
      // Generate initial image
      let imageUrl = '';
      try {
        imageUrl = await openAIService.generateImage(
          prologueResponse.image_prompt, 
          request.image_style
        );
      } catch (error) {
        logger.warn('Failed to generate prologue image:', error);
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
        }
      });

      await gameSession.save();

      const processingTime = calculateProcessingTime(startTime);
      logger.info(`New game created in ${processingTime}ms for user ${userId}`);

      return {
        session_id: sessionId,
        prologue: {
          narration: prologueResponse.narration,
          image_url: imageUrl,
          quick_actions: prologueResponse.quick_actions
        },
        world_state: updatedWorldState
      };

    } catch (error) {
      logger.error('Failed to create new game:', error);
      throw error;
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
        sessionId: request.session_id
      };

      // Generate AI response
      const aiStartTime = Date.now();
      const aiResponse = await openAIService.generateNarration(gameContext);
      const aiResponseTime = calculateProcessingTime(aiStartTime);

      // Generate image
      let imageUrl = '';
      let imageGenerationTime = 0;
      try {
        const imageStartTime = Date.now();
        imageUrl = await openAIService.generateImage(
          aiResponse.image_prompt,
          gameSession.metadata.image_style
        );
        imageGenerationTime = calculateProcessingTime(imageStartTime);
      } catch (error) {
        logger.warn('Failed to generate turn image:', error);
      }

      // Apply state changes
      const updatedWorldState = this.applyStateChanges(
        gameSession.world_state,
        aiResponse.state_changes
      );

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
        quick_actions: aiResponse.quick_actions,
        world_state_changes: worldStateChanges,
        metadata: {
          turn_number: newTurn.turn_number,
          timestamp: newTurn.timestamp.toISOString(),
          processing_time_ms: totalProcessingTime
        }
      };

    } catch (error) {
      logger.error('Failed to process turn:', error);
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

    } catch (error) {
      logger.error('Failed to load game:', error);
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
      logger.error('Failed to save game:', error);
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

    } catch (error) {
      logger.error('Failed to get saved games:', error);
      throw error;
    }
  }

  private getStartingLocation(genre: string): string {
    const locations = {
      fantasy: 'A misty crossroads where ancient stone paths meet beneath towering oak trees',
      'sci-fi': 'A sterile white corridor aboard a massive space station',
      horror: 'A dimly lit Victorian mansion foyer with creaking floorboards',
      modern: 'A bustling city street corner during the evening rush hour'
    };

    return locations[genre as keyof typeof locations] || locations.fantasy;
  }

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
}

export const gameEngine = new GameEngine();