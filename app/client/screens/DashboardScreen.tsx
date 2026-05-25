import { Badge, Button, Card, SectionTitle } from '../../../components/ui';
import type { AppView } from '../../../lib/client/views';

type DashboardScreenProps = {
  onSelectView: (view: Exclude<AppView, 'dashboard'>) => void;
};

export const DashboardScreen = ({ onSelectView }: DashboardScreenProps) => (
  <div className="space-y-4">
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card tone="muted" className="space-y-3">
        <SectionTitle subtitle="Fast, explainable moderation intelligence">
          Control Center
        </SectionTitle>
        <p className="text-sm text-zinc-700">
          Analyze edge-case content against precedent, surface ambiguity, and
          codify consistent moderation guidance without leaving queue context.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge tone="info">Explainable Outputs</Badge>
          <Badge tone="success">Moderator-in-Control</Badge>
          <Badge>Low-Latency Workflow</Badge>
        </div>
      </Card>

      <Card className="space-y-3">
        <SectionTitle subtitle="Current capabilities">Status</SectionTitle>
        <div className="space-y-2 text-sm text-zinc-700">
          <p>Time Machine: precedent retrieval and ambiguity signal</p>
          <p>Constitution Builder: policy synthesis and onboarding summary</p>
          <p>Retrieval mode: approved + removed comparative examples</p>
        </div>
      </Card>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <Card interactive className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <SectionTitle subtitle="Historical precedent and gray-area signal">
            Time Machine
          </SectionTitle>
          <Badge tone="info">P0</Badge>
        </div>
        <p className="text-sm text-zinc-700">
          Submit post context, retrieve similar approved and removed cases, and
          inspect moderation tendency, rule overlap, and ambiguity.
        </p>
        <Button
          tone="subtle"
          fullWidth
          onClick={() => onSelectView('time-machine')}
        >
          Open Time Machine
        </Button>
      </Card>

      <Card interactive className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <SectionTitle subtitle="Moderation philosophy and policy assets">
            Constitution Builder
          </SectionTitle>
          <Badge tone="warning">P0</Badge>
        </div>
        <p className="text-sm text-zinc-700">
          Generate moderation philosophy, onboarding guidance, and suggested
          AutoModerator rule snippets from existing moderation patterns.
        </p>
        <Button
          tone="subtle"
          fullWidth
          onClick={() => onSelectView('constitution-builder')}
        >
          Open Constitution Builder
        </Button>
      </Card>
    </div>
  </div>
);
