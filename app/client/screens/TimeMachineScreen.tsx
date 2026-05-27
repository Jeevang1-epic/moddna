import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Input,
  SectionTitle,
  Textarea,
} from '../../../components/ui';
import {
  DEFAULT_MOD_HISTORY_TEXT,
  type TimeMachineSessionState,
} from '../../../lib/client/sessionState';
import type { ModerationCase } from '../../../src/shared/contracts/moderation';
import type {
  AmbiguityLevel,
  SimilarCase,
  TimeMachineAnalyzeResponse,
} from '../../../src/shared/contracts/time-machine';
import { analyzeTimeMachineRequest } from '../features/timeMachine/api';

const parseLines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const manualHistoryBaseTime = Date.UTC(2026, 0, 1, 0, 0, 0, 0);

const toManualHistoryCreatedAt = (index: number): string =>
  new Date(manualHistoryBaseTime - index * 60_000).toISOString();

const parseModerationCase = (value: unknown, index: number): ModerationCase => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`modHistory[${index}] must be an object.`);
  }

  const candidate = value as Record<string, unknown>;
  const action = candidate.action;
  if (action !== 'approved' && action !== 'removed') {
    throw new Error(`modHistory[${index}].action must be approved or removed.`);
  }

  const matchedRules = candidate.matchedRules;
  if (
    !Array.isArray(matchedRules) ||
    !matchedRules.every((rule) => typeof rule === 'string')
  ) {
    throw new Error(`modHistory[${index}].matchedRules must be string[].`);
  }

  const fields = [
    'id',
    'title',
    'body',
    'comment',
    'moderatorNote',
    'createdAt',
  ] as const;
  for (const field of fields) {
    if (typeof candidate[field] !== 'string') {
      throw new Error(`modHistory[${index}].${field} must be a string.`);
    }
  }

  return {
    id: candidate.id as string,
    title: candidate.title as string,
    body: candidate.body as string,
    comment: candidate.comment as string,
    action,
    matchedRules: matchedRules as string[],
    moderatorNote: candidate.moderatorNote as string,
    createdAt: candidate.createdAt as string,
  };
};

const parseModHistory = (value: string): ModerationCase[] => {
  if (!value.trim()) {
    return [];
  }

  const raw = value.trim();

  if (raw.startsWith('[')) {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error('Mod history JSON must be an array.');
    }

    return parsed.map((item, index) => parseModerationCase(item, index));
  }

  const lines = parseLines(raw);

  return lines.map((line, index) => {
    const normalized = line.toLowerCase();
    const action =
      normalized.includes('remove') || normalized.includes('violation')
        ? 'removed'
        : 'approved';

    return {
      id: `manual_line_${index + 1}`,
      title: `Manual history ${index + 1}`,
      body: line,
      comment: line,
      action,
      matchedRules: [],
      moderatorNote: line,
      createdAt: toManualHistoryCreatedAt(index),
    };
  });
};

const toPercent = (value: number): string => `${Math.round(value * 100)}%`;

const ambiguityTone: Record<AmbiguityLevel, 'success' | 'warning' | 'danger'> =
  {
    low: 'success',
    medium: 'warning',
    high: 'danger',
  };

const CaseList = ({
  title,
  tone,
  cases,
}: {
  title: string;
  tone: 'success' | 'danger';
  cases: SimilarCase[];
}) => (
  <Card className="space-y-3">
    <div className="flex items-start justify-between gap-3">
      <SectionTitle>{title}</SectionTitle>
      <Badge tone={tone}>{cases.length} cases</Badge>
    </div>
    {cases.length === 0 && (
      <p className="rounded-xl border border-dashed border-slate-700 px-3 py-5 text-sm text-slate-400">
        No matching examples in this action bucket.
      </p>
    )}
    {cases.map((similarCase) => (
      <div
        key={similarCase.case.id}
        className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/55 p-3.5"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={tone}>{similarCase.case.action}</Badge>
          <Badge>{toPercent(similarCase.similarity)} similarity</Badge>
          <Badge>{toPercent(similarCase.ruleOverlap)} overlap</Badge>
        </div>
        <p className="text-sm font-semibold text-slate-100">
          {similarCase.case.title}
        </p>
        <p className="text-xs leading-5 text-slate-400">
          {similarCase.explanation}
        </p>
      </div>
    ))}
  </Card>
);

type TimeMachineScreenProps = {
  session: TimeMachineSessionState;
  onSessionChange: (
    updater: (current: TimeMachineSessionState) => TimeMachineSessionState
  ) => void;
  onAnalyzeSuccess: (response: TimeMachineAnalyzeResponse) => void;
};

