const stopWords = new Set<string>([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'has',
  'have',
  'if',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'this',
  'to',
  'was',
  'were',
  'with',
  'you',
  'your',
  'our',
  'their',
]);

const normalizeText = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

export const tokenize = (value: string): string[] =>
  normalizeText(value)
    .split(/\s+/)
    .filter((token) => token.length > 2 && !stopWords.has(token));
