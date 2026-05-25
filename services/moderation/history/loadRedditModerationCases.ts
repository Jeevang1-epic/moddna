import { reddit } from '@devvit/web/server';
import type { ModerationCase } from '../../../src/shared/contracts/moderation';

type LoadRedditModerationCasesInput = {
  subredditName?: string;
  subredditRules: string[];
};

type RulePattern = {
  rule: string;
  normalizedRule: string;
  tokens: string[];
};

type RedditPost = Awaited<
  ReturnType<ReturnType<typeof reddit.getNewPosts>['all']>
>[number];
type RedditComment = Awaited<
  ReturnType<ReturnType<typeof reddit.getComments>['all']>
>[number];
type RedditModAction = Awaited<
  ReturnType<ReturnType<typeof reddit.getModerationLog>['all']>
>[number];
type RedditModActionType = RedditModAction['type'];

const stopWords = new Set<string>([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'has',
  'have',
  'if',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'this',
  'to',
  'was',
  'were',
  'with',
  'you',
  'your',
  'our',
  'their',
]);

const moderationActionMap: Record<
  RedditModActionType,
  'approved' | 'removed' | null
> = {
  banuser: null,
  unbanuser: null,
  spamlink: 'removed',
  removelink: 'removed',
  approvelink: 'approved',
  spamcomment: 'removed',
  removecomment: 'removed',
  approvecomment: 'approved',
  addmoderator: null,
  showcomment: 'approved',
  invitemoderator: null,
  uninvitemoderator: null,
  acceptmoderatorinvite: null,
  removemoderator: null,
  addcontributor: null,
  removecontributor: null,
  editsettings: null,
  editflair: null,
  distinguish: null,
  marknsfw: null,
  wikibanned: null,
  wikicontributor: null,
  wikiunbanned: null,
  wikipagelisted: null,
  removewikicontributor: null,
  wikirevise: null,
  wikipermlevel: null,
  ignorereports: null,
  unignorereports: null,
  setpermissions: null,
  setsuggestedsort: null,
  sticky: null,
  unsticky: null,
  setcontestmode: null,
  unsetcontestmode: null,
  lock: null,
  unlock: null,
  muteuser: null,
  unmuteuser: null,
  createrule: null,
  editrule: null,
  reorderrules: null,
  deleterule: null,
  spoiler: null,
  unspoiler: null,
  modmail_enrollment: null,
  community_styling: null,
  community_widgets: null,
  markoriginalcontent: null,
  collections: null,
  events: null,
  create_award: null,
  disable_award: null,
  delete_award: null,
  enable_award: null,
  mod_award_given: null,
  hidden_award: null,
  add_community_topics: null,
  remove_community_topics: null,
  create_scheduled_post: null,
  edit_scheduled_post: null,
  delete_scheduled_post: null,
  submit_scheduled_post: null,
  edit_post_requirements: null,
  invitesubscriber: null,
  submit_content_rating_survey: null,
  adjust_post_crowd_control_level: null,
  enable_post_crowd_control_filter: null,
  disable_post_crowd_control_filter: null,
  deleteoverriddenclassification: null,
  overrideclassification: null,
  reordermoderators: null,
  snoozereports: null,
  unsnoozereports: null,
  addnote: null,
  deletenote: null,
  addremovalreason: null,
  createremovalreason: null,
  updateremovalreason: null,
  deleteremovalreason: null,
  reorderremovalreason: null,
  dev_platform_app_changed: null,
  dev_platform_app_disabled: null,
  dev_platform_app_enabled: null,
  dev_platform_app_installed: null,
  dev_platform_app_uninstalled: null,
};

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value: string): string[] =>
  normalizeText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !stopWords.has(token));

const toRulePattern = (rule: string): RulePattern => ({
  rule,
  normalizedRule: normalizeText(rule),
  tokens: tokenize(rule),
});

const matchRules = (text: string, patterns: RulePattern[]): string[] => {
  const normalizedText = normalizeText(text);
  const textTokens = new Set(tokenize(text));
  const scored = patterns
    .map((pattern) => {
      if (!pattern.normalizedRule || pattern.tokens.length === 0) {
        return null;
      }

      if (normalizedText.includes(pattern.normalizedRule)) {
        return {
          rule: pattern.rule,
          score: 1,
        };
      }

      const overlap = pattern.tokens.filter((token) =>
        textTokens.has(token)
      ).length;
      const score = overlap / pattern.tokens.length;
      if (score < 0.45) {
        return null;
      }

      return {
        rule: pattern.rule,
        score,
      };
    })
    .filter((value): value is { rule: string; score: number } => value !== null)
    .sort((left, right) => right.score - left.score);

  return scored.slice(0, 4).map((item) => item.rule);
};

const extractPostAction = (post: RedditPost): 'approved' | 'removed' => {
  if (post.removed || post.spam || post.removedByCategory) {
    return 'removed';
  }

  if (post.approved) {
    return 'approved';
  }

  if (post.numberOfReports >= 3 && post.score <= 0) {
    return 'removed';
  }

  return 'approved';
};

const extractCommentAction = (
  comment: RedditComment
): 'approved' | 'removed' => {
  if (comment.removed || comment.spam) {
    return 'removed';
  }

  if (comment.approved) {
    return 'approved';
  }

  if (comment.numReports >= 2 && comment.score <= 0) {
    return 'removed';
  }

  return 'approved';
};