export const TimeMachineScreen = ({
  session,
  onSessionChange,
  onAnalyzeSuccess,
}: TimeMachineScreenProps) => {
  const {
    postTitle,
    postBody,
    commentText,
    rulesText,
    modHistoryText,
    result,
  } = session;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onAnalyze = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyzeTimeMachineRequest({
        postTitle,
        postBody,
        commentText,
        subredditRules: parseLines(rulesText),
        modHistory: parseModHistory(modHistoryText),
      });
      onAnalyzeSuccess(response);
    } catch (analysisError) {
      onSessionChange((current) => ({
        ...current,
        result: null,
      }));
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : 'Failed to analyze moderation case.'
      );
    } finally {
      setLoading(false);
    }
  };

  const onClear = (): void => {
    onSessionChange(() => ({
      postTitle: '',
      postBody: '',
      commentText: '',
      rulesText: '',
      modHistoryText: DEFAULT_MOD_HISTORY_TEXT,
      result: null,
    }));
    setError(null);
  };

  const tendencyLabel =
    result?.moderationTendency.dominantAction === 'balanced'
      ? 'Balanced'
      : `Leans ${result?.moderationTendency.dominantAction}`;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Card className="space-y-4">
          <SectionTitle subtitle="Analyze content against historical precedents">
            Time Machine
          </SectionTitle>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Post Title
              </label>
              <Input
                value={postTitle}
                placeholder="Summarize the post topic"
                onChange={(event) =>
                  onSessionChange((current) => ({
                    ...current,
                    postTitle: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Comment Text
              </label>
              <Input
                value={commentText}
                placeholder="Primary comment content"
                onChange={(event) =>
                  onSessionChange((current) => ({
                    ...current,
                    commentText: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Post Body
            </label>
            <Textarea
              rows={5}
              value={postBody}
              placeholder="Paste full post body context"
              onChange={(event) =>
                onSessionChange((current) => ({
                  ...current,
                  postBody: event.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Subreddit Rules (one per line)
              </label>
              <Textarea
                rows={8}
                value={rulesText}
                placeholder={'No self-promotion\nBe civil\nStay on topic'}
                onChange={(event) =>
                  onSessionChange((current) => ({
                    ...current,
                    rulesText: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Mod History (JSON array or one line per case)
              </label>
              <Textarea
                rows={8}
                value={modHistoryText}
                onChange={(event) =>
                  onSessionChange((current) => ({
                    ...current,
                    modHistoryText: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => void onAnalyze()} disabled={loading}>
              {loading ? 'Analyzing...' : 'Analyze Case'}
            </Button>
            <Button tone="subtle" onClick={onClear} disabled={loading}>
              Clear
            </Button>
            <Badge>{parseLines(rulesText).length} rules</Badge>
            <Badge>{parseLines(modHistoryText).length} history lines</Badge>
          </div>

          {error && (
            <p className="rounded-xl border border-rose-400/30 bg-rose-500/12 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}
        </Card>

        <Card className="space-y-3">
          <SectionTitle subtitle="Current analysis state">
            Analysis Summary
          </SectionTitle>
          {!result && !loading && (
            <p className="rounded-xl border border-dashed border-slate-700 px-3 py-4 text-sm text-slate-400">
              Submit content to retrieve similar precedents, ambiguity level,
              and rule overlap confidence.
            </p>
          )}
          {loading && (
            <p className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-3 py-4 text-sm text-indigo-200">
              Running retrieval and trend analysis.
            </p>
          )}
          {result && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge tone={ambiguityTone[result.ambiguity]}>
                  Ambiguity {result.ambiguity}
                </Badge>
                <Badge tone="info">{tendencyLabel}</Badge>
              </div>
              <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/55 p-3">
                <p className="flex items-center justify-between text-sm text-slate-300">
                  <span>Similar precedents</span>
                  <span className="font-semibold text-slate-100">
                    {result.topSimilarCases.length}
                  </span>
                </p>
                <p className="flex items-center justify-between text-sm text-slate-300">
                  <span>Rule coverage</span>
                  <span className="font-semibold text-slate-100">
                    {toPercent(result.ruleOverlap.coverage)}
                  </span>
                </p>
                <p className="flex items-center justify-between text-sm text-slate-300">
                  <span>Confidence</span>
                  <span className="font-semibold text-slate-100">
                    {toPercent(result.moderationTendency.confidence)}
                  </span>
                </p>
                <p className="flex items-center justify-between text-sm text-slate-300">
                  <span>Latency</span>
                  <span className="font-semibold text-slate-100">
                    {result.elapsedMs}ms
                  </span>
                </p>
              </div>
              <p className="text-sm leading-6 text-slate-300">
                {result.explanation}
              </p>
            </div>
          )}
        </Card>
      </div>

      {result && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <CaseList
              title="Similar Approved Examples"
              tone="success"
              cases={result.similarApproved}
            />
            <CaseList
              title="Similar Removed Examples"
              tone="danger"
              cases={result.similarRemoved}
            />
          </div>

          <Card className="space-y-3">
            <SectionTitle subtitle="Rules with strongest correlation in top matches">
              Rule Overlap
            </SectionTitle>
            {result.ruleOverlap.rules.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-700 px-3 py-5 text-sm text-slate-400">
                No subreddit rules were provided.
              </p>
            )}
            {result.ruleOverlap.rules.map((rule) => (
              <div key={rule.rule} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
                  <span className="font-medium text-slate-100">
                    {rule.rule}
                  </span>
                  <span>
                    {rule.hits} matches ({toPercent(rule.weight)})
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 transition-all"
                    style={{ width: `${Math.round(rule.weight * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
};
