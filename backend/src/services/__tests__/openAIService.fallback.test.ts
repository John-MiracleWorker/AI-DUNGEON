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

  it('sets a warning flag when parsing error triggers fallback', async () => {
    const originalKey = (openAIService as any).openai.apiKey;
    (openAIService as any).openai.apiKey = 'test-key';
    jest
      .spyOn((openAIService as any).openai.chat.completions, 'create')
      .mockResolvedValue({
        id: 'req-123',
        choices: [{ message: { content: 'not json' } }]
      } as any);

    const adventure = await openAIService.generateAdventureFromPrompt('bad json');

    expect(adventure.fallbackUsed).toBe(true);

    (openAIService as any).openai.chat.completions.create.mockRestore();
    (openAIService as any).openai.apiKey = originalKey;
  });
});
