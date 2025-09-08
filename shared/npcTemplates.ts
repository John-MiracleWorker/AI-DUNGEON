import { NPCTemplate } from './types';

export const NPC_TEMPLATES: NPCTemplate[] = [
  // Fantasy Templates
  {
    id: 'fantasy_wizard',
    name: 'Wise Wizard',
    category: 'fantasy',
    archetype: 'Mentor',
    description: 'An elderly wizard with vast knowledge of magic and ancient secrets',
    personality: 'Wise, patient, mysterious, speaks in riddles, values knowledge above all',
    goals: 'Preserve ancient knowledge, guide worthy apprentices, protect magical artifacts',
    traits: ['wise', 'patient', 'mysterious', 'knowledgeable', 'powerful'],
    commonRelationships: ['mentor', 'ally', 'quest-giver']
  },
  {
    id: 'fantasy_rogue',
    name: 'Cunning Rogue',
    category: 'fantasy',
    archetype: 'Trickster',
    description: 'A nimble thief with quick wit and quicker fingers',
    personality: 'Sarcastic, opportunistic, loyal to friends, distrusts authority',
    goals: 'Accumulate wealth, avoid capture, protect their crew',
    traits: ['agile', 'cunning', 'sarcastic', 'opportunistic', 'streetwise'],
    commonRelationships: ['ally', 'rival', 'informant']
  },
  {
    id: 'fantasy_paladin',
    name: 'Noble Paladin',
    category: 'fantasy',
    archetype: 'Guardian',
    description: 'A holy warrior dedicated to justice and protecting the innocent',
    personality: 'Honorable, righteous, sometimes inflexible, deeply faithful',
    goals: 'Uphold justice, protect the innocent, vanquish evil',
    traits: ['honorable', 'righteous', 'brave', 'faithful', 'protective'],
    commonRelationships: ['ally', 'mentor', 'rival']
  },
  {
    id: 'fantasy_merchant',
    name: 'Traveling Merchant',
    category: 'fantasy',
    archetype: 'Provider',
    description: 'A well-traveled trader with goods from distant lands',
    personality: 'Gregarious, shrewd, curious about news, loves to haggle',
    goals: 'Maximize profits, discover new trade routes, gather information',
    traits: ['charismatic', 'shrewd', 'well-traveled', 'talkative', 'opportunistic'],
    commonRelationships: ['ally', 'neutral', 'informant']
  },

  // Sci-Fi Templates
  {
    id: 'scifi_captain',
    name: 'Space Captain',
    category: 'sci-fi',
    archetype: 'Leader',
    description: 'A veteran starship captain with years of experience in deep space',
    personality: 'Confident, decisive, protective of crew, bears heavy responsibilities',
    goals: 'Complete the mission, protect their crew, maintain ship operations',
    traits: ['experienced', 'decisive', 'protective', 'responsible', 'tactical'],
    commonRelationships: ['ally', 'mentor', 'superior']
  },
  {
    id: 'scifi_engineer',
    name: 'Tech Engineer',
    category: 'sci-fi',
    archetype: 'Problem Solver',
    description: 'A brilliant engineer who can fix anything with the right tools',
    personality: 'Analytical, perfectionist, socially awkward, passionate about technology',
    goals: 'Solve technical problems, improve systems, discover new technologies',
    traits: ['brilliant', 'analytical', 'perfectionist', 'innovative', 'focused'],
    commonRelationships: ['ally', 'expert', 'neutral']
  },
  {
    id: 'scifi_android',
    name: 'Sentient Android',
    category: 'sci-fi',
    archetype: 'Outsider',
    description: 'An artificial being seeking to understand humanity and emotions',
    personality: 'Logical, curious about emotions, struggles with human concepts',
    goals: 'Understand humanity, develop emotions, find their place in society',
    traits: ['logical', 'curious', 'loyal', 'analytical', 'evolving'],
    commonRelationships: ['ally', 'neutral', 'protégé']
  },
  {
    id: 'scifi_diplomat',
    name: 'Alien Diplomat',
    category: 'sci-fi',
    archetype: 'Mediator',
    description: 'An alien representative working to maintain peace between species',
    personality: 'Diplomatic, patient, culturally aware, sometimes secretive',
    goals: 'Maintain peace, advance their species interests, build alliances',
    traits: ['diplomatic', 'patient', 'intelligent', 'culturally-aware', 'strategic'],
    commonRelationships: ['ally', 'neutral', 'quest-giver']
  },

  // Modern Templates
  {
    id: 'modern_detective',
    name: 'Police Detective',
    category: 'modern',
    archetype: 'Investigator',
    description: 'A seasoned detective with sharp instincts and a nose for trouble',
    personality: 'Cynical, observant, persistent, has seen too much of human nature',
    goals: 'Solve cases, bring criminals to justice, protect the public',
    traits: ['observant', 'persistent', 'cynical', 'experienced', 'intuitive'],
    commonRelationships: ['ally', 'mentor', 'authority']
  },
  {
    id: 'modern_hacker',
    name: 'Elite Hacker',
    category: 'modern',
    archetype: 'Information Broker',
    description: 'A skilled hacker who trades in information and digital secrets',
    personality: 'Paranoid, brilliant, anti-authority, values privacy and freedom',
    goals: 'Expose corruption, maintain anonymity, fight digital oppression',
    traits: ['brilliant', 'paranoid', 'anti-authority', 'secretive', 'tech-savvy'],
    commonRelationships: ['ally', 'informant', 'neutral']
  },
  {
    id: 'modern_ceo',
    name: 'Corporate CEO',
    category: 'modern',
    archetype: 'Power Broker',
    description: 'A powerful corporate executive with vast resources and influence',
    personality: 'Ambitious, ruthless, charismatic, values results over methods',
    goals: 'Expand corporate power, maximize profits, eliminate competition',
    traits: ['ambitious', 'ruthless', 'charismatic', 'influential', 'strategic'],
    commonRelationships: ['enemy', 'neutral', 'patron']
  },
  {
    id: 'modern_journalist',
    name: 'Investigative Journalist',
    category: 'modern',
    archetype: 'Truth Seeker',
    description: 'A determined reporter seeking to uncover the truth behind the story',
    personality: 'Curious, persistent, idealistic, sometimes reckless in pursuit of truth',
    goals: 'Uncover the truth, expose corruption, inform the public',
    traits: ['curious', 'persistent', 'idealistic', 'brave', 'resourceful'],
    commonRelationships: ['ally', 'informant', 'neutral']
  },

  // Horror Templates
  {
    id: 'horror_survivor',
    name: 'Hardened Survivor',
    category: 'horror',
    archetype: 'Survivor',
    description: 'Someone who has lived through horrors and carries the scars',
    personality: 'Paranoid, cautious, resourceful, haunted by past experiences',
    goals: 'Stay alive, protect others, avoid repeating past mistakes',
    traits: ['paranoid', 'cautious', 'resourceful', 'traumatized', 'determined'],
    commonRelationships: ['ally', 'mentor', 'neutral']
  },
  {
    id: 'horror_cultist',
    name: 'Mysterious Cultist',
    category: 'horror',
    archetype: 'Antagonist',
    description: 'A devoted follower of dark forces with hidden knowledge',
    personality: 'Fanatical, secretive, believes the ends justify the means',
    goals: 'Serve their dark master, recruit new followers, complete rituals',
    traits: ['fanatical', 'secretive', 'knowledgeable', 'manipulative', 'dangerous'],
    commonRelationships: ['enemy', 'neutral', 'informant']
  },
  {
    id: 'horror_investigator',
    name: 'Occult Investigator',
    category: 'horror',
    archetype: 'Scholar',
    description: 'A researcher dedicated to understanding supernatural phenomena',
    personality: 'Scholarly, brave, sometimes obsessive, struggles with sanity',
    goals: 'Understand the supernatural, protect humanity, preserve knowledge',
    traits: ['scholarly', 'brave', 'obsessive', 'knowledgeable', 'determined'],
    commonRelationships: ['ally', 'mentor', 'expert']
  },
  {
    id: 'horror_entity',
    name: 'Benevolent Entity',
    category: 'horror',
    archetype: 'Otherworldly',
    description: 'A supernatural being with its own mysterious agenda',
    personality: 'Alien mindset, speaks in metaphors, operates by unknown rules',
    goals: 'Fulfill ancient purpose, maintain cosmic balance, test mortals',
    traits: ['mysterious', 'powerful', 'otherworldly', 'ancient', 'unpredictable'],
    commonRelationships: ['neutral', 'mentor', 'quest-giver']
  }
];

export const getNPCTemplatesByCategory = (category: string): NPCTemplate[] => {
  return NPC_TEMPLATES.filter(template => template.category === category);
};

export const getNPCTemplateById = (id: string): NPCTemplate | undefined => {
  return NPC_TEMPLATES.find(template => template.id === id);
};

export const getAllCategories = (): string[] => {
  return Array.from(new Set(NPC_TEMPLATES.map(template => template.category)));
};

export const getArchetypesByCategory = (category: string): string[] => {
  const templates = getNPCTemplatesByCategory(category);
  return Array.from(new Set(templates.map(template => template.archetype)));
};