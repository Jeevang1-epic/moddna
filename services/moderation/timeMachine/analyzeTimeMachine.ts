import type {
  AmbiguityLevel,
  ModerationTendency,
  RuleOverlapSummary,
  SimilarCase,
  TimeMachineAnalyzeRequest,
  TimeMachineAnalyzeResponse,
} from '../../../src/shared/contracts/time-machine';
import type { ModerationCase } from '../../../src/shared/contracts/moderation';
import { loadHistoricalCases } from '../history/loadHistoricalCases';
import { scoreSimilarCases } from '../retrieval/similarity';

const formatPercent = (value: number): string => `${Math.round(value * 100)}%`;

const normalizeRule = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

const isRuleRelated = (ruleA: string, ruleB: string): boolean => {
  const a = normalizeRule(ruleA);
  const b = normalizeRule(ruleB);
  if (!a || !b) {
    return false;
  }

  return a === b || a.includes(b) || b.includes(a);
};

const scoreRuleOverlap = (
  subredditRules: string[],
  moderationCase: ModerationCase
): number => {
  const cleanedRules = subredditRules
    .map((rule) => rule.trim())
    .filter((rule) => rule.length > 0);
  if (cleanedRules.length === 0) {
    return 0;
  }

  const matchedCount = cleanedRules.filter((rule) =>
    moderationCase.matchedRules.some((caseRule) =>
      isRuleRelated(rule, caseRule)
    )
  ).length;

  return matchedCount / cleanedRules.length;
};

const buildCaseExplanation = (
  similarity: number,
  ruleOverlap: number,
  moderationCase: ModerationCase
): string =>
  `${moderationCase.action} precedent with ${formatPercent(
    similarity
  )} textual similarity and ${formatPercent(ruleOverlap)} rule overlap.`;

const buildModerationTendency = (
  similarCases: SimilarCase[]
): ModerationTendency => {
  const approvedCount = similarCases.filter(
    (similarCase) => similarCase.case.action === 'approved'
  ).length;
  const removedCount = similarCases.length - approvedCount;
  const total = similarCases.length || 1;
  const approvedRate = approvedCount / total;
  const removedRate = removedCount / total;
  const confidence = Math.abs(approvedRate - removedRate);

  let dominantAction: ModerationTendency['dominantAction'] = 'balanced';
  if (confidence >= 0.15) {
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
  topSimilarCases: SimilarCase[]
): RuleOverlapSummary => {
  const cleanedRules = subredditRules
    .map((rule) => rule.trim())
    .filter((rule) => rule.length > 0);
  if (cleanedRules.length === 0) {
    return {
      coverage: 0,
      rules: [],
    };
  }

  const rules = cleanedRules.map((rule) => {
    const hits = topSimilarCases.filter((similarCase) =>
      similarCase.case.matchedRules.some((caseRule) =>
        isRuleRelated(rule, caseRule)
      )
    ).length;
    const weight =
      topSimilarCases.length > 0 ? hits / topSimilarCases.length : 0;
    return { rule, hits, weight };
  });

  const coveredRules = rules.filter((rule) => rule.hits > 0).length;

  return {
    coverage: coveredRules / cleanedRules.length,
    rules: rules.sort((left, right) => right.weight - left.weight),
  };
};

const classifyAmbiguity = (
  tendency: ModerationTendency,
  topSimilarCases: SimilarCase[],
  ruleOverlap: RuleOverlapSummary
): AmbiguityLevel => {
  const averageSimilarity =
    topSimilarCases.length === 0
      ? 0
      : topSimilarCases.reduce(
          (sum, similarCase) => sum + similarCase.similarity,
          0
        ) / topSimilarCases.length;

  const consistencyScore =
    tendency.confidence * 0.45 +
    averageSimilarity * 0.35 +
    ruleOverlap.coverage * 0.2;
  const ambiguityScore = 1 - consistencyScore;

  if (ambiguityScore >= 0.62) {
    return 'high';
  }

  if (ambiguityScore >= 0.36) {
    return 'medium';
  }

  return 'low';
};

const buildOverallExplanation = (
  tendency: ModerationTendency,
  ambiguity: AmbiguityLevel,
  ruleOverlap: RuleOverlapSummary,
  topSimilarCases: SimilarCase[]
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

  const tendencyText =
    tendency.dominantAction === 'balanced'
      ? `Historical tendency is balanced (${tendency.approvedCount} approved vs ${tendency.removedCount} removed).`
      : `Historical tendency leans ${tendency.dominantAction} with ${formatPercent(
          tendency.confidence
        )} confidence.`;

  return `${tendencyText} Top similarity score is ${topSimilarity}. ${strongestRuleText} Ambiguity is ${ambiguity}.`;
};

const toQueryText = (request: TimeMachineAnalyzeRequest): string =>
  [
    request.postTitle,
    request.postBody,
    request.commentText,
    request.subredditRules.join(' '),
  ].join(' ');

export const analyzeTimeMachine = async (
  request: TimeMachineAnalyzeRequest
): Promise<TimeMachineAnalyzeResponse> => {
  const start = Date.now();

  const historicalCases = await loadHistoricalCases(request.modHistory);
  const queryText = toQueryText(request);
  const scored = scoreSimilarCases(queryText, historicalCases);

  const topSimilarCases: SimilarCase[] = scored.slice(0, 10).map((result) => {
    const ruleOverlap = scoreRuleOverlap(
      request.subredditRules,
      result.moderationCase
    );
    return {
      case: result.moderationCase,
      similarity: result.similarity,
      ruleOverlap,
      explanation: buildCaseExplanation(
        result.similarity,
        ruleOverlap,
        result.moderationCase
      ),
    };
  });

  const similarApproved = topSimilarCases
    .filter((result) => result.case.action === 'approved')
    .slice(0, 5);
  const similarRemoved = topSimilarCases
    .filter((result) => result.case.action === 'removed')
    .slice(0, 5);

  const tendency = buildModerationTendency(topSimilarCases);
  const ruleOverlap = buildRuleOverlapSummary(
    request.subredditRules,
    topSimilarCases
  );
  const ambiguity = classifyAmbiguity(tendency, topSimilarCases, ruleOverlap);
  const explanation = buildOverallExplanation(
    tendency,
    ambiguity,
    ruleOverlap,
    topSimilarCases
  );

  return {
    similarApproved,
    similarRemoved,
    topSimilarCases: topSimilarCases.slice(0, 5),
    moderationTendency: tendency,
    ruleOverlap,
    ambiguity,
    explanation,
    elapsedMs: Date.now() - start,
  };
};
