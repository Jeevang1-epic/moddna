export type ConstitutionBuildRequest = {
  rules: string[];
  modLog: string[];
  removalPatterns: string[];
};

export type ConstitutionBuildResponse = {
  moderationPhilosophy: string;
  onboardingSummary: string;
  suggestedAutoModeratorRules: string[];
  supportingSignals: Array<{
    theme: string;
    evidence: string[];
  }>;
  elapsedMs: number;
};

export type ConstitutionBuildErrorResponse = {
  status: 'error';
  message: string;
};
