export const API_ENDPOINTS = {
  NEW_GAME: '/api/new-game',
  TURN: '/api/turn',
  LOAD_GAME: '/api/game',
  SAVE_GAME: '/api/save-game',
  SAVED_GAMES: '/api/saved-games',
} as const;

export const GENRES = {
  FANTASY: 'fantasy',
  SCI_FI: 'sci-fi',
  HORROR: 'horror',
  MODERN: 'modern',
} as const;

export const IMAGE_STYLES = {
  FANTASY_ART: 'fantasy_art',
  COMIC_BOOK: 'comic_book',
  PAINTERLY: 'painterly',
} as const;

export const STYLE_PREFERENCES = {
  DETAILED: 'detailed',
  CONCISE: 'concise',
} as const;

export const GAME_SETTINGS = {
  DIFFICULTY: {
    EASY: 'easy',
    NORMAL: 'normal',
    HARD: 'hard',
  },
  SAFETY_FILTER: {
    ENABLED: true,
    DISABLED: false,
  },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  SESSION_NOT_FOUND: 'Game session not found',
  INVALID_INPUT: 'Invalid input provided',
  AI_SERVICE_ERROR: 'AI service temporarily unavailable',
  IMAGE_GENERATION_ERROR: 'Image generation failed',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded, please try again later',
  UNAUTHORIZED_ACCESS: 'Unauthorized access',
  INVALID_TOKEN: 'Invalid or expired token',
} as const;

export const VALIDATION_RULES = {
  MAX_INPUT_LENGTH: 500,
  MIN_INPUT_LENGTH: 1,
  MAX_SAVE_NAME_LENGTH: 50,
  MIN_SAVE_NAME_LENGTH: 1,
  MAX_TURNS_PER_SESSION: 1000,
} as const;

export const RATE_LIMITS = {
  REQUESTS_PER_MINUTE: 30,
  WINDOW_MS: 60000,
} as const;