import { reddit } from '@devvit/web/server';

type CreateModDnaPostInput = {
  subredditName: string;
  entry?: 'default' | 'dashboard';
  title?: string;
};

export const createModDnaPost = async ({
  subredditName,
  entry = 'default',
  title = 'ModDNA',
}: CreateModDnaPostInput) =>
  reddit.submitCustomPost({
    subredditName,
    title,
    entry,
  });
