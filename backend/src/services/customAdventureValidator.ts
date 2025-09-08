import { 
  AdventureDetails, 
  AdventureValidationResult, 
  ValidationError,
  AdventureSuggestion,
  CustomAdventureRequest 
} from '../../../shared/types';
import { 
  VALIDATION_RULES, 
  ADVENTURE_TONES, 
  ADVENTURE_COMPLEXITY, 
  ADVENTURE_PACING,
  TIME_PERIODS 
} from '../../../shared/constants';
import { logger } from '../utils/logger';

export class CustomAdventureValidator {
  
  /**
   * Validates complete adventure details
   */
  static validateAdventureDetails(details: AdventureDetails): AdventureValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate basic info
    const basicErrors = this.validateBasicInfo(details);
    errors.push(...basicErrors);

    // Validate setting
    const settingErrors = this.validateSetting(details.setting);
    errors.push(...settingErrors);

    // Validate characters
    const characterErrors = this.validateCharacters(details.characters);
    errors.push(...characterErrors);

    // Validate plot
    const plotErrors = this.validatePlot(details.plot);
    errors.push(...plotErrors);

    // Validate style preferences
    const styleErrors = this.validateStylePreferences(details.style_preferences);
    errors.push(...styleErrors);

    // Generate warnings and suggestions
    this.generateWarningsAndSuggestions(details, warnings, suggestions);

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  /**
   * Validates basic adventure information
   */
  private static validateBasicInfo(details: AdventureDetails): ValidationError[] {
    const errors: ValidationError[] = [];

    // Title validation
    if (!details.title || details.title.trim().length === 0) {
      errors.push({
        field: 'title',
        message: 'Adventure title is required',
        code: 'TITLE_REQUIRED'
      });
    } else if (details.title.length < VALIDATION_RULES.MIN_TITLE_LENGTH) {
      errors.push({
        field: 'title',
        message: `Title must be at least ${VALIDATION_RULES.MIN_TITLE_LENGTH} characters`,
        code: 'TITLE_TOO_SHORT'
      });
    } else if (details.title.length > VALIDATION_RULES.MAX_TITLE_LENGTH) {
      errors.push({
        field: 'title',
        message: `Title must not exceed ${VALIDATION_RULES.MAX_TITLE_LENGTH} characters`,
        code: 'TITLE_TOO_LONG'
      });
    }

    // Description validation
    if (!details.description || details.description.trim().length === 0) {
      errors.push({
        field: 'description',
        message: 'Adventure description is required',
        code: 'DESCRIPTION_REQUIRED'
      });
    } else if (details.description.length < VALIDATION_RULES.MIN_DESCRIPTION_LENGTH) {
      errors.push({
        field: 'description',
        message: `Description must be at least ${VALIDATION_RULES.MIN_DESCRIPTION_LENGTH} characters`,
        code: 'DESCRIPTION_TOO_SHORT'
      });
    } else if (details.description.length > VALIDATION_RULES.MAX_DESCRIPTION_LENGTH) {
      errors.push({
        field: 'description',
        message: `Description must not exceed ${VALIDATION_RULES.MAX_DESCRIPTION_LENGTH} characters`,
        code: 'DESCRIPTION_TOO_LONG'
      });
    }

    return errors;
  }

