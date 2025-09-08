import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { gameEngine } from '../services/gameEngine';
import { CustomAdventureValidator, AdventureSuggestionService } from '../services/customAdventureValidator';
import { AuthRequest } from '../middleware/auth';
import { CustomError, asyncHandler } from '../middleware/errorHandler';
import { HTTP_STATUS, ERROR_MESSAGES, GENRES, IMAGE_STYLES, STYLE_PREFERENCES } from '../../../shared/constants';
import { 
  NewGameRequest, 
  TurnRequest,
  SaveGameRequest,
  CustomAdventureRequest,
  PromptAdventureRequest,
  AdventureDetails
} from '../../../shared/types';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     NewGameRequest:
 *       type: object
 *       required:
 *         - genre
 *         - style_preference
 *         - image_style
 *       properties:
 *         genre:
 *           type: string
 *           enum: [fantasy, sci-fi, horror, modern]
 *         style_preference:
 *           type: string
 *           enum: [detailed, concise]
 *         image_style:
 *           type: string
 *           enum: [fantasy_art, comic_book, painterly]
 */

/**
 * @swagger
 * /api/new-game:
 *   post:
 *     summary: Create a new game session
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewGameRequest'
 *     responses:
 *       201:
 *         description: New game session created
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.post('/new-game', [
  body('genre')
    .isIn(Object.values(GENRES))
    .withMessage('Invalid genre'),
  body('style_preference')
    .isIn(Object.values(STYLE_PREFERENCES))
    .withMessage('Invalid style preference'),
  body('image_style')
    .isIn(Object.values(IMAGE_STYLES))
    .withMessage('Invalid image style'),
  body('safety_filter')
    .optional()
    .isBoolean()
    .withMessage('Safety filter must be a boolean'),
  body('content_rating')
    .optional()
    .isIn(['PG-13', 'R'])
    .withMessage('Content rating must be PG-13 or R'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', HTTP_STATUS.BAD_REQUEST);
  }

  if (!req.user) {
    throw new CustomError(ERROR_MESSAGES.UNAUTHORIZED_ACCESS, HTTP_STATUS.UNAUTHORIZED);
  }

  const newGameRequest: NewGameRequest = req.body;
  const result = await gameEngine.createNewGame(newGameRequest, req.user.id);

  res.status(HTTP_STATUS.CREATED).json(result);
}));

/**
 * @swagger
 * /api/turn:
 *   post:
 *     summary: Process a player turn
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - session_id
 *               - player_input
 *             properties:
 *               session_id:
 *                 type: string
 *               player_input:
 *                 type: string
 *                 maxLength: 500
 *               context:
 *                 type: object
 *                 properties:
 *                   previous_turn_id:
 *                     type: string
 *                   retry_count:
 *                     type: integer
 *                     default: 0
 *     responses:
 *       200:
 *         description: Turn processed successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Session not found
 */
router.post('/turn', [
  body('session_id')
    .notEmpty()
    .withMessage('Session ID is required'),
  body('player_input')
    .isLength({ min: 1, max: 500 })
    .withMessage('Player input must be between 1 and 500 characters'),
  body('context.retry_count')
    .optional()
    .isInt({ min: 0, max: 3 })
    .withMessage('Retry count must be between 0 and 3'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', HTTP_STATUS.BAD_REQUEST);
  }

  if (!req.user) {
    throw new CustomError(ERROR_MESSAGES.UNAUTHORIZED_ACCESS, HTTP_STATUS.UNAUTHORIZED);
  }

  const turnRequest: TurnRequest = {
    session_id: req.body.session_id,
    player_input: req.body.player_input,
    context: {
      previous_turn_id: req.body.context?.previous_turn_id,
      retry_count: req.body.context?.retry_count || 0
    }
  };

  const result = await gameEngine.processTurn(turnRequest, req.user.id);

  res.status(HTTP_STATUS.OK).json(result);
}));

