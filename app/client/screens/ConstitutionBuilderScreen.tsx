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
    <div className="space-y-4 sm:space-y-5">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionTitle subtitle="Build a repeatable moderation framework from existing behavior">
            Constitution Builder
          </SectionTitle>
          <Badge tone="info">Draft Generator</Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge tone="info">1</Badge>
              <label className="text-sm font-medium text-slate-300">
                Core Rules
              </label>
            </div>
            <Textarea
              rows={9}
              value={rulesText}
              placeholder={
                'No hate speech\nNo personal attacks\nNo referral links'
              }
              onChange={(event) => setRulesText(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge tone="info">2</Badge>
              <label className="text-sm font-medium text-slate-300">
                Moderator Notes
              </label>
            </div>
            <Textarea
              rows={9}
              value={modLogText}
              placeholder={
                'Removed for repeated insults\nApproved after context edit'
              }
              onChange={(event) => setModLogText(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge tone="info">3</Badge>
              <label className="text-sm font-medium text-slate-300">
                Removal Patterns
              </label>
            </div>
            <Textarea
              rows={9}
              value={removalPatternsText}
              placeholder={'Referral spam\nTargeted harassment\nUnsafe links'}
              onChange={(event) => setRemovalPatternsText(event.target.value)}
            />
          </div>

          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/55 p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge tone="warning">4</Badge>
                <p className="text-sm font-medium text-slate-300">Generate</p>
              </div>
              <p className="text-sm leading-6 text-slate-400">
                Synthesize moderation philosophy, onboarding guidance, and
                AutoModerator-ready suggestions.
              </p>
            </div>
            <div className="space-y-2">
              <Button
                fullWidth
                onClick={() => void onBuild()}
                disabled={loading}
              >
                {loading ? 'Building...' : 'Generate Draft'}
              </Button>
              <div className="flex flex-wrap gap-2">
                <Badge>{parseLines(rulesText).length} rules</Badge>
                <Badge>{parseLines(modLogText).length} notes</Badge>
                <Badge>{parseLines(removalPatternsText).length} patterns</Badge>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-rose-400/30 bg-rose-500/12 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        )}
      </Card>

      {loading && (
        <Card tone="muted">
          <p className="text-sm text-slate-300">
            Synthesizing moderation philosophy, onboarding guidance, and rule
            candidates.
          </p>
        </Card>
      )}

      {!loading && !result && !error && (
        <Card tone="muted">
          <p className="text-sm text-slate-300">
            Provide rules, moderator notes, and removal patterns to generate a
            constitution draft and supporting signals.
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
              <p className="text-sm leading-7 text-slate-300">
                {result.moderationPhilosophy}
              </p>
            </Card>

            <Card className="space-y-3">
              <SectionTitle subtitle="How new moderators should execute">
                Onboarding Summary
              </SectionTitle>
              <p className="text-sm leading-7 text-slate-300">
                {result.onboardingSummary}
              </p>
            </Card>
          </div>

          <Card className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <SectionTitle subtitle="Snippets ready for policy automation">
                Suggested AutoModerator Rules
              </SectionTitle>
              <Badge tone="info">
                {result.suggestedAutoModeratorRules.length} rules
              </Badge>
            </div>
            {result.suggestedAutoModeratorRules.map((rule, index) => (
              <div
                key={`${index}-${rule}`}
                className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/55 p-3.5"
              >
                <div className="mb-2">
                  <Badge>Rule {index + 1}</Badge>
                </div>
                <pre className="text-xs leading-5 text-slate-300">{rule}</pre>
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
            <div className="grid gap-3 lg:grid-cols-2">
              {result.supportingSignals.map((signal) => (
                <div
                  key={signal.theme}
                  className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/50 p-3.5"
                >
                  <p className="text-sm font-semibold text-slate-100">
                    {signal.theme}
                  </p>
                  {signal.evidence.length === 0 && (
                    <p className="text-sm text-slate-400">
                      No direct evidence lines.
                    </p>
                  )}
                  {signal.evidence.map((evidenceLine, index) => (
                    <p
                      key={`${signal.theme}-${index}-${evidenceLine}`}
                      className="text-sm leading-6 text-slate-300"
                    >
                      {evidenceLine}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