  /**
   * Validates adventure setting
   */
  private static validateSetting(setting: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // World description validation
    if (!setting.world_description || setting.world_description.trim().length === 0) {
      errors.push({
        field: 'setting.world_description',
        message: 'World description is required',
        code: 'WORLD_DESCRIPTION_REQUIRED'
      });
    } else if (setting.world_description.length < VALIDATION_RULES.MIN_WORLD_DESCRIPTION_LENGTH) {
      errors.push({
        field: 'setting.world_description',
        message: `World description must be at least ${VALIDATION_RULES.MIN_WORLD_DESCRIPTION_LENGTH} characters`,
        code: 'WORLD_DESCRIPTION_TOO_SHORT'
      });
    } else if (setting.world_description.length > VALIDATION_RULES.MAX_WORLD_DESCRIPTION_LENGTH) {
      errors.push({
        field: 'setting.world_description',
        message: `World description must not exceed ${VALIDATION_RULES.MAX_WORLD_DESCRIPTION_LENGTH} characters`,
        code: 'WORLD_DESCRIPTION_TOO_LONG'
      });
    }

    // Time period validation
    if (!setting.time_period) {
      errors.push({
        field: 'setting.time_period',
        message: 'Time period is required',
        code: 'TIME_PERIOD_REQUIRED'
      });
    } else if (!Object.values(TIME_PERIODS).includes(setting.time_period)) {
      errors.push({
        field: 'setting.time_period',
        message: 'Invalid time period',
        code: 'TIME_PERIOD_INVALID'
      });
    }

    // Environment validation
    if (!setting.environment || setting.environment.trim().length === 0) {
      errors.push({
        field: 'setting.environment',
        message: 'Environment description is required',
        code: 'ENVIRONMENT_REQUIRED'
      });
    } else if (setting.environment.length > 500) {
      errors.push({
        field: 'setting.environment',
        message: 'Environment description must not exceed 500 characters',
        code: 'ENVIRONMENT_TOO_LONG'
      });
    }

    return errors;
  }

  /**
   * Validates adventure characters
   */
  private static validateCharacters(characters: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Player role validation
    if (!characters.player_role || characters.player_role.trim().length === 0) {
      errors.push({
        field: 'characters.player_role',
        message: 'Player role description is required',
        code: 'PLAYER_ROLE_REQUIRED'
      });
    } else if (characters.player_role.length > 300) {
      errors.push({
        field: 'characters.player_role',
        message: 'Player role description must not exceed 300 characters',
        code: 'PLAYER_ROLE_TOO_LONG'
      });
    }

    // NPCs validation
    if (characters.key_npcs && characters.key_npcs.length > VALIDATION_RULES.MAX_NPC_COUNT) {
      errors.push({
        field: 'characters.key_npcs',
        message: `Maximum ${VALIDATION_RULES.MAX_NPC_COUNT} NPCs allowed`,
        code: 'TOO_MANY_NPCS'
      });
    }

    // Validate individual NPCs
    if (characters.key_npcs) {
      characters.key_npcs.forEach((npc: any, index: number) => {
        if (!npc.name || npc.name.trim().length === 0) {
          errors.push({
            field: `characters.key_npcs[${index}].name`,
            message: 'NPC name is required',
            code: 'NPC_NAME_REQUIRED'
          });
        }

        if (!npc.description || npc.description.trim().length === 0) {
          errors.push({
            field: `characters.key_npcs[${index}].description`,
            message: 'NPC description is required',
            code: 'NPC_DESCRIPTION_REQUIRED'
          });
        }

        if (!npc.relationship || npc.relationship.trim().length === 0) {
          errors.push({
            field: `characters.key_npcs[${index}].relationship`,
            message: 'NPC relationship to player is required',
            code: 'NPC_RELATIONSHIP_REQUIRED'
          });
        }
      });
    }

    return errors;
  }

  /**
   * Validates adventure plot
   */
  private static validatePlot(plot: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Main objective validation
    if (!plot.main_objective || plot.main_objective.trim().length === 0) {
      errors.push({
        field: 'plot.main_objective',
        message: 'Main objective is required',
        code: 'MAIN_OBJECTIVE_REQUIRED'
      });
    } else if (plot.main_objective.length > 500) {
      errors.push({
        field: 'plot.main_objective',
        message: 'Main objective must not exceed 500 characters',
        code: 'MAIN_OBJECTIVE_TOO_LONG'
      });
    }

    // Victory conditions validation
    if (!plot.victory_conditions || plot.victory_conditions.trim().length === 0) {
      errors.push({
        field: 'plot.victory_conditions',
        message: 'Victory conditions are required',
        code: 'VICTORY_CONDITIONS_REQUIRED'
      });
    } else if (plot.victory_conditions.length > 400) {
      errors.push({
        field: 'plot.victory_conditions',
        message: 'Victory conditions must not exceed 400 characters',
        code: 'VICTORY_CONDITIONS_TOO_LONG'
      });
    }

    // Secondary goals validation
    if (plot.secondary_goals && plot.secondary_goals.length > VALIDATION_RULES.MAX_SECONDARY_GOALS) {
      errors.push({
        field: 'plot.secondary_goals',
        message: `Maximum ${VALIDATION_RULES.MAX_SECONDARY_GOALS} secondary goals allowed`,
        code: 'TOO_MANY_SECONDARY_GOALS'
      });
    }

    // Plot hooks validation
    if (plot.plot_hooks && plot.plot_hooks.length > VALIDATION_RULES.MAX_PLOT_HOOKS) {
      errors.push({
        field: 'plot.plot_hooks',
        message: `Maximum ${VALIDATION_RULES.MAX_PLOT_HOOKS} plot hooks allowed`,
        code: 'TOO_MANY_PLOT_HOOKS'
      });
    }

    return errors;
  }

