import type { ModerationCase } from '../../../src/shared/contracts/moderation';
import seedCasesJson from '../../../seed-data/moderation-history.json';

let cachedSeedCases: ModerationCase[] | null = null;

const isModerationAction = (value: unknown): value is 'approved' | 'removed' =>
  value === 'approved' || value === 'removed';

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const parseSeedCases = (value: unknown): ModerationCase[] => {
  if (!Array.isArray(value)) {
    throw new Error('Seed moderation history must be an array.');
  }

  return value.map((item, index) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error(`Invalid moderation case at index ${index}.`);
    }

    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.title !== 'string' ||
      typeof candidate.body !== 'string' ||
      typeof candidate.comment !== 'string' ||
      !isModerationAction(candidate.action) ||
      !isStringArray(candidate.matchedRules) ||
      typeof candidate.moderatorNote !== 'string' ||
      typeof candidate.createdAt !== 'string'
    ) {
      throw new Error(`Malformed moderation case at index ${index}.`);
    }

    return {
      id: candidate.id,
      title: candidate.title,
      body: candidate.body,
      comment: candidate.comment,
      action: candidate.action,
      matchedRules: candidate.matchedRules,
      moderatorNote: candidate.moderatorNote,
      createdAt: candidate.createdAt,
    };
  });
};

export const loadSeedModerationCases = (): ModerationCase[] => {
  if (cachedSeedCases) {
    return cachedSeedCases;
  }

  cachedSeedCases = parseSeedCases(seedCasesJson);
  return cachedSeedCases;
};
