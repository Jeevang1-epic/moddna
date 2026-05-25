export type ModerationAction = 'approved' | 'removed';

export type ModerationCase = {
  id: string;
  title: string;
  body: string;
  comment: string;
  action: ModerationAction;
  matchedRules: string[];
  moderatorNote: string;
  createdAt: string;
};