  /**
   * Validates style preferences
   */
  private static validateStylePreferences(stylePrefs: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!stylePrefs.tone || !Object.values(ADVENTURE_TONES).includes(stylePrefs.tone)) {
      errors.push({
        field: 'style_preferences.tone',
        message: 'Valid tone selection is required',
        code: 'TONE_INVALID'
      });
    }

    if (!stylePrefs.complexity || !Object.values(ADVENTURE_COMPLEXITY).includes(stylePrefs.complexity)) {
      errors.push({
        field: 'style_preferences.complexity',
        message: 'Valid complexity selection is required',
        code: 'COMPLEXITY_INVALID'
      });
    }

    if (!stylePrefs.pacing || !Object.values(ADVENTURE_PACING).includes(stylePrefs.pacing)) {
      errors.push({
        field: 'style_preferences.pacing',
        message: 'Valid pacing selection is required',
        code: 'PACING_INVALID'
      });
    }

    return errors;
  }

  /**
   * Generates warnings and suggestions for improvement
   */
  private static generateWarningsAndSuggestions(
    details: AdventureDetails, 
    warnings: string[], 
    suggestions: string[]
  ): void {
    // Check for potential issues
    if (details.characters.key_npcs && details.characters.key_npcs.length === 0) {
      warnings.push('No NPCs defined - consider adding some characters for richer storytelling');
      suggestions.push('Add at least 1-2 key NPCs to make the adventure more engaging');
    }

    if (details.plot.secondary_goals && details.plot.secondary_goals.length === 0) {
      warnings.push('No secondary goals defined - this may limit gameplay depth');
      suggestions.push('Consider adding 2-3 secondary objectives to provide multiple paths');
    }

    if (details.plot.plot_hooks && details.plot.plot_hooks.length < 2) {
      suggestions.push('Add more plot hooks to give the AI more creative directions');
    }

    if (details.setting.world_description.length < 100) {
      suggestions.push('Consider expanding the world description for richer AI generation');
    }

    // Check for complexity mismatch
    if (details.style_preferences.complexity === 'simple' && 
        details.characters.key_npcs && details.characters.key_npcs.length > 3) {
      warnings.push('Many NPCs with simple complexity may create inconsistencies');
    }

    if (details.style_preferences.pacing === 'fast' && 
        details.plot.estimated_turns && details.plot.estimated_turns > 50) {
      warnings.push('Fast pacing with many turns may feel inconsistent');
    }
  }

  /**
   * Sanitizes adventure content
   */
  static sanitizeAdventureContent(details: AdventureDetails): AdventureDetails {
    const sanitized = JSON.parse(JSON.stringify(details)); // Deep clone

    // Sanitize text fields
    sanitized.title = this.sanitizeText(sanitized.title);
    sanitized.description = this.sanitizeText(sanitized.description);
    sanitized.setting.world_description = this.sanitizeText(sanitized.setting.world_description);
    sanitized.setting.environment = this.sanitizeText(sanitized.setting.environment);
    
    if (sanitized.setting.special_rules) {
      sanitized.setting.special_rules = this.sanitizeText(sanitized.setting.special_rules);
    }

    sanitized.characters.player_role = this.sanitizeText(sanitized.characters.player_role);
    
    if (sanitized.characters.key_npcs) {
      sanitized.characters.key_npcs = sanitized.characters.key_npcs.map((npc: any) => ({
        ...npc,
        name: this.sanitizeText(npc.name),
        description: this.sanitizeText(npc.description),
        relationship: this.sanitizeText(npc.relationship),
        personality: npc.personality ? this.sanitizeText(npc.personality) : npc.personality,
        goals: npc.goals ? this.sanitizeText(npc.goals) : npc.goals,
      }));
    }

    sanitized.plot.main_objective = this.sanitizeText(sanitized.plot.main_objective);
    sanitized.plot.victory_conditions = this.sanitizeText(sanitized.plot.victory_conditions);
    
    if (sanitized.plot.secondary_goals) {
      sanitized.plot.secondary_goals = sanitized.plot.secondary_goals.map((goal: string) => 
        this.sanitizeText(goal)
      );
    }
    
    if (sanitized.plot.plot_hooks) {
      sanitized.plot.plot_hooks = sanitized.plot.plot_hooks.map((hook: string) => 
        this.sanitizeText(hook)
      );
    }

    return sanitized;
  }

  /**
   * Sanitizes individual text fields
   */
  private static sanitizeText(text: string): string {
    if (!text) return text;
    
    return text
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: schemes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[\u0000-\u001f\u007f-\u009f]/g, ''); // Remove control characters
  }

  /**
   * Validates custom adventure request
   */
  static validateCustomAdventureRequest(request: CustomAdventureRequest): AdventureValidationResult {
    const errors: ValidationError[] = [];

    // Validate base game request fields
    if (!request.genre || request.genre !== 'custom') {
      errors.push({
        field: 'genre',
        message: 'Genre must be "custom" for custom adventures',
        code: 'INVALID_GENRE'
      });
    }

    if (!request.adventure_details) {
      errors.push({
        field: 'adventure_details',
        message: 'Adventure details are required',
        code: 'ADVENTURE_DETAILS_REQUIRED'
      });
      
      return { isValid: false, errors };
    }

    // Validate adventure details
    const detailsValidation = this.validateAdventureDetails(request.adventure_details);
    errors.push(...detailsValidation.errors);

    return {
      isValid: errors.length === 0,
      errors,
      warnings: detailsValidation.warnings,
      suggestions: detailsValidation.suggestions
    };
  }
}

