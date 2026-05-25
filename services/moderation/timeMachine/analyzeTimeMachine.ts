import type { ModerationCase } from '../../../src/shared/contracts/moderation';
import type {
  AmbiguityLevel,
  ModerationTendency,
  RuleOverlapSummary,
  SimilarCase,
  TimeMachineAnalyzeRequest,
  TimeMachineAnalyzeResponse,
} from '../../../src/shared/contracts/time-machine';
import { loadHistoricalCases } from '../history/loadHistoricalCases';
import { scoreSimilarCases } from '../retrieval/similarity';

type RankedCase = {
  moderationCase: ModerationCase;
  similarity: number;
  ruleOverlap: number;
  recency: number;
  combined: number;
};

const formatPercent = (value: number): string => `${Math.round(value * 100)}%`;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const normalizeText = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ');

const tokenize = (value: string): string[] =>
  normalizeText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 2);

const jaccard = (left: string[], right: string[]): number => {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }

  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersection = [...leftSet].filter((token) =>
    rightSet.has(token)
  ).length;
  const union = new Set([...leftSet, ...rightSet]).size;
  return union === 0 ? 0 : intersection / union;
};

const scoreRuleRelation = (ruleA: string, ruleB: string): number => {
  const normalizedA = normalizeText(ruleA);
  const normalizedB = normalizeText(ruleB);
  if (!normalizedA || !normalizedB) {
    return 0;
  }

  if (normalizedA === normalizedB) {
    return 1;
  }

  if (normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)) {
    return 0.85;
  }

  const overlap = jaccard(tokenize(normalizedA), tokenize(normalizedB));
  if (overlap >= 0.5) {
    return overlap;
  }

  return 0;
};

const cleanRules = (rules: string[]): string[] => [
  ...new Set(
    rules.map((rule) => rule.trim()).filter((rule) => rule.length > 0)
  ),
];

const scoreRuleOverlap = (
  subredditRules: string[],
  moderationCase: ModerationCase
): number => {
  const rules = cleanRules(subredditRules);
  if (rules.length === 0) {
    return 0;
  }

  const caseRules = cleanRules(moderationCase.matchedRules);
  if (caseRules.length === 0) {
    return 0;
  }

  const totalScore = rules.reduce((sum, rule) => {
    const bestMatch = caseRules.reduce((best, caseRule) => {
      const matchScore = scoreRuleRelation(rule, caseRule);
      return matchScore > best ? matchScore : best;
    }, 0);
    return sum + bestMatch;
  }, 0);

  return clamp(totalScore / rules.length, 0, 1);
};

const parseTimestamp = (value: string): number => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const buildRecencyScores = (cases: ModerationCase[]): Map<string, number> => {
  const datedCases = cases.map((moderationCase) => ({
    id: moderationCase.id,
    time: parseTimestamp(moderationCase.createdAt),
  }));

  const minTime = datedCases.reduce(
    (min, moderationCase) => Math.min(min, moderationCase.time),
    Number.POSITIVE_INFINITY
  );
  const maxTime = datedCases.reduce(
    (max, moderationCase) => Math.max(max, moderationCase.time),
    Number.NEGATIVE_INFINITY
  );

  const scores = new Map<string, number>();
  if (
    !Number.isFinite(minTime) ||
    !Number.isFinite(maxTime) ||
    minTime === maxTime
  ) {
    for (const moderationCase of datedCases) {
      scores.set(moderationCase.id, 0.5);
    }
    return scores;
  }

  const span = maxTime - minTime;
  for (const moderationCase of datedCases) {
    scores.set(
      moderationCase.id,
      clamp((moderationCase.time - minTime) / span, 0, 1)
    );
  }
  return scores;
};

const buildCaseExplanation = (rankedCase: RankedCase): string =>
  `${rankedCase.moderationCase.action} precedent with ${formatPercent(
    rankedCase.similarity
  )} textual similarity, ${formatPercent(rankedCase.ruleOverlap)} rule overlap, and ${formatPercent(
    rankedCase.recency
  )} recency signal.`;

const toSimilarCase = (rankedCase: RankedCase): SimilarCase => ({
  case: rankedCase.moderationCase,
  similarity: rankedCase.similarity,
  ruleOverlap: rankedCase.ruleOverlap,
  explanation: buildCaseExplanation(rankedCase),
});

