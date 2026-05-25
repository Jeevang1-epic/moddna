import { Badge, Button, Card, SectionTitle } from '../../../components/ui';
import type { AppView } from '../../../lib/client/views';

type DashboardScreenProps = {
  onSelectView: (view: Exclude<AppView, 'dashboard'>) => void;
};

const overviewMetrics = [
  {
    label: 'Total Analyzed',
    value: '1,248',
    delta: '+12.4%',
    tone: 'info' as const,
  },
  {
    label: 'Ambiguity Rate',
    value: '18.7%',
    delta: '-4.3%',
    tone: 'warning' as const,
  },
  { label: 'Actioned', value: '342', delta: '+8.1%', tone: 'success' as const },
  { label: 'Overrides', value: '48', delta: '-2.7%', tone: 'danger' as const },
];

const topSignals = [
  { label: 'Context Missing', weight: 32 },
  { label: 'Sarcasm / Tone', weight: 24 },
  { label: 'Rule Overlap', weight: 18 },
  { label: 'Policy Gap', weight: 14 },
  { label: 'Other', weight: 12 },
];

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

export const DashboardScreen = ({ onSelectView }: DashboardScreenProps) => (
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
              <span className="text-xs text-slate-500">vs last 7 days</span>
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
            {[42, 35, 51, 31, 45, 63, 58, 74, 61, 67].map((bar, index) => (
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
