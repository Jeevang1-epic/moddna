import { Button, Card, SectionTitle } from '../../../components/ui';
import type { AppView } from '../../../lib/client/views';

type DashboardScreenProps = {
  onSelectView: (view: Exclude<AppView, 'dashboard'>) => void;
};

export const DashboardScreen = ({ onSelectView }: DashboardScreenProps) => (
  <div className="grid gap-4 md:grid-cols-2">
    <Card className="space-y-4">
      <SectionTitle>Time Machine</SectionTitle>
      <p className="text-sm text-zinc-700">
        Submit post context, retrieve similar approved and removed precedents,
        and inspect ambiguity signals.
      </p>
      <Button tone="subtle" onClick={() => onSelectView('time-machine')}>
        Open Time Machine
      </Button>
    </Card>

    <Card className="space-y-4">
      <SectionTitle>Constitution Builder</SectionTitle>
      <p className="text-sm text-zinc-700">
        Generate moderation philosophy, onboarding guidance, and suggested
        AutoModerator rules.
      </p>
      <Button
        tone="subtle"
        onClick={() => onSelectView('constitution-builder')}
      >
        Open Constitution Builder
      </Button>
    </Card>
  </div>
);
