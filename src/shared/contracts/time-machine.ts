import type { ModerationAction, ModerationCase } from './moderation';

export type TimeMachineAnalyzeRequest = {
  postTitle: string;
  postBody: string;
  commentText: string;
  subredditRules: string[];
  modHistory: ModerationCase[];
};

export type SimilarCase = {
  case: ModerationCase;
  similarity: number;
  ruleOverlap: number;
  explanation: string;
};

export type ModerationTendency = {
  approvedCount: number;
  removedCount: number;
  approvedRate: number;
  removedRate: number;
  dominantAction: ModerationAction | 'balanced';
  confidence: number;
};

export type RuleOverlapSummary = {
  coverage: number;
  rules: Array<{
    rule: string;
    hits: number;
    weight: number;
  }>;
};

export type AmbiguityLevel = 'low' | 'medium' | 'high';

export type TimeMachineAnalyzeResponse = {
  similarApproved: SimilarCase[];
  similarRemoved: SimilarCase[];
  topSimilarCases: SimilarCase[];
  moderationTendency: ModerationTendency;
  ruleOverlap: RuleOverlapSummary;
  ambiguity: AmbiguityLevel;
  explanation: string;
  elapsedMs: number;
};

export type TimeMachineAnalyzeErrorResponse = {
  status: 'error';
  message: string;
};
