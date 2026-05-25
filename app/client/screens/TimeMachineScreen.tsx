import { useState } from 'react';
import {
  Button,
  Card,
  Input,
  SectionTitle,
  Textarea,
} from '../../../components/ui';
import type { ModerationCase } from '../../../src/shared/contracts/moderation';
import type { TimeMachineAnalyzeResponse } from '../../../src/shared/contracts/time-machine';
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

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <SectionTitle>Time Machine</SectionTitle>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-800">
            Post Title
          </label>
          <Input
            value={postTitle}
            onChange={(event) => setPostTitle(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-800">Post Body</label>
          <Textarea
            rows={4}
            value={postBody}
            onChange={(event) => setPostBody(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-800">
            Comment Text
          </label>
          <Textarea
            rows={3}
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-800">
            Subreddit Rules (one per line)
          </label>
          <Textarea
            rows={5}
            value={rulesText}
            onChange={(event) => setRulesText(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-800">
            Mod History (JSON array or one line per case)
          </label>
          <Textarea
            rows={10}
            value={modHistoryText}
            onChange={(event) => setModHistoryText(event.target.value)}
          />
        </div>
        <Button onClick={() => void onAnalyze()} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Case'}
        </Button>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </Card>

      {result && (
        <>
          <Card className="space-y-3">
            <SectionTitle>Analysis Summary</SectionTitle>
            <p className="text-sm text-zinc-800">{result.explanation}</p>
            <p className="text-sm text-zinc-700">
              Ambiguity:{' '}
              <span className="font-semibold">{result.ambiguity}</span>
            </p>
            <p className="text-sm text-zinc-700">
              Tendency: approved {result.moderationTendency.approvedCount} /
              removed {result.moderationTendency.removedCount}
            </p>
            <p className="text-sm text-zinc-700">
              Elapsed: {result.elapsedMs}ms
            </p>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="space-y-3">
              <SectionTitle>Similar Approved Examples</SectionTitle>
              {result.similarApproved.map((similar) => (
                <div
                  key={similar.case.id}
                  className="rounded-md border border-zinc-200 p-3"
                >
                  <p className="text-sm font-semibold text-zinc-900">
                    {similar.case.title}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {similar.explanation}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Similarity {toPercent(similar.similarity)} | Rule overlap{' '}
                    {toPercent(similar.ruleOverlap)}
                  </p>
                </div>
              ))}
            </Card>

            <Card className="space-y-3">
              <SectionTitle>Similar Removed Examples</SectionTitle>
              {result.similarRemoved.map((similar) => (
                <div
                  key={similar.case.id}
                  className="rounded-md border border-zinc-200 p-3"
                >
                  <p className="text-sm font-semibold text-zinc-900">
                    {similar.case.title}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {similar.explanation}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Similarity {toPercent(similar.similarity)} | Rule overlap{' '}
                    {toPercent(similar.ruleOverlap)}
                  </p>
                </div>
              ))}
            </Card>
          </div>

          <Card className="space-y-3">
            <SectionTitle>Rule Overlap</SectionTitle>
            {result.ruleOverlap.rules.map((rule) => (
              <p key={rule.rule} className="text-sm text-zinc-700">
                {rule.rule}: {rule.hits} matches ({toPercent(rule.weight)})
              </p>
            ))}
          </Card>
        </>
      )}
    </div>
  );
};
