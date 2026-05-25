import { context } from '@devvit/web/client';
import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Badge, Button } from '../../../components/ui';
import type { AppView } from '../../../lib/client/views';
import { ConstitutionBuilderScreen } from '../screens/ConstitutionBuilderScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TimeMachineScreen } from '../screens/TimeMachineScreen';

const viewTitle: Record<AppView, string> = {
  dashboard: 'Dashboard',
  'time-machine': 'Time Machine',
  'constitution-builder': 'Constitution Builder',
};

const viewDescription: Record<AppView, string> = {
  dashboard: 'Moderation intelligence workspace',
  'time-machine': 'Precedent retrieval and ambiguity diagnostics',
  'constitution-builder': 'Policy synthesis and onboarding guidance',
};

const DashboardApp = () => {
  const [activeView, setActiveView] = useState<AppView>('dashboard');

  const subtitle = useMemo(
    () => `r/${context.subredditName ?? 'subreddit'}`,
    []
  );

  return (
    <main className="min-h-screen px-4 py-6 text-zinc-900 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="rounded-2xl border border-zinc-200 bg-white px-5 py-5 shadow-sm sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                {subtitle}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                ModDNA
              </h1>
              <p className="mt-2 text-sm text-zinc-600">
                {viewDescription[activeView]}
              </p>
            </div>
            <Badge tone="info" className="mt-1">
              {viewTitle[activeView]}
            </Badge>
          </div>
        </header>

        {activeView !== 'dashboard' && (
          <div className="flex items-center">
            <Button tone="subtle" onClick={() => setActiveView('dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        )}

        {activeView === 'dashboard' && (
          <DashboardScreen onSelectView={setActiveView} />
        )}
        {activeView === 'time-machine' && <TimeMachineScreen />}
        {activeView === 'constitution-builder' && <ConstitutionBuilderScreen />}
      </div>
    </main>
  );
};

export const mountDashboardEntrypoint = (): void => {
  const mountNode = document.getElementById('root');
  if (!mountNode) {
    throw new Error('Missing root element');
  }

  createRoot(mountNode).render(
    <StrictMode>
      <DashboardApp />
    </StrictMode>
  );
};
