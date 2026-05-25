import type {
  ConstitutionBuildRequest,
  ConstitutionBuildResponse,
} from '../../../src/shared/contracts/constitution';

type ThemeKey =
  | 'civility'
  | 'self-promotion'
  | 'off-topic'
  | 'safety'
  | 'evidence'
  | 'quality';

type ThemeSignal = {
  theme: ThemeKey;
  score: number;
  evidence: string[];
};

const themeLabels: Record<ThemeKey, string> = {
  civility: 'Civility and respectful behavior',
  'self-promotion': 'Anti-promotion and conflict-of-interest controls',
  'off-topic': 'Topical relevance and scope discipline',
  safety: 'Safety, legality, and privacy protection',
  evidence: 'Evidence-backed moderation rationale',
  quality: 'Content quality and contribution standards',
};

const themeKeywords: Record<ThemeKey, string[]> = {
  civility: ['attack', 'harass', 'insult', 'toxic', 'abuse', 'civility'],
  'self-promotion': ['promotion', 'referral', 'advertise', 'affiliate', 'self'],
  'off-topic': ['off-topic', 'relevance', 'scope', 'topic', 'meme'],
  safety: ['illegal', 'malware', 'privacy', 'sensitive', 'dox', 'unsafe'],
  evidence: ['evidence', 'reason', 'explain', 'context', 'transparent'],
  quality: ['low effort', 'quality', 'duplicate', 'spam', 'substantive'],
};

const normalize = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

const rankThemes = (input: ConstitutionBuildRequest): ThemeSignal[] => {
  const mergedLines = [
    ...input.rules,
    ...input.modLog,
    ...input.removalPatterns,
  ]
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const signals: Record<ThemeKey, ThemeSignal> = {
    civility: { theme: 'civility', score: 0, evidence: [] },
    'self-promotion': { theme: 'self-promotion', score: 0, evidence: [] },
    'off-topic': { theme: 'off-topic', score: 0, evidence: [] },
    safety: { theme: 'safety', score: 0, evidence: [] },
    evidence: { theme: 'evidence', score: 0, evidence: [] },
    quality: { theme: 'quality', score: 0, evidence: [] },
  };

  for (const line of mergedLines) {
    const normalizedLine = normalize(line);
    for (const [theme, keywords] of Object.entries(themeKeywords) as Array<
      [ThemeKey, string[]]
    >) {
      const hits = keywords.filter((keyword) =>
        normalizedLine.includes(keyword)
      ).length;
      if (hits > 0) {
        signals[theme].score += hits;
        if (signals[theme].evidence.length < 5) {
          signals[theme].evidence.push(line);
        }
      }
    }
  }

  return Object.values(signals).sort((left, right) => right.score - left.score);
};

const dedupe = (values: string[]): string[] => [...new Set(values)];

const buildModerationPhilosophy = (
  topSignals: ThemeSignal[],
  input: ConstitutionBuildRequest
): string => {
  const dominantThemes = topSignals
    .filter((signal) => signal.score > 0)
    .slice(0, 3)
    .map((signal) => themeLabels[signal.theme]);

  const scopeStatement =
    input.rules.length > 0
      ? `The moderation model prioritizes ${dominantThemes.join(
          ', '
        )} while staying aligned to explicit subreddit rules.`
      : `The moderation model prioritizes ${dominantThemes.join(
          ', '
        )} with consistent reviewer judgment.`;

  const consistencyStatement =
    'Decisions should be justified with explicit references to rule language, historical precedent, and proportional enforcement.';
  const controlStatement =
    'Moderator discretion remains final, but escalations should follow repeatable criteria when ambiguity is high.';

  return [scopeStatement, consistencyStatement, controlStatement].join(' ');
};

const buildOnboardingSummary = (
  topSignals: ThemeSignal[],
  input: ConstitutionBuildRequest
): string => {
  const primaryThemes = topSignals
    .filter((signal) => signal.score > 0)
    .slice(0, 3)
    .map((signal) => themeLabels[signal.theme]);

  const rulesContext =
    input.rules.length > 0
      ? `Start by reviewing the current ruleset and examples of past actions in the queue.`
      : `Start by reviewing recent actions and moderator notes from prior decisions.`;

  const focusContext =
    primaryThemes.length > 0
      ? `Prioritize consistency around ${primaryThemes.join(', ')}.`
      : 'Prioritize consistent interpretation of scope, safety, and quality.';

  const executionContext =
    'When making a decision, document the triggering rule, confidence level, and whether escalation is needed for edge cases.';

  return [rulesContext, focusContext, executionContext].join(' ');
};

const buildAutoModeratorSuggestions = (
  topSignals: ThemeSignal[],
  input: ConstitutionBuildRequest
): string[] => {
  const removalText = normalize(input.removalPatterns.join(' '));
  const suggestions: string[] = [];

  const hasPromotionRisk =
    removalText.includes('referral') ||
    removalText.includes('promo') ||
    topSignals.some(
      (signal) => signal.theme === 'self-promotion' && signal.score > 0
    );
  if (hasPromotionRisk) {
    suggestions.push(
      'type: submission\nbody+title (includes, regex): ["referral", "promo code", "affiliate"]\naction: filter'
    );
  }

  const hasAttackRisk =
    removalText.includes('attack') ||
    removalText.includes('harass') ||
    topSignals.some(
      (signal) => signal.theme === 'civility' && signal.score > 0
    );
  if (hasAttackRisk) {
    suggestions.push(
      'type: any\nbody (includes, regex): ["idiot", "kill yourself", "trash mod"]\naction: remove'
    );
  }

  const hasSafetyRisk =
    removalText.includes('malware') ||
    removalText.includes('illegal') ||
    topSignals.some((signal) => signal.theme === 'safety' && signal.score > 0);
  if (hasSafetyRisk) {
    suggestions.push(
      'type: any\nbody+title (includes, regex): ["cracked", "pirated", "dox", "leak"]\naction: remove'
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      'type: submission\nreports: "> 2"\naction: filter\ncomment: "Queued for moderator review due to repeated reports."'
    );
  }

  return suggestions;
};

export const buildConstitution = (
  request: ConstitutionBuildRequest
): ConstitutionBuildResponse => {
  const start = Date.now();
  const rankedSignals = rankThemes(request);
  const activeSignals = rankedSignals.filter((signal) => signal.score > 0);

  const moderationPhilosophy = buildModerationPhilosophy(
    activeSignals,
    request
  );
  const onboardingSummary = buildOnboardingSummary(activeSignals, request);
  const suggestedAutoModeratorRules = buildAutoModeratorSuggestions(
    activeSignals,
    request
  );

  return {
    moderationPhilosophy,
    onboardingSummary,
    suggestedAutoModeratorRules,
    supportingSignals: activeSignals.slice(0, 4).map((signal) => ({
      theme: themeLabels[signal.theme],
      evidence: dedupe(signal.evidence),
    })),
    elapsedMs: Date.now() - start,
  };
};
