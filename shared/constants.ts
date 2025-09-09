export const API_ENDPOINTS = {
  NEW_GAME: '/api/new-game',
  NEW_CUSTOM_GAME: '/api/new-custom-game',
  NEW_PROMPT_GAME: '/api/new-prompt-game',
  TURN: '/api/turn',
  LOAD_GAME: '/api/game',
  SAVE_GAME: '/api/save-game',
  SAVED_GAMES: '/api/saved-games',
  VALIDATE_ADVENTURE: '/api/validate-adventure',
  ADVENTURE_SUGGESTIONS: '/api/adventure-suggestions',
  SAVE_ADVENTURE_TEMPLATE: '/api/save-adventure-template',
  ADVENTURE_TEMPLATES: '/api/adventure-templates',
  GENERATE_IMAGE: '/api/generate-image',
} as const;

export const GENRES = {
  FANTASY: 'fantasy',
  SCI_FI: 'sci-fi',
  HORROR: 'horror',
  MODERN: 'modern',
  CUSTOM: 'custom',
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
  MISSING_TOKEN: 'Authentication token missing',
} as const;

export const VALIDATION_RULES = {
  MAX_INPUT_LENGTH: 500,
  MIN_INPUT_LENGTH: 1,
  MAX_SAVE_NAME_LENGTH: 50,
  MIN_SAVE_NAME_LENGTH: 1,
  MAX_TURNS_PER_SESSION: 1000,
  // Custom Adventure Validation
  MAX_TITLE_LENGTH: 100,
  MIN_TITLE_LENGTH: 3,
  MAX_DESCRIPTION_LENGTH: 1000,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_WORLD_DESCRIPTION_LENGTH: 2000,
  MIN_WORLD_DESCRIPTION_LENGTH: 50,
  MAX_NPC_COUNT: 10,
  MIN_NPC_COUNT: 0,
  MAX_SECONDARY_GOALS: 5,
  MAX_PLOT_HOOKS: 8,
  MAX_TAGS: 10,
} as const;

export const RATE_LIMITS = {
  REQUESTS_PER_MINUTE: 30,
  WINDOW_MS: 60000,
} as const;

export const ADVENTURE_TONES = {
  SERIOUS: 'serious',
  HUMOROUS: 'humorous',
  DRAMATIC: 'dramatic',
  MIXED: 'mixed',
} as const;

export const ADVENTURE_COMPLEXITY = {
  SIMPLE: 'simple',
  MODERATE: 'moderate',
  COMPLEX: 'complex',
} as const;

export const ADVENTURE_PACING = {
  SLOW: 'slow',
  MODERATE: 'moderate',
  FAST: 'fast',
} as const;

export const ADVENTURE_CATEGORIES = {
  ACTION: 'action',
  MYSTERY: 'mystery',
  ROMANCE: 'romance',
  THRILLER: 'thriller',
  COMEDY: 'comedy',
  DRAMA: 'drama',
  SURVIVAL: 'survival',
  EXPLORATION: 'exploration',
} as const;

export const TIME_PERIODS = {
  PREHISTORIC: 'prehistoric',
  ANCIENT: 'ancient',
  MEDIEVAL: 'medieval',
  RENAISSANCE: 'renaissance',
  INDUSTRIAL: 'industrial',
  MODERN: 'modern',
  NEAR_FUTURE: 'near_future',
  FAR_FUTURE: 'far_future',
  POST_APOCALYPTIC: 'post_apocalyptic',
  CUSTOM: 'custom',
} as const;