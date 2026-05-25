import type { ConstitutionBuildResponse } from '../../src/shared/contracts/constitution';
import type {
  AmbiguityLevel,
  TimeMachineAnalyzeResponse,
} from '../../src/shared/contracts/time-machine';

const SESSION_STORAGE_KEY = 'moddna.session.v1';

export const DEFAULT_MOD_HISTORY_TEXT = `[
  {
    "id": "manual_case_1",
    "title": "Example prior case title",
    "body": "Prior case body context.",
    "comment": "Prior moderator discussion comment.",
    "action": "removed",
    "matchedRules": ["No self-promotion"],
    "moderatorNote": "Removed for promotional intent.",
    "createdAt": "2026-05-01T12:00:00.000Z"
  }
]`;

type AmbiguitySignalKey =
  | 'Context Missing'
  | 'Sarcasm / Tone'
  | 'Rule Overlap'
  | 'Policy Gap'
  | 'Other';

export type AmbiguitySignalState = {
  label: AmbiguitySignalKey;
  weight: number;
};

export type DashboardAnalyticsState = {
  totalAnalyzed: number;
  ambiguityRate: number;
  actionedCount: number;
  overridesCount: number;
  moderationBars: number[];
  ambiguitySignalScores: Record<AmbiguitySignalKey, number>;
  constitutionActivityCount: number;
  onboardingIndicator: number;
};

export type TimeMachineSessionState = {
  postTitle: string;
  postBody: string;
  commentText: string;
  rulesText: string;
  modHistoryText: string;
  result: TimeMachineAnalyzeResponse | null;
};

export type ConstitutionSessionState = {
  rulesText: string;
  modLogText: string;
  removalPatternsText: string;
  result: ConstitutionBuildResponse | null;
};

export type AppSessionState = {
  timeMachine: TimeMachineSessionState;
  constitution: ConstitutionSessionState;
  analytics: DashboardAnalyticsState;
};

const defaultSignalScores: Record<AmbiguitySignalKey, number> = {
  'Context Missing': 32,
  'Sarcasm / Tone': 24,
  'Rule Overlap': 18,
  'Policy Gap': 14,
  Other: 12,
};

const defaultModerationBars = [42, 35, 51, 31, 45, 63, 58, 74, 61, 67];

export const INITIAL_DASHBOARD_ANALYTICS: DashboardAnalyticsState = {
  totalAnalyzed: 1248,
  ambiguityRate: 0.187,
  actionedCount: 342,
  overridesCount: 48,
  moderationBars: defaultModerationBars,
  ambiguitySignalScores: defaultSignalScores,
  constitutionActivityCount: 18,
  onboardingIndicator: 76,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const asFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const asNumberArray = (
  value: unknown,
  fallback: number[],
  maxItems: number
): number[] => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const filtered = value
    .filter(
      (item): item is number =>
        typeof item === 'number' && Number.isFinite(item)
    )
    .map((item) => clamp(Math.round(item), 0, 100))
    .slice(0, maxItems);

  return filtered.length > 0 ? filtered : fallback;
};

export const createInitialSessionState = (): AppSessionState => ({
  timeMachine: {
    postTitle: '',
    postBody: '',
    commentText: '',
    rulesText: '',
    modHistoryText: DEFAULT_MOD_HISTORY_TEXT,
    result: null,
  },
  constitution: {
    rulesText: '',
    modLogText: '',
    removalPatternsText: '',
    result: null,
  },
  analytics: {
    ...INITIAL_DASHBOARD_ANALYTICS,
    moderationBars: [...INITIAL_DASHBOARD_ANALYTICS.moderationBars],
    ambiguitySignalScores: {
      ...INITIAL_DASHBOARD_ANALYTICS.ambiguitySignalScores,
    },
  },
});

const readSignalScores = (
  value: unknown,
  fallback: Record<AmbiguitySignalKey, number>
): Record<AmbiguitySignalKey, number> => {
  if (!isObject(value)) {
    return fallback;
  }

  return {
    'Context Missing': asFiniteNumber(
      value['Context Missing'],
      fallback['Context Missing']
    ),
    'Sarcasm / Tone': asFiniteNumber(
      value['Sarcasm / Tone'],
      fallback['Sarcasm / Tone']
    ),
    'Rule Overlap': asFiniteNumber(
      value['Rule Overlap'],
      fallback['Rule Overlap']
    ),
    'Policy Gap': asFiniteNumber(value['Policy Gap'], fallback['Policy Gap']),
    Other: asFiniteNumber(value.Other, fallback.Other),
  };
};

