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
        Review past moderation decisions, surrounding context, and outcome
        patterns.
      </p>
      <Button tone="subtle" onClick={() => onSelectView('time-machine')}>
        Open Time Machine
      </Button>
    </Card>

    <Card className="space-y-4">
      <SectionTitle>Constitution Builder</SectionTitle>
      <p className="text-sm text-zinc-700">
        Curate moderator decision principles and keep standards consistent over
        time.
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
