import type { ModerationCase } from '../../../../src/shared/contracts/moderation';
import type { ConstitutionBuildRequest } from '../../../../src/shared/contracts/constitution';
import type { TimeMachineAnalyzeRequest } from '../../../../src/shared/contracts/time-machine';

const asRecord = (value: unknown, name: string): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${name} must be an object.`);
  }
  return value as Record<string, unknown>;
};

const asString = (value: unknown, name: string): string => {
  if (typeof value !== 'string') {
    throw new Error(`${name} must be a string.`);
  }
  return value.trim();
};

const asStringArray = (value: unknown, name: string): string[] => {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === 'string')
  ) {
    throw new Error(`${name} must be an array of strings.`);
  }
  return value.map((item) => item.trim()).filter((item) => item.length > 0);
};

const parseRuleLines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .flatMap((line) => line.split(','))
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const asRulesInput = (value: unknown, name: string): string[] => {
  if (typeof value === 'string') {
    return parseRuleLines(value);
  }

  return asStringArray(value, name);
};

const asAction = (value: unknown): 'approved' | 'removed' => {
  if (value === 'approved' || value === 'removed') {
    return value;
  }
  throw new Error('modHistory.action must be either "approved" or "removed".');
};

const parseModerationCase = (value: unknown, index: number): ModerationCase => {
  const candidate = asRecord(value, `modHistory[${index}]`);
  const id = asString(candidate.id, `modHistory[${index}].id`);
  const title = asString(candidate.title, `modHistory[${index}].title`);
  const body = asString(candidate.body, `modHistory[${index}].body`);
  const comment = asString(candidate.comment, `modHistory[${index}].comment`);
  const action = asAction(candidate.action);
  const matchedRules = asStringArray(
    candidate.matchedRules,
    `modHistory[${index}].matchedRules`
  );
  const moderatorNote = asString(
    candidate.moderatorNote,
    `modHistory[${index}].moderatorNote`
  );
  const createdAt = asString(
    candidate.createdAt,
    `modHistory[${index}].createdAt`
  );

  return {
    id,
    title,
    body,
    comment,
    action,
    matchedRules,
    moderatorNote,
    createdAt,
  };
};

export const parseTimeMachineRequest = (
  payload: unknown
): TimeMachineAnalyzeRequest => {
  const candidate = asRecord(payload, 'request body');
  const postTitle = asString(candidate.postTitle, 'postTitle');
  const postBody = asString(candidate.postBody, 'postBody');
  const commentText = asString(candidate.commentText, 'commentText');
  const subredditRules = asRulesInput(
    candidate.subredditRules,
    'subredditRules'
  );

  if (!Array.isArray(candidate.modHistory)) {
    throw new Error('modHistory must be an array.');
  }
  const modHistory = candidate.modHistory.map((item, index) =>
    parseModerationCase(item, index)
  );

  return {
    postTitle,
    postBody,
    commentText,
    subredditRules,
    modHistory,
  };
};

export const parseConstitutionRequest = (
  payload: unknown
): ConstitutionBuildRequest => {
  const candidate = asRecord(payload, 'request body');
  const rules = asStringArray(candidate.rules, 'rules');
  const modLog = asStringArray(candidate.modLog, 'modLog');
  const removalPatterns = asStringArray(
    candidate.removalPatterns,
    'removalPatterns'
  );

  return {
    rules,
    modLog,
    removalPatterns,
  };
};