const buildModerationTendency = (
  rankedCases: RankedCase[]
): ModerationTendency => {
  const evidenceSet = rankedCases.slice(0, 12);
  const approvedCount = evidenceSet.filter(
    (rankedCase) => rankedCase.moderationCase.action === 'approved'
  ).length;
  const removedCount = evidenceSet.length - approvedCount;

  if (evidenceSet.length === 0) {
    return {
      approvedCount: 0,
      removedCount: 0,
      approvedRate: 0.5,
      removedRate: 0.5,
      dominantAction: 'balanced',
      confidence: 0,
    };
  }

  const totalWeight = evidenceSet.reduce(
    (sum, rankedCase) => sum + rankedCase.combined,
    0
  );
  const approvedWeight = evidenceSet.reduce((sum, rankedCase) => {
    if (rankedCase.moderationCase.action !== 'approved') {
      return sum;
    }
    return sum + rankedCase.combined;
  }, 0);
  const removedWeight = totalWeight - approvedWeight;

  const approvedRate =
    totalWeight > 0
      ? approvedWeight / totalWeight
      : approvedCount / evidenceSet.length;
  const removedRate =
    totalWeight > 0
      ? removedWeight / totalWeight
      : removedCount / evidenceSet.length;

  const averageSimilarity =
    evidenceSet.reduce((sum, rankedCase) => sum + rankedCase.similarity, 0) /
    evidenceSet.length;
  const averageRuleOverlap =
    evidenceSet.reduce((sum, rankedCase) => sum + rankedCase.ruleOverlap, 0) /
    evidenceSet.length;
  const evidenceStrength = clamp(
    averageSimilarity * 0.7 + averageRuleOverlap * 0.3,
    0,
    1
  );
  const confidence = clamp(
    Math.abs(approvedRate - removedRate) * evidenceStrength,
    0,
    1
  );

  let dominantAction: ModerationTendency['dominantAction'] = 'balanced';
  if (confidence >= 0.12) {
    dominantAction = approvedRate > removedRate ? 'approved' : 'removed';
  }

  return {
    approvedCount,
    removedCount,
    approvedRate,
    removedRate,
    dominantAction,
    confidence,
  };
};

const buildRuleOverlapSummary = (
  subredditRules: string[],
  rankedCases: RankedCase[]
): RuleOverlapSummary => {
  const rules = cleanRules(subredditRules);
  if (rules.length === 0) {
    return {
      coverage: 0,
      rules: [],
    };
  }

  const evidenceSet = rankedCases.slice(0, 12);
  const totalWeight = evidenceSet.reduce(
    (sum, rankedCase) => sum + rankedCase.combined,
    0
  );

  const mapped = rules.map((rule) => {
    let hits = 0;
    let weightedHits = 0;

    for (const rankedCase of evidenceSet) {
      const bestMatch = rankedCase.moderationCase.matchedRules.reduce(
        (best, caseRule) => {
          const score = scoreRuleRelation(rule, caseRule);
          return score > best ? score : best;
        },
        0
      );

      if (bestMatch > 0) {
        hits += 1;
        weightedHits += rankedCase.combined * bestMatch;
      }
    }

    return {
      rule,
      hits,
      weight: totalWeight > 0 ? clamp(weightedHits / totalWeight, 0, 1) : 0,
    };
  });

  const coverage = mapped.filter((rule) => rule.hits > 0).length / rules.length;

  return {
    coverage,
    rules: mapped.sort((left, right) => right.weight - left.weight),
  };
};

const classifyAmbiguity = (
  tendency: ModerationTendency,
  rankedCases: RankedCase[],
  ruleOverlap: RuleOverlapSummary
): AmbiguityLevel => {
  const evidenceSet = rankedCases.slice(0, 8);
  if (evidenceSet.length === 0) {
    return 'high';
  }

  const averageSimilarity =
    evidenceSet.reduce((sum, rankedCase) => sum + rankedCase.similarity, 0) /
    evidenceSet.length;
  const averageCombined =
    evidenceSet.reduce((sum, rankedCase) => sum + rankedCase.combined, 0) /
    evidenceSet.length;

  const consistencyScore =
    tendency.confidence * 0.45 +
    averageCombined * 0.35 +
    ruleOverlap.coverage * 0.2;
  const ambiguityScore = clamp(1 - consistencyScore, 0, 1);

  if (ambiguityScore >= 0.62 || averageSimilarity < 0.2) {
    return 'high';
  }

  if (ambiguityScore >= 0.38) {
    return 'medium';
  }

  return 'low';
};

