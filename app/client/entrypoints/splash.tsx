import { context, requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SplashScreen } from '../screens/SplashScreen';

const SplashApp = () => (
  <SplashScreen
    username={context.username ?? null}
    onOpenDashboard={(event) =>
      requestExpandedMode(event.nativeEvent, 'dashboard')
    }
  />
);

export const mountSplashEntrypoint = (): void => {
  const mountNode = document.getElementById('root');
  if (!mountNode) {
    throw new Error('Missing root element');
  }

  createRoot(mountNode).render(
    <StrictMode>
      <SplashApp />
    </StrictMode>
  );
};
