import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ModerationCase } from '../../../src/shared/contracts/moderation';
import { readAppEnv } from '../../../lib/config/env';
import { loadRedditModerationCases } from './loadRedditModerationCases';
import { loadSeedModerationCases } from './seedHistory';

type SupabaseCaseRow = {
  id: string;
  title: string;
  body: string;
  comment: string;
  action: 'approved' | 'removed';
  matched_rules: string[] | string | null;
  moderator_note: string;
  created_at: string;
};

const mapSupabaseRow = (row: SupabaseCaseRow): ModerationCase => {
  const matchedRules =
    typeof row.matched_rules === 'string'
      ? row.matched_rules
          .split('\n')
          .flatMap((line) => line.split(','))
          .map((rule) => rule.trim())
          .filter((rule) => rule.length > 0)
      : Array.isArray(row.matched_rules)
        ? row.matched_rules.filter(
            (rule): rule is string => typeof rule === 'string'
          )
        : [];

  return {
    id: row.id,
    title: row.title,
    body: row.body,
    comment: row.comment,
    action: row.action,
    matchedRules,
    moderatorNote: row.moderator_note,
    createdAt: row.created_at,
  };
};

const loadCasesFromSupabase = async (
  supabase: SupabaseClient
): Promise<ModerationCase[]> => {
  const { data, error } = await supabase
    .from('moderation_cases')
    .select(
      'id,title,body,comment,action,matched_rules,moderator_note,created_at'
    )
    .order('created_at', { ascending: false })
    .limit(300);

  if (error || !data) {
    return [];
  }

  return (data as SupabaseCaseRow[]).map(mapSupabaseRow);
};

const toTime = (value: string): number => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const mergeCases = (
  modHistory: ModerationCase[],
  storedCases: ModerationCase[],
  redditCases: ModerationCase[],
  seedCases: ModerationCase[]
): ModerationCase[] => {
  const merged = new Map<string, ModerationCase>();
  for (const moderationCase of [
    ...seedCases,
    ...storedCases,
    ...redditCases,
    ...modHistory,
  ]) {
    merged.set(moderationCase.id, moderationCase);
  }

  return [...merged.values()]
    .sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt))
    .slice(0, 300);
};

const loadRemoteCasesIfConfigured = async (): Promise<ModerationCase[]> => {
  let env;
  try {
    env = readAppEnv();
  } catch {
    return [];
  }

  if (
    env.storageDriver !== 'supabase' ||
    !env.supabaseUrl ||
    !env.supabaseAnonKey
  ) {
    return [];
  }

  const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);
  try {
    return await loadCasesFromSupabase(supabase);
  } catch {
    return [];
  }
};

type LoadHistoricalCasesOptions = {
  subredditName?: string;
  subredditRules?: string[];
};

export const loadHistoricalCases = async (
  modHistory: ModerationCase[],
  options: LoadHistoricalCasesOptions = {}
): Promise<ModerationCase[]> => {
  const seedCases = loadSeedModerationCases();
  const [remoteCases, redditCases] = await Promise.all([
    loadRemoteCasesIfConfigured(),
    loadRedditModerationCases({
      subredditName: options.subredditName,
      subredditRules: options.subredditRules ?? [],
    }),
  ]);

  return mergeCases(modHistory, remoteCases, redditCases, seedCases);
};