const buildOverallExplanation = (
  tendency: ModerationTendency,
  ambiguity: AmbiguityLevel,
  ruleOverlap: RuleOverlapSummary,
  topSimilarCases: SimilarCase[],
  similarApproved: SimilarCase[],
  similarRemoved: SimilarCase[]
): string => {
  const strongestRules = ruleOverlap.rules
    .filter((rule) => rule.hits > 0)
    .slice(0, 3)
    .map((rule) => rule.rule);

  const strongestRuleText =
    strongestRules.length > 0
      ? `Most correlated rules: ${strongestRules.join(', ')}.`
      : 'No strong rule correlations were detected.';

  const topSimilarity =
    topSimilarCases.length > 0
      ? formatPercent(topSimilarCases[0]?.similarity ?? 0)
      : formatPercent(0);

  const approvedLeadCase = similarApproved.at(0);
  const approvedLead = formatPercent(approvedLeadCase?.similarity ?? 0);
  const removedLeadCase = similarRemoved.at(0);
  const removedLead = formatPercent(removedLeadCase?.similarity ?? 0);

  const tendencyText =
    tendency.dominantAction === 'balanced'
      ? `Historical tendency is balanced (${tendency.approvedCount} approved vs ${tendency.removedCount} removed in the evidence window).`
      : `Historical tendency leans ${tendency.dominantAction} with ${formatPercent(
          tendency.confidence
        )} confidence.`;

  return `${tendencyText} Top overall similarity is ${topSimilarity}. Lead approved similarity is ${approvedLead}, lead removed similarity is ${removedLead}. ${strongestRuleText} Ambiguity is ${ambiguity}.`;
};

const toQueryText = (request: TimeMachineAnalyzeRequest): string =>
  [
    request.postTitle,
    request.postBody,
    request.commentText,
    request.subredditRules.join(' '),
  ].join(' ');

const buildRankedCases = (
  request: TimeMachineAnalyzeRequest,
  cases: ModerationCase[]
): RankedCase[] => {
  const queryText = toQueryText(request);
  const similarityScored = scoreSimilarCases(queryText, cases);
  const recencyScores = buildRecencyScores(cases);

  return similarityScored
    .map((result) => {
      const ruleOverlap = scoreRuleOverlap(
        request.subredditRules,
        result.moderationCase
      );
      const recency = recencyScores.get(result.moderationCase.id) ?? 0.5;
      const combined = clamp(
        result.similarity * 0.68 + ruleOverlap * 0.24 + recency * 0.08,
        0,
        1
      );

      return {
        moderationCase: result.moderationCase,
        similarity: result.similarity,
        ruleOverlap,
        recency,
        combined,
      };
    })
    .sort((left, right) => {
      if (right.combined !== left.combined) {
        return right.combined - left.combined;
      }
      return right.similarity - left.similarity;
    });
};

const selectTopByAction = (
  rankedCases: RankedCase[],
  action: ModerationCase['action'],
  limit: number
): SimilarCase[] =>
  rankedCases
    .filter((rankedCase) => rankedCase.moderationCase.action === action)
    .slice(0, limit)
    .map(toSimilarCase);

export const analyzeTimeMachine = async (
  request: TimeMachineAnalyzeRequest
): Promise<TimeMachineAnalyzeResponse> => {
  const start = Date.now();
  const historicalCases = await loadHistoricalCases(request.modHistory);
  const rankedCases = buildRankedCases(request, historicalCases);

  const topSimilarCases = rankedCases.slice(0, 5).map(toSimilarCase);
  const similarApproved = selectTopByAction(rankedCases, 'approved', 5);
  const similarRemoved = selectTopByAction(rankedCases, 'removed', 5);

  const tendency = buildModerationTendency(rankedCases);
  const ruleOverlap = buildRuleOverlapSummary(
    request.subredditRules,
    rankedCases
  );
  const ambiguity = classifyAmbiguity(tendency, rankedCases, ruleOverlap);
  const explanation = buildOverallExplanation(
    tendency,
    ambiguity,
    ruleOverlap,
    topSimilarCases,
    similarApproved,
    similarRemoved
  );

  return {
    similarApproved,
    similarRemoved,
    topSimilarCases,
    moderationTendency: tendency,
    ruleOverlap,
    ambiguity,
    explanation,
    elapsedMs: Date.now() - start,
  };
};
