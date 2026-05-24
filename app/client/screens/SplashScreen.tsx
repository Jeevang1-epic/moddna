import type { MouseEvent } from 'react';
import { Button, Card, SectionTitle } from '../../../components/ui';

type SplashScreenProps = {
  username?: string | null;
  onOpenDashboard: (event: MouseEvent<HTMLButtonElement>) => void;
};

export const SplashScreen = ({
  username,
  onOpenDashboard,
}: SplashScreenProps) => (
  <main className="flex min-h-screen items-center justify-center px-4 py-6 text-zinc-900">
    <div className="w-full max-w-xl">
      <Card className="space-y-6">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Reddit Devvit Application
          </p>
          <SectionTitle className="text-3xl">ModDNA</SectionTitle>
          <p className="text-sm text-zinc-700">
            Institutional memory for consistent moderation decisions.
          </p>
        </header>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          Signed in as{' '}
          <span className="font-semibold">{username ?? 'moderator'}</span>
        </div>

        <Button fullWidth onClick={onOpenDashboard}>
          Open Dashboard
        </Button>
      </Card>
    </div>
  </main>
);
