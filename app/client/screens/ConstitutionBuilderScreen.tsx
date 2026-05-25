import { useState } from 'react';
import { Button, Card, SectionTitle, Textarea } from '../../../components/ui';
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
        <SectionTitle>Constitution Builder</SectionTitle>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-800">
            Rules (one per line)
          </label>
          <Textarea
            rows={6}
            value={rulesText}
            onChange={(event) => setRulesText(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-800">
            Moderator Log Notes (one per line)
          </label>
          <Textarea
            rows={6}
            value={modLogText}
            onChange={(event) => setModLogText(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-800">
            Removal Patterns (one per line)
          </label>
          <Textarea
            rows={6}
            value={removalPatternsText}
            onChange={(event) => setRemovalPatternsText(event.target.value)}
          />
        </div>
        <Button onClick={() => void onBuild()} disabled={loading}>
          {loading ? 'Building...' : 'Build Constitution'}
        </Button>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </Card>

      {result && (
        <>
          <Card className="space-y-3">
            <SectionTitle>Moderation Philosophy</SectionTitle>
            <p className="text-sm text-zinc-800">
              {result.moderationPhilosophy}
            </p>
          </Card>

          <Card className="space-y-3">
            <SectionTitle>Onboarding Summary</SectionTitle>
            <p className="text-sm text-zinc-800">{result.onboardingSummary}</p>
          </Card>

          <Card className="space-y-3">
            <SectionTitle>Suggested AutoModerator Rules</SectionTitle>
            {result.suggestedAutoModeratorRules.map((rule, index) => (
              <pre
                key={`${index}-${rule}`}
                className="overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-800"
              >
                {rule}
              </pre>
            ))}
          </Card>

          <Card className="space-y-3">
            <SectionTitle>Supporting Signals</SectionTitle>
            {result.supportingSignals.map((signal) => (
              <div
                key={signal.theme}
                className="space-y-1 rounded-md border border-zinc-200 p-3"
              >
                <p className="text-sm font-semibold text-zinc-900">
                  {signal.theme}
                </p>
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
            <p className="text-xs text-zinc-600">
              Elapsed: {result.elapsedMs}ms
            </p>
          </Card>
        </>
      )}
    </div>
  );
};
