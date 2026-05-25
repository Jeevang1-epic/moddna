import { Badge, Button, Card, SectionTitle } from '../../../components/ui';
import {
  INITIAL_DASHBOARD_ANALYTICS,
  toAmbiguitySignals,
  type DashboardAnalyticsState,
} from '../../../lib/client/sessionState';
import type { AppView } from '../../../lib/client/views';

type DashboardScreenProps = {
  onSelectView: (view: Exclude<AppView, 'dashboard'>) => void;
  analytics: DashboardAnalyticsState;
};

const quickActions = [
  {
    title: 'Open Time Machine',
    subtitle: 'Analyze a post against precedents',
    view: 'time-machine' as const,
  },
  {
    title: 'Constitution Builder',
    subtitle: 'Generate policy and onboarding draft',
    view: 'constitution-builder' as const,
  },
];

const formatCount = (value: number): string =>
  new Intl.NumberFormat('en-US').format(value);

const asSignedPercent = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded >= 0 ? '+' : ''}${rounded.toFixed(1)}%`;
};

const safeDelta = (current: number, baseline: number): number => {
  if (baseline <= 0) {
    return 0;
  }
  return ((current - baseline) / baseline) * 100;
};

export const DashboardScreen = ({
  onSelectView,
  analytics,
}: DashboardScreenProps) => {
  const overviewMetrics = [
    {
      label: 'Total Analyzed',
      value: formatCount(analytics.totalAnalyzed),
      delta: asSignedPercent(
        safeDelta(
          analytics.totalAnalyzed,
          INITIAL_DASHBOARD_ANALYTICS.totalAnalyzed
        )
      ),
      tone: 'info' as const,
    },
    {
      label: 'Ambiguity Rate',
      value: `${(analytics.ambiguityRate * 100).toFixed(1)}%`,
      delta: asSignedPercent(
        safeDelta(
          analytics.ambiguityRate,
          INITIAL_DASHBOARD_ANALYTICS.ambiguityRate
        )
      ),
      tone:
        analytics.ambiguityRate <= INITIAL_DASHBOARD_ANALYTICS.ambiguityRate
          ? ('success' as const)
          : ('warning' as const),
    },
    {
      label: 'Actioned',
      value: formatCount(analytics.actionedCount),
      delta: asSignedPercent(
        safeDelta(
          analytics.actionedCount,
          INITIAL_DASHBOARD_ANALYTICS.actionedCount
        )
      ),
      tone: 'success' as const,
    },
    {
      label: 'Overrides',
      value: formatCount(analytics.overridesCount),
      delta: asSignedPercent(
        safeDelta(
          analytics.overridesCount,
          INITIAL_DASHBOARD_ANALYTICS.overridesCount
        )
      ),
      tone:
        analytics.overridesCount <= INITIAL_DASHBOARD_ANALYTICS.overridesCount
          ? ('success' as const)
          : ('danger' as const),
    },
  ];

  const topSignals = toAmbiguitySignals(analytics.ambiguitySignalScores);

  return (
    <div className="space-y-4 sm:space-y-5">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionTitle subtitle="Here is what is happening in your moderation workspace">
            Welcome back, ModDNA
          </SectionTitle>
          <Badge tone="success">Live</Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {overviewMetrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-slate-800 bg-slate-900/55 p-3"
            >
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                {metric.label}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-50">
                {metric.value}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge tone={metric.tone}>{metric.delta}</Badge>
                <span className="text-xs text-slate-500">vs baseline</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle subtitle="Trend of moderation decisions">
              Moderation Overview
            </SectionTitle>
            <Badge>All Actions</Badge>
          </div>
          <div className="h-56 rounded-xl border border-slate-800 bg-slate-900/45 p-4">
            <div className="relative flex h-full items-end gap-2">
              {analytics.moderationBars.map((bar, index) => (
                <div key={index} className="flex-1">
                  <div
                    className="rounded-md bg-gradient-to-t from-indigo-500/80 to-cyan-300/70"
                    style={{ height: `${bar}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="space-y-3">
          <SectionTitle subtitle="Most frequent ambiguity contributors">
            Top Ambiguity Signals
          </SectionTitle>
          <div className="space-y-3">
            {topSignals.map((signal) => (
              <div key={signal.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>{signal.label}</span>
                  <span>{signal.weight}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 transition-all"
                    style={{ width: `${signal.weight}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="space-y-3">
        <SectionTitle subtitle="Jump directly into core workflows">
          Quick Actions
        </SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          {quickActions.map((action) => (
            <button
              key={action.title}
              type="button"
              className="rounded-xl border border-slate-800 bg-slate-900/55 p-4 text-left transition-all duration-150 hover:-translate-y-px hover:border-indigo-400/45 hover:bg-slate-800/70"
              onClick={() => onSelectView(action.view)}
            >
              <p className="text-sm font-semibold text-slate-100">
                {action.title}
              </p>
              <p className="mt-1 text-sm text-slate-400">{action.subtitle}</p>
            </button>
          ))}
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/45 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
              Constitution Activity
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-100">
              {formatCount(analytics.constitutionActivityCount)} drafts
              generated
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/45 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
              Onboarding Indicator
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-100">
              {analytics.onboardingIndicator}% readiness
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button tone="subtle" onClick={() => onSelectView('time-machine')}>
            Analyze New Case
          </Button>
          <Button
            tone="subtle"
            onClick={() => onSelectView('constitution-builder')}
          >
            Generate Draft Constitution
          </Button>
        </div>
      </Card>
    </div>
  );
};
