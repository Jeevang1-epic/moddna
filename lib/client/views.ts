export const APP_VIEWS = [
  'dashboard',
  'time-machine',
  'constitution-builder',
] as const;

export type AppView = (typeof APP_VIEWS)[number];