/**
 * @swagger
 * /api/game/{sessionId}:
 *   get:
 *     summary: Load an existing game session
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Game session data
 *       404:
 *         description: Session not found
 */
router.get('/game/:sessionId', [
  param('sessionId')
    .notEmpty()
    .withMessage('Session ID is required'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', HTTP_STATUS.BAD_REQUEST);
  }

  if (!req.user) {
    throw new CustomError(ERROR_MESSAGES.UNAUTHORIZED_ACCESS, HTTP_STATUS.UNAUTHORIZED);
  }

  const result = await gameEngine.loadGame(req.params.sessionId, req.user.id);

  res.status(HTTP_STATUS.OK).json(result);
}));

/**
 * @swagger
 * /api/save-game:
 *   post:
 *     summary: Save current game progress
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - session_id
 *               - save_name
 *             properties:
 *               session_id:
 *                 type: string
 *               save_name:
 *                 type: string
 *                 maxLength: 50
 *     responses:
 *       201:
 *         description: Game saved successfully
 *       400:
 *         description: Invalid save data
 *       404:
 *         description: Session not found
 */
router.post('/save-game', [
  body('session_id')
    .notEmpty()
    .withMessage('Session ID is required'),
  body('save_name')
    .isLength({ min: 1, max: 50 })
    .withMessage('Save name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Save name contains invalid characters'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', HTTP_STATUS.BAD_REQUEST);
  }

  if (!req.user) {
    throw new CustomError(ERROR_MESSAGES.UNAUTHORIZED_ACCESS, HTTP_STATUS.UNAUTHORIZED);
  }

  const saveRequest: SaveGameRequest = {
    session_id: req.body.session_id,
    save_name: req.body.save_name
  };

  const result = await gameEngine.saveGame(saveRequest, req.user.id);

  res.status(HTTP_STATUS.CREATED).json(result);
}));

/**
 * @swagger
 * /api/saved-games:
 *   get:
 *     summary: Get list of saved games
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved games
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 saves:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       save_id:
 *                         type: string
 *                       save_name:
 *                         type: string
 *                       session_id:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       turn_count:
 *                         type: integer
 *                       preview_image:
 *                         type: string
 */
router.get('/saved-games', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new CustomError(ERROR_MESSAGES.UNAUTHORIZED_ACCESS, HTTP_STATUS.UNAUTHORIZED);
  }

  const result = await gameEngine.getSavedGames(req.user.id);

  res.status(HTTP_STATUS.OK).json(result);
}));

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: Get user's active game sessions
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active sessions
 */
router.get('/sessions', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new CustomError(ERROR_MESSAGES.UNAUTHORIZED_ACCESS, HTTP_STATUS.UNAUTHORIZED);
  }

  // This would typically return a summary of active sessions
  // For now, we'll implement a basic version
  const { GameSession } = await import('../models');
  
  const sessions = await GameSession.find({ user_id: req.user.id })
    .select('session_id metadata.last_played metadata.total_turns world_state.location')
    .sort({ 'metadata.last_played': -1 })
    .limit(10);

  const result = sessions.map(session => ({
    session_id: session.session_id,
    last_played: session.metadata.last_played.toISOString(),
    total_turns: session.metadata.total_turns,
    current_location: session.world_state.location
  }));

  res.status(HTTP_STATUS.OK).json({ sessions: result });
}));

