import { openAIService } from '../openAIService';
import { CustomAdventureValidator } from '../customAdventureValidator';
import { VALIDATION_RULES } from '../../../../shared/constants';

describe('OpenAI Service - Fallback Adventure Generation', () => {
  it('provides a fallback adventure that passes validation when API key is missing', async () => {
    const adventure = await openAIService.generateAdventureFromPrompt('test prompt');
    const validation = CustomAdventureValidator.validateAdventureDetails(adventure);
    expect(validation.isValid).toBe(true);
    expect(adventure.setting.world_description.length).toBeGreaterThanOrEqual(
      VALIDATION_RULES.MIN_WORLD_DESCRIPTION_LENGTH
    );
  });
});
