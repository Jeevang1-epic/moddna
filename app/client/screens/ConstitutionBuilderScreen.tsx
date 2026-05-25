import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  SectionTitle,
  Textarea,
} from '../../../components/ui';
import type { ConstitutionBuildResponse } from '../../../src/shared/contracts/constitution';
import { buildConstitutionRequest } from '../features/constitution/api';

const parseLines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

export const ConstitutionBuilderScreen = () => {
  const [rulesText, setRulesText] = useState('');
  const [modLogText, setModLogText] = useState('');
  const [removalPatternsText, setRemovalPatternsText] = useState('');
  const [result, setResult] = useState<ConstitutionBuildResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onBuild = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await buildConstitutionRequest({
        rules: parseLines(rulesText),
        modLog: parseLines(modLogText),
        removalPatterns: parseLines(removalPatternsText),
      });
      setResult(response);
    } catch (buildError) {
      setResult(null);
      setError(
        buildError instanceof Error
          ? buildError.message
          : 'Failed to build constitution outputs.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <SectionTitle subtitle="Synthesize a repeatable moderation framework">
          Constitution Builder
        </SectionTitle>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-800">
              Rules (one per line)
            </label>
            <Textarea
              rows={8}
              value={rulesText}
              placeholder={
                'No hate speech\nNo personal attacks\nNo referral links'
              }
              onChange={(event) => setRulesText(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-800">
              Moderator Log Notes
            </label>
            <Textarea
              rows={8}
              value={modLogText}
              placeholder={
                'Removed for repeated insults\nApproved after context edit'
              }
              onChange={(event) => setModLogText(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-800">
              Removal Patterns
            </label>
            <Textarea
              rows={8}
              value={removalPatternsText}
              placeholder={'Referral spam\nTargeted harassment\nUnsafe links'}
              onChange={(event) => setRemovalPatternsText(event.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => void onBuild()} disabled={loading}>
            {loading ? 'Building...' : 'Build Constitution'}
          </Button>
          <Badge>{parseLines(rulesText).length} rules</Badge>
          <Badge>{parseLines(modLogText).length} log notes</Badge>
          <Badge>{parseLines(removalPatternsText).length} patterns</Badge>
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
            Synthesizing moderation philosophy, onboarding guidance, and rule
            candidates.
          </p>
        </Card>
      )}

      {!loading && !result && !error && (
        <Card tone="muted">
          <p className="text-sm text-zinc-700">
            Provide rules, log notes, and removal patterns to generate a
            moderation constitution draft.
          </p>
        </Card>
      )}

      {result && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-3">
              <SectionTitle subtitle="Core decision doctrine">
                Moderation Philosophy
              </SectionTitle>
              <p className="text-sm leading-6 text-zinc-800">
                {result.moderationPhilosophy}
              </p>
            </Card>

            <Card className="space-y-3">
              <SectionTitle subtitle="How new moderators should execute">
                Onboarding Summary
              </SectionTitle>
              <p className="text-sm leading-6 text-zinc-800">
                {result.onboardingSummary}
              </p>
            </Card>
          </div>

          <Card className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <SectionTitle subtitle="Snippets ready for rule automation">
                Suggested AutoModerator Rules
              </SectionTitle>
              <Badge tone="info">
                {result.suggestedAutoModeratorRules.length} rules
              </Badge>
            </div>
            {result.suggestedAutoModeratorRules.map((rule, index) => (
              <div
                key={`${index}-${rule}`}
                className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3"
              >
                <div className="mb-2">
                  <Badge>Rule {index + 1}</Badge>
                </div>
                <pre className="text-xs leading-5 text-zinc-800">{rule}</pre>
              </div>
            ))}
          </Card>

          <Card className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <SectionTitle subtitle="Signals used in synthesis">
                Supporting Signals
              </SectionTitle>
              <Badge>{result.elapsedMs}ms</Badge>
            </div>
            {result.supportingSignals.map((signal) => (
              <div
                key={signal.theme}
                className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3"
              >
                <p className="text-sm font-semibold text-zinc-900">
                  {signal.theme}
                </p>
                {signal.evidence.length === 0 && (
                  <p className="text-sm text-zinc-600">
                    No direct evidence lines.
                  </p>
                )}
                {signal.evidence.map((evidenceLine, index) => (
                  <p
                    key={`${signal.theme}-${index}-${evidenceLine}`}
                    className="text-sm text-zinc-700"
                  >
                    {evidenceLine}
                  </p>
                ))}
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
};
