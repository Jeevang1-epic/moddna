import { context } from '@devvit/web/client';
import { StrictMode, useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Badge, Button, Card } from '../../../components/ui';
import {
  applyConstitutionAnalytics,
  applyTimeMachineAnalytics,
  hydrateSessionState,
  persistSessionState,
  type AppSessionState,
  type ConstitutionSessionState,
  type TimeMachineSessionState,
} from '../../../lib/client/sessionState';
import type { AppView } from '../../../lib/client/views';
import type { ConstitutionBuildResponse } from '../../../src/shared/contracts/constitution';
import type { TimeMachineAnalyzeResponse } from '../../../src/shared/contracts/time-machine';
import { ConstitutionBuilderScreen } from '../screens/ConstitutionBuilderScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TimeMachineScreen } from '../screens/TimeMachineScreen';

const viewTitle: Record<AppView, string> = {
  dashboard: 'Dashboard',
  'time-machine': 'Time Machine',
  'constitution-builder': 'Constitution Builder',
};

const viewDescription: Record<AppView, string> = {
  dashboard: 'Moderation Intelligence Workspace',
  'time-machine': 'Precedent Retrieval and Analysis',
  'constitution-builder': 'Policy Synthesis and Onboarding',
};

const primaryNav: Array<{ view: AppView; label: string }> = [
  { view: 'dashboard', label: 'Dashboard' },
  { view: 'time-machine', label: 'Time Machine' },
  { view: 'constitution-builder', label: 'Constitution Builder' },
];

const secondaryNav = ['Mod Queue', 'Rule Library', 'Analytics', 'Settings'];

const DashboardApp = () => {
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [sessionState, setSessionState] = useState<AppSessionState>(() =>
    hydrateSessionState()
  );

  const subtitle = useMemo(
    () => `r/${context.subredditName ?? 'subreddit'}`,
    []
  );

  useEffect(() => {
    persistSessionState(sessionState);
  }, [sessionState]);

  const updateTimeMachineSession = useCallback(
    (
      updater: (current: TimeMachineSessionState) => TimeMachineSessionState
    ): void => {
      setSessionState((current) => ({
        ...current,
        timeMachine: updater(current.timeMachine),
      }));
    },
    []
  );

  const updateConstitutionSession = useCallback(
    (
      updater: (current: ConstitutionSessionState) => ConstitutionSessionState
    ): void => {
      setSessionState((current) => ({
        ...current,
        constitution: updater(current.constitution),
      }));
    },
    []
  );

  const onTimeMachineAnalyzeSuccess = useCallback(
    (response: TimeMachineAnalyzeResponse): void => {
      setSessionState((current) => ({
        ...current,
        timeMachine: {
          ...current.timeMachine,
          result: response,
        },
        analytics: applyTimeMachineAnalytics(current, response),
      }));
    },
    []
  );

  const onConstitutionBuildSuccess = useCallback(
    (response: ConstitutionBuildResponse): void => {
      setSessionState((current) => ({
        ...current,
        constitution: {
          ...current.constitution,
          result: response,
        },
        analytics: applyConstitutionAnalytics(current, response),
      }));
    },
    []
  );

  return (
    <main className="min-h-screen px-3 py-4 text-slate-100 sm:px-5 sm:py-6">
      <div className="mx-auto flex w-full max-w-[1400px] gap-4 lg:gap-6">
        <aside className="hidden w-64 shrink-0 md:flex md:flex-col">
          <Card className="flex h-full flex-col gap-5 p-4">
            <div className="rounded-xl border border-indigo-400/25 bg-slate-900/80 p-3">
              <p className="text-base font-semibold tracking-tight text-slate-100">
                ModDNA
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Moderation Intelligence Workspace
              </p>
            </div>

            <nav className="space-y-1.5">
              {primaryNav.map((item) => {
                const selected = item.view === activeView;
                return (
                  <button
                    key={item.view}
                    type="button"
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-medium transition-all ${
                      selected
                        ? 'border-indigo-400/45 bg-indigo-500/20 text-indigo-100 shadow-[inset_0_0_0_1px_rgba(129,140,248,0.25)]'
                        : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800/60 hover:text-slate-100'
                    }`}
                    onClick={() => setActiveView(item.view)}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="space-y-1.5">
              {secondaryNav.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-500"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-auto rounded-xl border border-slate-700/70 bg-slate-900/75 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                Runtime
              </p>
              <p className="mt-1 text-sm font-medium text-slate-100">
                ModDNA AI
              </p>
              <p className="mt-1 text-xs text-emerald-300">Online</p>
            </div>
          </Card>
        </aside>

        <section className="min-w-0 flex-1 space-y-4">
          <header className="rounded-2xl border border-slate-800/80 bg-slate-950/65 px-4 py-4 shadow-[0_16px_40px_rgba(2,6,23,0.45)] backdrop-blur-sm sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {subtitle}
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
                  ModDNA
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  {viewDescription[activeView]}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="info">{viewTitle[activeView]}</Badge>
                <Button tone="subtle" className="!px-3 !py-2 text-xs">
                  Last 7 Days
                </Button>
              </div>
            </div>
          </header>

          <div className="grid gap-2 md:hidden">
            {primaryNav.map((item) => (
              <Button
                key={item.view}
                tone={item.view === activeView ? 'primary' : 'subtle'}
                fullWidth
                onClick={() => setActiveView(item.view)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          {activeView !== 'dashboard' && (
            <div className="flex items-center">
              <Button tone="subtle" onClick={() => setActiveView('dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          )}

          {activeView === 'dashboard' && (
            <DashboardScreen
              onSelectView={setActiveView}
              analytics={sessionState.analytics}
            />
          )}
          {activeView === 'time-machine' && (
            <TimeMachineScreen
              session={sessionState.timeMachine}
              onSessionChange={updateTimeMachineSession}
              onAnalyzeSuccess={onTimeMachineAnalyzeSuccess}
            />
          )}
          {activeView === 'constitution-builder' && (
            <ConstitutionBuilderScreen
              session={sessionState.constitution}
              onSessionChange={updateConstitutionSession}
              onBuildSuccess={onConstitutionBuildSuccess}
            />
          )}
        </section>
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
