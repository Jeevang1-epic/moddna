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

type InputSource = 'rules' | 'modLog' | 'removalPatterns';

type InputLine = {
  source: InputSource;
  text: string;
  normalized: string;
};

type ThemeSignal = {
  theme: ThemeKey;
  score: number;
  evidence: string[];
  matchedTerms: Record<string, number>;
};

type ThemeProfile = {
  key: ThemeKey;
  label: string;
  keywords: string[];
  automod: {
    type: 'submission' | 'comment' | 'any';
    action: 'filter' | 'remove';
  };
};

const sourceWeight: Record<InputSource, number> = {
  rules: 3,
  modLog: 2,
  removalPatterns: 4,
};

const themeProfiles: ThemeProfile[] = [
  {
    key: 'civility',
    label: 'Civility and respectful behavior',
    keywords: [
      'attack',
      'harass',
      'insult',
      'toxic',
      'abuse',
      'slur',
      'hate',
      'hostile',
    ],
    automod: { type: 'any', action: 'remove' },
  },
  {
    key: 'self-promotion',
    label: 'Anti-promotion and conflict-of-interest controls',
    keywords: [
      'promotion',
      'referral',
      'promo code',
      'affiliate',
      'advertise',
      'sponsor',
      'sell',
      'marketing',
      'self promotion',
    ],
    automod: { type: 'submission', action: 'filter' },
  },
  {
    key: 'off-topic',
    label: 'Topical relevance and scope discipline',
    keywords: [
      'off-topic',
      'off topic',
      'scope',
      'relevance',
      'meme',
      'low effort',
      'duplicate',
      'unrelated',
    ],
    automod: { type: 'submission', action: 'filter' },
  },
  {
    key: 'safety',
    label: 'Safety, legality, and privacy protection',
    keywords: [
      'illegal',
      'malware',
      'dox',
      'doxx',
      'privacy',
      'sensitive data',
      'unsafe',
      'pirated',
      'cracked',
      'leak',
    ],
    automod: { type: 'any', action: 'remove' },
  },
  {
    key: 'evidence',
    label: 'Evidence-backed moderation rationale',
    keywords: [
      'evidence',
      'reason',
      'context',
      'explain',
      'citation',
      'transparent',
      'proof',
      'document',
    ],
    automod: { type: 'comment', action: 'filter' },
  },
  {
    key: 'quality',
    label: 'Content quality and contribution standards',
    keywords: [
      'quality',
      'spam',
      'duplicate',
      'low effort',
      'substantive',
      'constructive',
      'template',
      'format',
    ],
    automod: { type: 'submission', action: 'filter' },
  },
];

const normalize = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ');

const dedupe = (values: string[]): string[] => [...new Set(values)];

const sanitizeSnippet = (value: string): string =>
  value.replace(/"/g, "'").replace(/\s+/g, ' ').trim().slice(0, 120);

const toInputLines = (input: ConstitutionBuildRequest): InputLine[] => {
  const withSource: Array<{ source: InputSource; values: string[] }> = [
    { source: 'rules', values: input.rules },
    { source: 'modLog', values: input.modLog },
    { source: 'removalPatterns', values: input.removalPatterns },
  ];

  return withSource.flatMap(({ source, values }) =>
    values
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .map((value) => ({
        source,
        text: value,
        normalized: normalize(value),
      }))
  );
};

const createEmptySignals = (): Record<ThemeKey, ThemeSignal> => ({
  civility: { theme: 'civility', score: 0, evidence: [], matchedTerms: {} },
  'self-promotion': {
    theme: 'self-promotion',
    score: 0,
    evidence: [],
    matchedTerms: {},
  },
  'off-topic': { theme: 'off-topic', score: 0, evidence: [], matchedTerms: {} },
  safety: { theme: 'safety', score: 0, evidence: [], matchedTerms: {} },
  evidence: { theme: 'evidence', score: 0, evidence: [], matchedTerms: {} },
  quality: { theme: 'quality', score: 0, evidence: [], matchedTerms: {} },
});

const rankThemes = (input: ConstitutionBuildRequest): ThemeSignal[] => {
  const lines = toInputLines(input);
  const signals = createEmptySignals();

  for (const line of lines) {
    let matchedAnyTheme = false;

    for (const profile of themeProfiles) {
      const matchedKeywords = profile.keywords.filter((keyword) =>
        line.normalized.includes(keyword)
      );
      if (matchedKeywords.length === 0) {
        continue;
      }

      matchedAnyTheme = true;
      const signal = signals[profile.key];
      signal.score += matchedKeywords.length * sourceWeight[line.source];
      if (signal.evidence.length < 6) {
        signal.evidence.push(line.text);
      }

      for (const keyword of matchedKeywords) {
        signal.matchedTerms[keyword] = (signal.matchedTerms[keyword] ?? 0) + 1;
      }
    }

    if (!matchedAnyTheme && line.source === 'rules') {
      const qualitySignal = signals.quality;
      qualitySignal.score += 1;
      if (qualitySignal.evidence.length < 6) {
        qualitySignal.evidence.push(line.text);
      }
    }
  }

  const ranked = Object.values(signals).sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return left.theme.localeCompare(right.theme);
  });

  if (ranked.every((signal) => signal.score === 0) && lines.length > 0) {
    const fallbackEvidence = lines.slice(0, 4).map((line) => line.text);
    const firstSignal = ranked.at(0);
    if (firstSignal) {
      firstSignal.score = 1;
      firstSignal.evidence = fallbackEvidence;
    }
  }

  return ranked;
};