const toIsoDate = (value: Date): string => {
  const time = value.getTime();
  if (Number.isNaN(time)) {
    return new Date(0).toISOString();
  }
  return value.toISOString();
};

const toPostCase = (
  post: RedditPost,
  patterns: RulePattern[]
): ModerationCase => {
  const body = post.body ?? '';
  const contextText = [post.title, body].join('\n');
  const action = extractPostAction(post);
  const moderatorNote = `Recent post signal: score=${post.score}, reports=${post.numberOfReports}, removedBy=${post.removedByCategory ?? 'none'}.`;

  return {
    id: `reddit_post_${post.id}`,
    title: post.title,
    body,
    comment: body,
    action,
    matchedRules: matchRules(contextText, patterns),
    moderatorNote,
    createdAt: toIsoDate(post.createdAt),
  };
};

const toCommentCase = (
  comment: RedditComment,
  postTitle: string,
  patterns: RulePattern[]
): ModerationCase => {
  const action = extractCommentAction(comment);
  const moderatorNote = `Recent comment signal: score=${comment.score}, reports=${comment.numReports}.`;
  const title = postTitle
    ? `Comment on: ${postTitle.slice(0, 80)}`
    : `Comment ${comment.id}`;

  return {
    id: `reddit_comment_${comment.id}`,
    title,
    body: comment.body,
    comment: comment.body,
    action,
    matchedRules: matchRules(comment.body, patterns),
    moderatorNote,
    createdAt: toIsoDate(comment.createdAt),
  };
};

const toModActionCase = (
  action: RedditModAction,
  mappedAction: 'approved' | 'removed',
  patterns: RulePattern[]
): ModerationCase => {
  const targetBody = action.target?.body ?? '';
  const targetTitle = action.target?.title ?? '';
  const description = action.description ?? '';
  const details = action.details ?? '';
  const content = [targetTitle, targetBody, description, details].join('\n');

  return {
    id: `reddit_modaction_${action.id}`,
    title: targetTitle || `Moderation action: ${action.type}`,
    body: targetBody || details || description,
    comment: details || description || targetBody,
    action: mappedAction,
    matchedRules: matchRules(content, patterns),
    moderatorNote: `Moderation log: ${action.type}${details ? ` (${details})` : ''}.`,
    createdAt: toIsoDate(action.createdAt),
  };
};

const loadRecentPosts = async (
  subredditName: string
): Promise<RedditPost[]> => {
  try {
    return await reddit
      .getNewPosts({
        subredditName,
        limit: 12,
        pageSize: 12,
      })
      .all();
  } catch {
    return [];
  }
};

const loadRecentComments = async (
  posts: RedditPost[]
): Promise<Array<{ postTitle: string; comment: RedditComment }>> => {
  const parentPosts = posts.slice(0, 4);
  const settled = await Promise.allSettled(
    parentPosts.map(async (post) => ({
      postTitle: post.title,
      comments: await reddit
        .getComments({
          postId: post.id,
          sort: 'new',
          limit: 6,
          pageSize: 6,
        })
        .all(),
    }))
  );

  const result: Array<{ postTitle: string; comment: RedditComment }> = [];
  for (const item of settled) {
    if (item.status !== 'fulfilled') {
      continue;
    }

    for (const comment of item.value.comments.slice(0, 5)) {
      result.push({
        postTitle: item.value.postTitle,
        comment,
      });
    }
  }

  return result;
};

const loadModerationLogCases = async (
  subredditName: string,
  patterns: RulePattern[]
): Promise<ModerationCase[]> => {
  try {
    const modActions = await reddit
      .getModerationLog({
        subredditName,
        limit: 30,
        pageSize: 30,
      })
      .all();

    return modActions
      .map((action) => {
        const mapped = moderationActionMap[action.type];
        if (!mapped) {
          return null;
        }
        return toModActionCase(action, mapped, patterns);
      })
      .filter((item): item is ModerationCase => item !== null);
  } catch {
    return [];
  }
};

const toTime = (value: string): number => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const loadRedditModerationCases = async ({
  subredditName,
  subredditRules,
}: LoadRedditModerationCasesInput): Promise<ModerationCase[]> => {
  if (!subredditName) {
    return [];
  }

  const patterns = [...new Set(subredditRules.map((rule) => rule.trim()))]
    .filter((rule) => rule.length > 0)
    .map(toRulePattern);

  const recentPosts = await loadRecentPosts(subredditName);
  const postCases = recentPosts.map((post) => toPostCase(post, patterns));

  const recentComments = await loadRecentComments(recentPosts);
  const commentCases = recentComments.map(({ postTitle, comment }) =>
    toCommentCase(comment, postTitle, patterns)
  );

  const modActionCases = await loadModerationLogCases(subredditName, patterns);

  const deduped = new Map<string, ModerationCase>();
  for (const moderationCase of [
    ...postCases,
    ...commentCases,
    ...modActionCases,
  ]) {
    deduped.set(moderationCase.id, moderationCase);
  }

  return [...deduped.values()]
    .sort((left, right) => toTime(right.createdAt) - toTime(left.createdAt))
    .slice(0, 120);
};