/**
 * @swagger
 * /api/new-custom-game:
 *   post:
 *     summary: Create a new custom adventure game session
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - genre
 *               - style_preference
 *               - image_style
 *               - adventure_details
 *             properties:
 *               genre:
 *                 type: string
 *                 enum: [custom]
 *               style_preference:
 *                 type: string
 *                 enum: [detailed, concise]
 *               image_style:
 *                 type: string
 *                 enum: [fantasy_art, comic_book, painterly]
 *               adventure_details:
 *                 type: object
 *     responses:
 *       201:
 *         description: Custom adventure session created
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.post('/new-custom-game', [
  body('genre')
    .equals('custom')
    .withMessage('Genre must be "custom" for custom adventures'),
  body('style_preference')
    .isIn(Object.values(STYLE_PREFERENCES))
    .withMessage('Invalid style preference'),
  body('image_style')
    .isIn(Object.values(IMAGE_STYLES))
    .withMessage('Invalid image style'),
  body('adventure_details')
    .isObject()
    .withMessage('Adventure details are required'),
  body('adventure_details.title')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('adventure_details.description')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('safety_filter')
    .optional()
    .isBoolean()
    .withMessage('Safety filter must be a boolean'),
  body('content_rating')
    .optional()
    .isIn(['PG-13', 'R'])
    .withMessage('Content rating must be PG-13 or R'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', HTTP_STATUS.BAD_REQUEST);
  }

  if (!req.user) {
    throw new CustomError(ERROR_MESSAGES.UNAUTHORIZED_ACCESS, HTTP_STATUS.UNAUTHORIZED);
  }

  const customAdventureRequest: CustomAdventureRequest = req.body;
  const result = await gameEngine.createCustomGame(customAdventureRequest, req.user.id);

  res.status(HTTP_STATUS.CREATED).json(result);
}));

/**
 * @swagger
 * /api/new-prompt-game:
 *   post:
 *     summary: Create a new adventure from a custom prompt
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *               style_preference:
 *                 type: string
 *                 enum: [detailed, concise]
 *               image_style:
 *                 type: string
 *                 enum: [fantasy_art, comic_book, painterly]
 *     responses:
 *       201:
 *         description: Prompt-based adventure session created
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.post('/new-prompt-game', [
  body('prompt')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Prompt is required and must be between 1 and 1000 characters'),
  body('style_preference')
    .optional()
    .isIn(Object.values(STYLE_PREFERENCES))
    .withMessage('Invalid style preference'),
  body('image_style')
    .optional()
    .isIn(Object.values(IMAGE_STYLES))
    .withMessage('Invalid image style'),
  body('safety_filter')
    .optional()
    .isBoolean()
    .withMessage('Safety filter must be a boolean'),
  body('content_rating')
    .optional()
    .isIn(['PG-13', 'R'])
    .withMessage('Content rating must be PG-13 or R'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', HTTP_STATUS.BAD_REQUEST);
  }

  if (!req.user) {
    throw new CustomError(ERROR_MESSAGES.UNAUTHORIZED_ACCESS, HTTP_STATUS.UNAUTHORIZED);
  }

  const promptRequest: PromptAdventureRequest = req.body;
  const result = await gameEngine.createCustomGameFromPrompt(promptRequest, req.user.id);

  res.status(HTTP_STATUS.CREATED).json(result);
}));

/**
 * @swagger
 * /api/validate-adventure:
 *   post:
 *     summary: Validate custom adventure details
 *     tags: [Adventure]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adventure_details:
 *                 type: object
 *     responses:
 *       200:
 *         description: Validation results
 *       400:
 *         description: Invalid request
 */
router.post('/validate-adventure', [
  body('adventure_details')
    .isObject()
    .withMessage('Adventure details are required')
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', HTTP_STATUS.BAD_REQUEST);
  }

  if (!req.user) {
    throw new CustomError(ERROR_MESSAGES.UNAUTHORIZED_ACCESS, HTTP_STATUS.UNAUTHORIZED);
  }

  const adventureDetails: AdventureDetails = req.body.adventure_details;
  const validation = CustomAdventureValidator.validateAdventureDetails(adventureDetails);

  res.status(HTTP_STATUS.OK).json(validation);
}));

/**
 * @swagger
 * /api/adventure-suggestions:
 *   post:
 *     summary: Get AI-powered suggestions for adventure creation
 *     tags: [Adventure]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               partial_adventure:
 *                 type: object
 *     responses:
 *       200:
 *         description: Adventure suggestions
 *       500:
 *         description: Server error
 */