const buildModerationPhilosophy = (
  rankedSignals: ThemeSignal[],
  input: ConstitutionBuildRequest
): string => {
  const topThemes = rankedSignals
    .filter((signal) => signal.score > 0)
    .slice(0, 3)
    .map(
      (signal) =>
        themeProfiles.find((profile) => profile.key === signal.theme)?.label
    )
    .filter((label): label is string => typeof label === 'string');

  const focusStatement =
    topThemes.length > 0
      ? `This community moderates with priority on ${topThemes.join(', ')}.`
      : 'This community moderates with a focus on consistent scope, safety, and quality.';

  const rulesStatement =
    input.rules.length > 0
      ? 'Primary enforcement should start from explicit rule text, then apply precedent when wording is ambiguous.'
      : 'Primary enforcement should start from repeatable reviewer criteria, then apply precedent for edge cases.';

  const executionStatement =
    input.modLog.length > 0
      ? 'Moderator notes must document trigger conditions, applied rule references, and whether escalation was required.'
      : 'Each action should log trigger conditions, applied rules, and final decision rationale for future consistency.';

  const safeguardsStatement =
    input.removalPatterns.length > 0
      ? 'Removal patterns indicate recurring risks, so enforcement should emphasize proportional response and transparent justification.'
      : 'When risk patterns are unclear, moderators should default to temporary filtering and explicit human review.';

  return [
    focusStatement,
    rulesStatement,
    executionStatement,
    safeguardsStatement,
  ].join(' ');
};

const buildOnboardingSummary = (
  rankedSignals: ThemeSignal[],
  input: ConstitutionBuildRequest
): string => {
  const dominantThemes = rankedSignals
    .filter((signal) => signal.score > 0)
    .slice(0, 2)
    .map(
      (signal) =>
        themeProfiles.find((profile) => profile.key === signal.theme)?.label
    )
    .filter((label): label is string => typeof label === 'string');

  const firstStep =
    input.rules.length > 0
      ? 'Step 1: Review current subreddit rules and map each queue decision to a specific rule.'
      : 'Step 1: Review recent moderation decisions and identify recurring action criteria.';

  const secondStep =
    dominantThemes.length > 0
      ? `Step 2: Prioritize consistency on ${dominantThemes.join(' and ')} during triage.`
      : 'Step 2: Prioritize consistency across civility, safety, and topical relevance checks.';

  const thirdStep =
    input.modLog.length > 0
      ? 'Step 3: Use prior moderator notes to calibrate confidence and escalation thresholds.'
      : 'Step 3: Record confidence level and escalation reasons on every non-obvious decision.';

  const fourthStep =
    'Step 4: If content matches repeated removal patterns, apply standard enforcement first and escalate only when context changes the ruling.';

  return [firstStep, secondStep, thirdStep, fourthStep].join(' ');
};

const selectTopTerms = (signal: ThemeSignal): string[] =>
  Object.entries(signal.matchedTerms)
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }
      return left[0].localeCompare(right[0]);
    })
    .slice(0, 4)
    .map(([term]) => term);

const buildAutoModeratorSuggestion = (
  profile: ThemeProfile,
  signal: ThemeSignal
): string => {
  const terms = selectTopTerms(signal);
  const termsClause =
    terms.length > 0
      ? `["${terms.join('", "')}"]`
      : `["${profile.keywords.slice(0, 3).join('", "')}"]`;

  const firstEvidenceLine = signal.evidence.at(0);
  const evidenceSnippet = firstEvidenceLine
    ? sanitizeSnippet(firstEvidenceLine)
    : `theme=${profile.label.toLowerCase()}`;

  const bodyTarget = profile.automod.type === 'comment' ? 'body' : 'body+title';

  return [
    `type: ${profile.automod.type}`,
    `${bodyTarget} (includes, regex): ${termsClause}`,
    `action: ${profile.automod.action}`,
    `comment: "Filtered by ModDNA policy profile: ${sanitizeSnippet(profile.label)}. Example trigger: ${evidenceSnippet}."`,
  ].join('\n');
};

const buildAutoModeratorSuggestions = (
  rankedSignals: ThemeSignal[]
): string[] => {
  const activeSignals = rankedSignals
    .filter((signal) => signal.score > 0)
    .slice(0, 4);
  const suggestions = activeSignals
    .map((signal) => {
      const profile = themeProfiles.find(
        (candidate) => candidate.key === signal.theme
      );
      if (!profile) {
        return null;
      }
      return buildAutoModeratorSuggestion(profile, signal);
    })
    .filter(
      (suggestion): suggestion is string => typeof suggestion === 'string'
    );

  if (suggestions.length > 0) {
    return suggestions;
  }

  return [
    'type: submission\nreports: "> 2"\naction: filter\ncomment: "Queued for moderator review due to repeated reports and low-confidence policy match."',
  ];
};

export const buildConstitution = (
  request: ConstitutionBuildRequest
): ConstitutionBuildResponse => {
  const start = Date.now();
  const rankedSignals = rankThemes(request);
  const activeSignals = rankedSignals.filter((signal) => signal.score > 0);

  const moderationPhilosophy = buildModerationPhilosophy(
    rankedSignals,
    request
  );
  const onboardingSummary = buildOnboardingSummary(rankedSignals, request);
  const suggestedAutoModeratorRules =
    buildAutoModeratorSuggestions(rankedSignals);

  return {
    moderationPhilosophy,
    onboardingSummary,
    suggestedAutoModeratorRules,
    supportingSignals: activeSignals.slice(0, 4).map((signal) => {
      const profile = themeProfiles.find(
        (candidate) => candidate.key === signal.theme
      );
      return {
        theme: profile?.label ?? signal.theme,
        evidence: dedupe(signal.evidence),
      };
    }),
    elapsedMs: Date.now() - start,
  };
};
