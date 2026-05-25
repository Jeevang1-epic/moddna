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

type DashboardMetricDeltas = {
  totalAnalyzedPct: number;
  ambiguityRatePct: number;
  actionedPct: number;
  overridesPct: number;
};

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
  analysisRuns: number;
  constitutionRuns: number;
  metricDeltas: DashboardMetricDeltas;
  lastAnalysisImpact: string;
  lastConstitutionImpact: string;
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
  'Context Missing': 0,
  'Sarcasm / Tone': 0,
  'Rule Overlap': 0,
  'Policy Gap': 0,
  Other: 0,
};

const createDefaultModerationBars = (): number[] =>
  Array.from({ length: 10 }, () => 8);

const defaultMetricDeltas: DashboardMetricDeltas = {
  totalAnalyzedPct: 0,
  ambiguityRatePct: 0,
  actionedPct: 0,
  overridesPct: 0,
};

export const INITIAL_DASHBOARD_ANALYTICS: DashboardAnalyticsState = {
  totalAnalyzed: 0,
  ambiguityRate: 0,
  actionedCount: 0,
  overridesCount: 0,
  moderationBars: createDefaultModerationBars(),
  ambiguitySignalScores: defaultSignalScores,
  constitutionActivityCount: 0,
  onboardingIndicator: 0,
  analysisRuns: 0,
  constitutionRuns: 0,
  metricDeltas: defaultMetricDeltas,
  lastAnalysisImpact:
    'No Time Machine analyses yet. Run Analyze Case to populate live intelligence.',
  lastConstitutionImpact:
    'No constitution drafts yet. Generate Draft to capture policy intelligence.',
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const asFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const asDeltas = (
  value: unknown,
  fallback: DashboardMetricDeltas
): DashboardMetricDeltas => {
  if (!isObject(value)) {
    return fallback;
  }

  return {
    totalAnalyzedPct: asFiniteNumber(
      value.totalAnalyzedPct,
      fallback.totalAnalyzedPct
    ),
    ambiguityRatePct: asFiniteNumber(
      value.ambiguityRatePct,
      fallback.ambiguityRatePct
    ),
    actionedPct: asFiniteNumber(value.actionedPct, fallback.actionedPct),
    overridesPct: asFiniteNumber(value.overridesPct, fallback.overridesPct),
  };
};

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
    metricDeltas: {
      ...INITIAL_DASHBOARD_ANALYTICS.metricDeltas,
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
    const hasPrompt6AnalyticsShape =
      'analysisRuns' in raw.analytics &&
      'constitutionRuns' in raw.analytics &&
      'metricDeltas' in raw.analytics;
    if (!hasPrompt6AnalyticsShape) {
      return next;
    }

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
    next.analytics.analysisRuns = asFiniteNumber(
      raw.analytics.analysisRuns,
      defaults.analytics.analysisRuns
    );
    next.analytics.constitutionRuns = asFiniteNumber(
      raw.analytics.constitutionRuns,
      defaults.analytics.constitutionRuns
    );
    next.analytics.metricDeltas = asDeltas(
      raw.analytics.metricDeltas,
      defaults.analytics.metricDeltas
    );
    next.analytics.lastAnalysisImpact = asString(
      raw.analytics.lastAnalysisImpact
    );
    next.analytics.lastConstitutionImpact = asString(
      raw.analytics.lastConstitutionImpact
    );
    if (!next.analytics.lastAnalysisImpact) {
      next.analytics.lastAnalysisImpact = defaults.analytics.lastAnalysisImpact;
    }
    if (!next.analytics.lastConstitutionImpact) {
      next.analytics.lastConstitutionImpact =
        defaults.analytics.lastConstitutionImpact;
    }
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

const toPercent = (value: number): string => `${Math.round(value * 100)}%`;

const safePercentDelta = (previous: number, next: number): number => {
  if (previous === 0) {
    if (next === 0) {
      return 0;
    }
    return 100;
  }

  return ((next - previous) / Math.abs(previous)) * 100;
};

const averageSimilarity = (response: TimeMachineAnalyzeResponse): number =>
  response.topSimilarCases.length === 0
    ? 0
    : response.topSimilarCases.reduce(
        (sum, similarCase) => sum + similarCase.similarity,
        0
      ) / response.topSimilarCases.length;

const averageRuleOverlap = (response: TimeMachineAnalyzeResponse): number =>
  response.topSimilarCases.length === 0
    ? 0
    : response.topSimilarCases.reduce(
        (sum, similarCase) => sum + similarCase.ruleOverlap,
        0
      ) / response.topSimilarCases.length;

const toAmbiguityNumeric = (response: TimeMachineAnalyzeResponse): number => {
  const similarity = averageSimilarity(response);
  const overlap = response.ruleOverlap.coverage;
  const confidence = response.moderationTendency.confidence;
  const balancePenalty =
    1 -
    Math.abs(
      response.moderationTendency.approvedRate -
        response.moderationTendency.removedRate
    );

  const evidenceStrength =
    similarity * 0.45 + overlap * 0.35 + confidence * 0.2;
  const structuralScore = clamp(
    1 - evidenceStrength + balancePenalty * 0.1,
    0,
    1
  );

  const levelScore = ambiguityScore(response.ambiguity);
  return clamp(levelScore * 0.55 + structuralScore * 0.45, 0, 1);
};

const countKeywordMatches = (source: string, terms: string[]): number => {
  const normalized = source.toLowerCase();
  return terms.filter((term) => normalized.includes(term)).length;
};

const buildLastAnalysisImpact = (
  analysisRun: number,
  response: TimeMachineAnalyzeResponse,
  numericAmbiguity: number
): string => {
  const tendency =
    response.moderationTendency.dominantAction === 'balanced'
      ? 'balanced tendency'
      : `${response.moderationTendency.dominantAction} tendency`;

  return `Analysis #${analysisRun}: ${tendency}, ${toPercent(
    response.moderationTendency.confidence
  )} confidence, ${toPercent(response.ruleOverlap.coverage)} rule coverage, ${toPercent(
    averageSimilarity(response)
  )} precedent similarity, ambiguity ${toPercent(numericAmbiguity)}.`;
};

const toSignalDeltas = (
  response: TimeMachineAnalyzeResponse,
  numericAmbiguity: number
): Record<AmbiguitySignalKey, number> => {
  const similarity = averageSimilarity(response);
  const overlap = response.ruleOverlap.coverage;
  const topCaseText = response.topSimilarCases
    .map((similarCase) =>
      [
        similarCase.case.title,
        similarCase.case.body,
        similarCase.case.comment,
        similarCase.case.moderatorNote,
      ].join(' ')
    )
    .join(' ')
    .toLowerCase();

  const toneKeywordHits = countKeywordMatches(topCaseText, [
    'sarcasm',
    'irony',
    'joke',
    'tone',
    'hostile',
    'insult',
    'harass',
  ]);
  const policyKeywordHits = countKeywordMatches(topCaseText, [
    'exception',
    'edge case',
    'unclear',
    'context',
    'escalate',
  ]);

  const contextMissingDelta = clamp(
    Math.round((1 - overlap) * 9 + (1 - similarity) * 6),
    0,
    12
  );
  const sarcasmToneDelta = clamp(
    Math.round(numericAmbiguity * 5 + toneKeywordHits),
    0,
    12
  );
  const ruleOverlapDelta = clamp(
    Math.round(overlap * 10 + response.ruleOverlap.rules.length * 0.7),
    0,
    12
  );
  const policyGapDelta = clamp(
    Math.round(
      (response.moderationTendency.dominantAction === 'balanced' ? 3 : 1) +
        (response.moderationTendency.confidence < 0.22 ? 2 : 0) +
        policyKeywordHits
    ),
    0,
    12
  );
  const otherDelta = clamp(
    Math.round(
      (1 - similarity) * 4 + (response.topSimilarCases.length === 0 ? 4 : 0)
    ),
    0,
    10
  );

  return {
    'Context Missing': contextMissingDelta,
    'Sarcasm / Tone': sarcasmToneDelta,
    'Rule Overlap': ruleOverlapDelta,
    'Policy Gap': policyGapDelta,
    Other: otherDelta,
  };
};

export const applyTimeMachineAnalytics = (
  sessionState: AppSessionState,
  response: TimeMachineAnalyzeResponse
): DashboardAnalyticsState => {
  const previousAnalytics = sessionState.analytics;
  const previousTotal = previousAnalytics.totalAnalyzed;
  const previousAmbiguityRate = previousAnalytics.ambiguityRate;
  const previousActioned = previousAnalytics.actionedCount;
  const previousOverrides = previousAnalytics.overridesCount;
  const nextAnalysisRuns = previousAnalytics.analysisRuns + 1;

  const nextTotal = previousTotal + 1;
  const numericAmbiguity = toAmbiguityNumeric(response);
  const nextAmbiguityRate =
    (previousAmbiguityRate * previousTotal + numericAmbiguity) / nextTotal;

  const shouldAction =
    response.moderationTendency.dominantAction !== 'balanced' &&
    response.moderationTendency.confidence >= 0.2 &&
    response.topSimilarCases.length >= 2;
  const nextActionedCount = previousActioned + (shouldAction ? 1 : 0);

  const shouldOverride =
    numericAmbiguity >= 0.62 ||
    (response.moderationTendency.dominantAction === 'balanced' &&
      response.ruleOverlap.coverage < 0.42);
  const nextOverridesCount = previousOverrides + (shouldOverride ? 1 : 0);

  const averageSimilarityScore = averageSimilarity(response);
  const averageOverlapScore = averageRuleOverlap(response);
  const removedPressure = response.moderationTendency.removedRate;
  const approvedPressure = response.moderationTendency.approvedRate;
  const nextBar = clamp(
    Math.round(
      10 +
        removedPressure * 38 +
        approvedPressure * 28 +
        response.ruleOverlap.coverage * 18 +
        averageSimilarityScore * 20 +
        averageOverlapScore * 8 -
        numericAmbiguity * 22
    ),
    8,
    96
  );

  const signalDeltas = toSignalDeltas(response, numericAmbiguity);

  const nextSignalScores = {
    ...previousAnalytics.ambiguitySignalScores,
    'Context Missing':
      previousAnalytics.ambiguitySignalScores['Context Missing'] +
      signalDeltas['Context Missing'],
    'Sarcasm / Tone':
      previousAnalytics.ambiguitySignalScores['Sarcasm / Tone'] +
      signalDeltas['Sarcasm / Tone'],
    'Rule Overlap':
      previousAnalytics.ambiguitySignalScores['Rule Overlap'] +
      signalDeltas['Rule Overlap'],
    'Policy Gap':
      previousAnalytics.ambiguitySignalScores['Policy Gap'] +
      signalDeltas['Policy Gap'],
    Other: previousAnalytics.ambiguitySignalScores.Other + signalDeltas.Other,
  };

  const nextMetricDeltas: DashboardMetricDeltas = {
    totalAnalyzedPct: safePercentDelta(previousTotal, nextTotal),
    ambiguityRatePct: (nextAmbiguityRate - previousAmbiguityRate) * 100,
    actionedPct: safePercentDelta(previousActioned, nextActionedCount),
    overridesPct: safePercentDelta(previousOverrides, nextOverridesCount),
  };

  return {
    ...previousAnalytics,
    totalAnalyzed: nextTotal,
    ambiguityRate: nextAmbiguityRate,
    actionedCount: nextActionedCount,
    overridesCount: nextOverridesCount,
    moderationBars: [...previousAnalytics.moderationBars.slice(-9), nextBar],
    ambiguitySignalScores: nextSignalScores,
    analysisRuns: nextAnalysisRuns,
    metricDeltas: nextMetricDeltas,
    lastAnalysisImpact: buildLastAnalysisImpact(
      nextAnalysisRuns,
      response,
      numericAmbiguity
    ),
  };
};

export const applyConstitutionAnalytics = (
  sessionState: AppSessionState,
  response: ConstitutionBuildResponse
): DashboardAnalyticsState => {
  const previousAnalytics = sessionState.analytics;
  const nextConstitutionRuns = previousAnalytics.constitutionRuns + 1;

  const supportingSignalStrength =
    response.supportingSignals.length === 0
      ? 0
      : response.supportingSignals.reduce(
          (sum, signal) => sum + signal.evidence.length,
          0
        ) / response.supportingSignals.length;

  const policyWordCount = response.moderationPhilosophy
    .split(/\s+/)
    .filter((token) => token.trim().length > 0).length;
  const onboardingWordCount = response.onboardingSummary
    .split(/\s+/)
    .filter((token) => token.trim().length > 0).length;
  const writingDepth = clamp(
    (policyWordCount + onboardingWordCount) / 240,
    0,
    1
  );

  const signalBreadth = clamp(response.supportingSignals.length / 4, 0, 1);
  const evidenceDepth = clamp(supportingSignalStrength / 4, 0, 1);
  const automodCoverage = clamp(
    response.suggestedAutoModeratorRules.length / 4,
    0,
    1
  );

  const draftReadiness = clamp(
    Math.round(
      32 +
        signalBreadth * 24 +
        evidenceDepth * 20 +
        automodCoverage * 16 +
        writingDepth * 8
    ),
    0,
    100
  );

  const nextOnboardingIndicator =
    nextConstitutionRuns === 1
      ? draftReadiness
      : clamp(
          Math.round(
            (previousAnalytics.onboardingIndicator *
              (nextConstitutionRuns - 1) +
              draftReadiness) /
              nextConstitutionRuns
          ),
          0,
          100
        );

  const impactSummary = `Draft #${nextConstitutionRuns}: ${response.supportingSignals.length} policy signals, ${response.suggestedAutoModeratorRules.length} AutoModerator suggestions, readiness ${nextOnboardingIndicator}%.`;

  return {
    ...previousAnalytics,
    constitutionActivityCount: previousAnalytics.constitutionActivityCount + 1,
    onboardingIndicator: nextOnboardingIndicator,
    constitutionRuns: nextConstitutionRuns,
    lastConstitutionImpact: impactSummary,
    metricDeltas: {
      ...previousAnalytics.metricDeltas,
      ambiguityRatePct:
        previousAnalytics.metricDeltas.ambiguityRatePct *
        (response.supportingSignals.length > 0 ? 0.97 : 1),
    },
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
    return orderedEntries.map(([label]) => ({
      label,
      weight: 0,
    }));
  }

  return orderedEntries.map(([label, score]) => ({
    label,
    weight: clamp(Math.round((score / total) * 100), 0, 100),
  }));
};