router.post('/adventure-suggestions', [
  body('partial_adventure')
    .optional()
    .isObject()
    .withMessage('Partial adventure must be an object')
], asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new CustomError(ERROR_MESSAGES.UNAUTHORIZED_ACCESS, HTTP_STATUS.UNAUTHORIZED);
  }

  const partialAdventure = req.body.partial_adventure || {};
  const suggestions = await AdventureSuggestionService.generateSuggestions(partialAdventure);

  res.status(HTTP_STATUS.OK).json({ suggestions });
}));

/**
 * @swagger
 * /api/user-adventures:
 *   get:
 *     summary: Get user's custom adventures
 *     tags: [Adventure]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's custom adventures
 */
router.get('/user-adventures', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new CustomError(ERROR_MESSAGES.UNAUTHORIZED_ACCESS, HTTP_STATUS.UNAUTHORIZED);
  }

  const result = await gameEngine.getUserCustomAdventures(req.user.id);

  res.status(HTTP_STATUS.OK).json(result);
}));

/**
 * @swagger
 * /api/adventure-templates:
 *   get:
 *     summary: Get public adventure templates
 *     tags: [Adventure]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Maximum number of templates to return
 *     responses:
 *       200:
 *         description: Public adventure templates
 */
router.get('/adventure-templates', asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const result = await gameEngine.getPublicAdventureTemplates(limit);

  res.status(HTTP_STATUS.OK).json(result);
}));

/**
 * @swagger
 * /api/save-adventure-template:
 *   post:
 *     summary: Save adventure as public template
 *     tags: [Adventure]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adventure_id
 *             properties:
 *               adventure_id:
 *                 type: string
 *               is_public:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Adventure saved as template
 *       404:
 *         description: Adventure not found
 */
router.post('/save-adventure-template', [
  body('adventure_id')
    .notEmpty()
    .withMessage('Adventure ID is required'),
  body('is_public')
    .optional()
    .isBoolean()
    .withMessage('is_public must be a boolean')
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', HTTP_STATUS.BAD_REQUEST);
  }

  if (!req.user) {
    throw new CustomError(ERROR_MESSAGES.UNAUTHORIZED_ACCESS, HTTP_STATUS.UNAUTHORIZED);
  }

  const { adventure_id, is_public = false } = req.body;
  const result = await gameEngine.saveAdventureAsTemplate(adventure_id, req.user.id, is_public);

  res.status(HTTP_STATUS.OK).json(result);
}));

/**
 * @swagger
 * /api/create-from-template/{templateId}:
 *   post:
 *     summary: Create new game from adventure template
 *     tags: [Adventure]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - style_preference
 *               - image_style
 *             properties:
 *               style_preference:
 *                 type: string
 *                 enum: [detailed, concise]
 *               image_style:
 *                 type: string
 *                 enum: [fantasy_art, comic_book, painterly]
 *     responses:
 *       201:
 *         description: Game created from template
 *       404:
 *         description: Template not found
 */
router.post('/create-from-template/:templateId', [
  param('templateId')
    .notEmpty()
    .withMessage('Template ID is required'),
  body('style_preference')
    .isIn(Object.values(STYLE_PREFERENCES))
    .withMessage('Invalid style preference'),
  body('image_style')
    .isIn(Object.values(IMAGE_STYLES))
    .withMessage('Invalid image style'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', HTTP_STATUS.BAD_REQUEST);
  }

  if (!req.user) {
    throw new CustomError(ERROR_MESSAGES.UNAUTHORIZED_ACCESS, HTTP_STATUS.UNAUTHORIZED);
  }

  const templateId = req.params.templateId;
  const gameRequest: NewGameRequest = {
    genre: 'custom',
    style_preference: req.body.style_preference,
    image_style: req.body.image_style,
    safety_filter: req.body.safety_filter,
    content_rating: req.body.content_rating
  };

  const result = await gameEngine.createGameFromTemplate(templateId, gameRequest, req.user.id);

  res.status(HTTP_STATUS.CREATED).json(result);
}));

export default router;