const mergeWithDefaults = (raw: unknown): AppSessionState => {
  const defaults = createInitialSessionState();
  if (!isObject(raw)) {
    return defaults;
  }

  const next = createInitialSessionState();
  if (isObject(raw.timeMachine)) {
    next.timeMachine.postTitle = asString(raw.timeMachine.postTitle);
    next.timeMachine.postBody = asString(raw.timeMachine.postBody);
    next.timeMachine.commentText = asString(raw.timeMachine.commentText);
    next.timeMachine.rulesText = asString(raw.timeMachine.rulesText);
    next.timeMachine.modHistoryText = asString(raw.timeMachine.modHistoryText);
    next.timeMachine.result = isObject(raw.timeMachine.result)
      ? (raw.timeMachine.result as TimeMachineAnalyzeResponse)
      : null;
  }

  if (isObject(raw.constitution)) {
    next.constitution.rulesText = asString(raw.constitution.rulesText);
    next.constitution.modLogText = asString(raw.constitution.modLogText);
    next.constitution.removalPatternsText = asString(
      raw.constitution.removalPatternsText
    );
    next.constitution.result = isObject(raw.constitution.result)
      ? (raw.constitution.result as ConstitutionBuildResponse)
      : null;
  }

  if (isObject(raw.analytics)) {
    next.analytics.totalAnalyzed = asFiniteNumber(
      raw.analytics.totalAnalyzed,
      defaults.analytics.totalAnalyzed
    );
    next.analytics.ambiguityRate = clamp(
      asFiniteNumber(
        raw.analytics.ambiguityRate,
        defaults.analytics.ambiguityRate
      ),
      0,
      1
    );
    next.analytics.actionedCount = asFiniteNumber(
      raw.analytics.actionedCount,
      defaults.analytics.actionedCount
    );
    next.analytics.overridesCount = asFiniteNumber(
      raw.analytics.overridesCount,
      defaults.analytics.overridesCount
    );
    next.analytics.moderationBars = asNumberArray(
      raw.analytics.moderationBars,
      defaults.analytics.moderationBars,
      10
    );
    next.analytics.ambiguitySignalScores = readSignalScores(
      raw.analytics.ambiguitySignalScores,
      defaults.analytics.ambiguitySignalScores
    );
    next.analytics.constitutionActivityCount = asFiniteNumber(
      raw.analytics.constitutionActivityCount,
      defaults.analytics.constitutionActivityCount
    );
    next.analytics.onboardingIndicator = clamp(
      asFiniteNumber(
        raw.analytics.onboardingIndicator,
        defaults.analytics.onboardingIndicator
      ),
      0,
      100
    );
  }

  return next;
};

export const hydrateSessionState = (): AppSessionState => {
  if (typeof window === 'undefined') {
    return createInitialSessionState();
  }

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return createInitialSessionState();
    }

    return mergeWithDefaults(JSON.parse(raw) as unknown);
  } catch {
    return createInitialSessionState();
  }
};

export const persistSessionState = (sessionState: AppSessionState): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(sessionState)
    );
  } catch {
    // Storage is best-effort in webviews and may be disabled by policy.
  }
};

const ambiguityScore = (ambiguity: AmbiguityLevel): number => {
  switch (ambiguity) {
    case 'high':
      return 0.62;
    case 'medium':
      return 0.43;
    case 'low':
      return 0.24;
    default:
      return 0.43;
  }
};

