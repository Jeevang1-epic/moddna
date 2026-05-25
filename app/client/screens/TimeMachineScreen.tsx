import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Input,
  SectionTitle,
  Textarea,
} from '../../../components/ui';
import type { ModerationCase } from '../../../src/shared/contracts/moderation';
import type {
  AmbiguityLevel,
  SimilarCase,
  TimeMachineAnalyzeResponse,
} from '../../../src/shared/contracts/time-machine';
import { analyzeTimeMachineRequest } from '../features/timeMachine/api';

const defaultModHistoryJson = `[
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

const parseLines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

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
  const now = Date.now();

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
      createdAt: new Date(now - index * 60_000).toISOString(),
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
      <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-5 text-sm text-zinc-600">
        No matching examples in this action bucket.
      </p>
    )}
    {cases.map((similarCase) => (
      <div
        key={similarCase.case.id}
        className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3"
      >
        <div className="flex items-center gap-2">
          <Badge tone={tone}>{similarCase.case.action}</Badge>
          <Badge>{toPercent(similarCase.similarity)} similarity</Badge>
          <Badge>{toPercent(similarCase.ruleOverlap)} overlap</Badge>
        </div>
        <p className="text-sm font-semibold text-zinc-900">
          {similarCase.case.title}
        </p>
        <p className="text-xs text-zinc-600">{similarCase.explanation}</p>
      </div>
    ))}
  </Card>
);

export const TimeMachineScreen = () => {
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [commentText, setCommentText] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [modHistoryText, setModHistoryText] = useState(defaultModHistoryJson);
  const [result, setResult] = useState<TimeMachineAnalyzeResponse | null>(null);
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
      setResult(response);
    } catch (analysisError) {
      setResult(null);
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : 'Failed to analyze moderation case.'
      );
    } finally {
      setLoading(false);
    }
  };

  const tendencyLabel =
    result?.moderationTendency.dominantAction === 'balanced'
      ? 'balanced'
      : `leans ${result?.moderationTendency.dominantAction}`;

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <SectionTitle subtitle="Compare new cases against historical outcomes">
          Time Machine
        </SectionTitle>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-800">
              Post Title
            </label>
            <Input
              value={postTitle}
              placeholder="Summarize the post topic"
              onChange={(event) => setPostTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-800">
              Comment Text
            </label>
            <Input
              value={commentText}
              placeholder="Primary comment content"
              onChange={(event) => setCommentText(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-800">Post Body</label>
          <Textarea
            rows={5}
            value={postBody}
            placeholder="Paste full post body context"
            onChange={(event) => setPostBody(event.target.value)}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-800">
              Subreddit Rules (one per line)
            </label>
            <Textarea
              rows={8}
              value={rulesText}
              placeholder={'No self-promotion\nBe civil\nStay on topic'}
              onChange={(event) => setRulesText(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-800">
              Mod History (JSON array or one line per case)
            </label>
            <Textarea
              rows={8}
              value={modHistoryText}
              onChange={(event) => setModHistoryText(event.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => void onAnalyze()} disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Case'}
          </Button>
          <Badge>{parseLines(rulesText).length} rules</Badge>
          <Badge>{parseLines(modHistoryText).length} history lines</Badge>
        </div>
        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
      </Card>

      {loading && (
        <Card tone="muted">
          <p className="text-sm text-zinc-700">
            Running retrieval and trend analysis across historical cases.
          </p>
        </Card>
      )}

      {!loading && !result && !error && (
        <Card tone="muted">
          <p className="text-sm text-zinc-700">
            Run an analysis to view similar approved and removed examples, trend
            direction, overlap, and ambiguity.
          </p>
        </Card>
      )}

      {result && (
        <>
          <Card className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <SectionTitle subtitle="Decision tendency and confidence overview">
                Analysis Summary
              </SectionTitle>
              <Badge tone={ambiguityTone[result.ambiguity]}>
                Ambiguity {result.ambiguity}
              </Badge>
            </div>
            <p className="text-sm text-zinc-800">{result.explanation}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Tendency
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {tendencyLabel}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Confidence
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {toPercent(result.moderationTendency.confidence)}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Rule Coverage
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {toPercent(result.ruleOverlap.coverage)}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Latency
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {result.elapsedMs}ms
                </p>
              </div>
            </div>
          </Card>

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
              <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-5 text-sm text-zinc-600">
                No subreddit rules were provided.
              </p>
            )}
            {result.ruleOverlap.rules.map((rule) => (
              <div key={rule.rule} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm text-zinc-700">
                  <span className="font-medium text-zinc-900">{rule.rule}</span>
                  <span>
                    {rule.hits} matches ({toPercent(rule.weight)})
                  </span>
                </div>
                <div className="h-2 rounded-full bg-zinc-100">
                  <div
                    className="h-2 rounded-full bg-zinc-700 transition-all"
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
