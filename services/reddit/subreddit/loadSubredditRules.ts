import { reddit } from '@devvit/web/server';

const normalizeRule = (rule: string): string =>
  rule.trim().replace(/\s+/g, ' ').replace(/\.$/, '');

export const loadSubredditRules = async (
  subredditName?: string
): Promise<string[]> => {
  if (!subredditName) {
    return [];
  }

  try {
    const rules = await reddit.getRules(subredditName);
    return [
      ...new Set(
        rules
          .flatMap((rule) => [rule.shortName, rule.description])
          .map(normalizeRule)
          .filter((rule) => rule.length > 0)
      ),
    ];
  } catch {
    return [];
  }
};
