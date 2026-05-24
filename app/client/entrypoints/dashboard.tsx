import { context } from '@devvit/web/client';
import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '../../../components/ui';
import type { AppView } from '../../../lib/client/views';
import { ConstitutionBuilderScreen } from '../screens/ConstitutionBuilderScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TimeMachineScreen } from '../screens/TimeMachineScreen';

const viewTitle: Record<AppView, string> = {
  dashboard: 'Dashboard',
  'time-machine': 'Time Machine',
  'constitution-builder': 'Constitution Builder',
};

const DashboardApp = () => {
  const [activeView, setActiveView] = useState<AppView>('dashboard');

  const subtitle = useMemo(
    () => `r/${context.subredditName ?? 'subreddit'}`,
    []
  );

  return (
    <main className="min-h-screen px-4 py-6 text-zinc-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            {subtitle}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-950">
            ModDNA {viewTitle[activeView]}
          </h1>
        </header>

        {activeView !== 'dashboard' && (
          <div>
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