/**
 * Adventure suggestion service
 */
export class AdventureSuggestionService {
  
  /**
   * Generates suggestions based on partial adventure data
   */
  static async generateSuggestions(
    partial: Partial<AdventureDetails>
  ): Promise<AdventureSuggestion[]> {
    const suggestions: AdventureSuggestion[] = [];

    try {
      // Generate setting suggestions
      if (!partial.setting?.world_description || partial.setting.world_description.length < 50) {
        suggestions.push({
          category: 'setting',
          field: 'world_description',
          suggestions: [
            'A mystical realm where magic and technology coexist',
            'A post-apocalyptic wasteland with hidden underground cities',
            'A floating island chain connected by ancient sky bridges',
            'A bustling medieval port city with dark secrets'
          ],
          reasoning: 'Rich world descriptions help the AI generate more immersive content'
        });
      }

      // Generate character suggestions
      if (!partial.characters?.key_npcs || partial.characters.key_npcs.length === 0) {
        suggestions.push({
          category: 'character',
          field: 'key_npcs',
          suggestions: [
            'A mysterious mentor with hidden knowledge',
            'A rival who becomes an ally through the journey',
            'A local guide with secrets of their own',
            'An ancient guardian protecting something valuable'
          ],
          reasoning: 'NPCs create opportunities for dialogue and plot development'
        });
      }

      // Generate plot suggestions
      if (!partial.plot?.secondary_goals || partial.plot.secondary_goals.length === 0) {
        suggestions.push({
          category: 'plot',
          field: 'secondary_goals',
          suggestions: [
            'Discover the true history of the world',
            'Form alliances with different factions',
            'Collect ancient artifacts or knowledge',
            'Rescue someone important along the way'
          ],
          reasoning: 'Secondary goals provide alternative paths and replay value'
        });
      }

      return suggestions;
    } catch (error) {
      logger.error('Failed to generate adventure suggestions:', error);
      return [];
    }
  }
}

export { CustomAdventureValidator as default };