export const applyTimeMachineAnalytics = (
  sessionState: AppSessionState,
  response: TimeMachineAnalyzeResponse
): DashboardAnalyticsState => {
  const previousTotal = sessionState.analytics.totalAnalyzed;
  const nextTotal = previousTotal + 1;
  const nextAmbiguityRate =
    (sessionState.analytics.ambiguityRate * previousTotal +
      ambiguityScore(response.ambiguity)) /
    nextTotal;

  const shouldAction =
    response.moderationTendency.dominantAction !== 'balanced' &&
    response.moderationTendency.confidence >= 0.18;
  const nextActionedCount =
    sessionState.analytics.actionedCount + (shouldAction ? 1 : 0);
  const nextOverridesCount =
    sessionState.analytics.overridesCount +
    (response.ambiguity === 'high' ? 1 : 0);

  const nextBar = clamp(
    Math.round(
      24 +
        response.moderationTendency.removedRate * 34 +
        response.ruleOverlap.coverage * 24 +
        response.moderationTendency.confidence * 20
    ),
    12,
    95
  );

  const averageSimilarity =
    response.topSimilarCases.length > 0
      ? response.topSimilarCases.reduce(
          (sum, similarCase) => sum + similarCase.similarity,
          0
        ) / response.topSimilarCases.length
      : 0;

  const nextSignalScores = {
    ...sessionState.analytics.ambiguitySignalScores,
    'Context Missing':
      sessionState.analytics.ambiguitySignalScores['Context Missing'] +
      clamp(Math.round((1 - response.ruleOverlap.coverage) * 5), 1, 5),
    'Sarcasm / Tone':
      sessionState.analytics.ambiguitySignalScores['Sarcasm / Tone'] +
      (response.ambiguity === 'high'
        ? 4
        : response.ambiguity === 'medium'
          ? 2
          : 1),
    'Rule Overlap':
      sessionState.analytics.ambiguitySignalScores['Rule Overlap'] +
      clamp(Math.round(response.ruleOverlap.coverage * 4), 1, 4),
    'Policy Gap':
      sessionState.analytics.ambiguitySignalScores['Policy Gap'] +
      (response.moderationTendency.dominantAction === 'balanced' ? 3 : 1),
    Other:
      sessionState.analytics.ambiguitySignalScores.Other +
      (averageSimilarity < 0.45 ? 2 : 1),
  };

  return {
    ...sessionState.analytics,
    totalAnalyzed: nextTotal,
    ambiguityRate: nextAmbiguityRate,
    actionedCount: nextActionedCount,
    overridesCount: nextOverridesCount,
    moderationBars: [
      ...sessionState.analytics.moderationBars.slice(-9),
      nextBar,
    ],
    ambiguitySignalScores: nextSignalScores,
  };
};

export const applyConstitutionAnalytics = (
  sessionState: AppSessionState,
  response: ConstitutionBuildResponse
): DashboardAnalyticsState => {
  const supportingSignalStrength =
    response.supportingSignals.length === 0
      ? 0
      : response.supportingSignals.reduce(
          (sum, signal) => sum + signal.evidence.length,
          0
        ) / response.supportingSignals.length;

  const ruleScore = clamp(
    response.suggestedAutoModeratorRules.length * 6,
    0,
    24
  );
  const evidenceScore = clamp(Math.round(supportingSignalStrength * 2), 0, 16);

  const nextOnboardingIndicator = clamp(
    Math.round(
      sessionState.analytics.onboardingIndicator * 0.88 +
        48 +
        ruleScore +
        evidenceScore
    ),
    42,
    100
  );

  return {
    ...sessionState.analytics,
    constitutionActivityCount:
      sessionState.analytics.constitutionActivityCount + 1,
    onboardingIndicator: nextOnboardingIndicator,
  };
};

export const toAmbiguitySignals = (
  signalScores: Record<AmbiguitySignalKey, number>
): AmbiguitySignalState[] => {
  const orderedEntries: Array<[AmbiguitySignalKey, number]> = [
    ['Context Missing', signalScores['Context Missing']],
    ['Sarcasm / Tone', signalScores['Sarcasm / Tone']],
    ['Rule Overlap', signalScores['Rule Overlap']],
    ['Policy Gap', signalScores['Policy Gap']],
    ['Other', signalScores.Other],
  ];

  const total = orderedEntries.reduce((sum, [, score]) => sum + score, 0);
  if (total <= 0) {
    return [
      { label: 'Context Missing', weight: 20 },
      { label: 'Sarcasm / Tone', weight: 20 },
      { label: 'Rule Overlap', weight: 20 },
      { label: 'Policy Gap', weight: 20 },
      { label: 'Other', weight: 20 },
    ];
  }

  return orderedEntries.map(([label, score]) => ({
    label,
    weight: Math.round((score / total) * 100),
  }));
};
