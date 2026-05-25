import type { ModerationCase } from '../../../src/shared/contracts/moderation';
import { tokenize } from './tokenize';

type SparseVector = Map<string, number>;

const buildTermFrequency = (tokens: string[]): SparseVector => {
  const termFrequency = new Map<string, number>();
  for (const token of tokens) {
    termFrequency.set(token, (termFrequency.get(token) ?? 0) + 1);
  }
  return termFrequency;
};

const buildDocumentFrequency = (documents: string[][]): SparseVector => {
  const documentFrequency = new Map<string, number>();
  for (const tokens of documents) {
    const uniqueTerms = new Set(tokens);
    for (const term of uniqueTerms) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
  }
  return documentFrequency;
};

const buildTfidfVector = (
  tokens: string[],
  documentFrequency: SparseVector,
  totalDocuments: number
): SparseVector => {
  const tf = buildTermFrequency(tokens);
  const vector = new Map<string, number>();

  for (const [term, frequency] of tf) {
    const df = documentFrequency.get(term) ?? 0;
    const idf = Math.log((totalDocuments + 1) / (df + 1)) + 1;
    vector.set(term, frequency * idf);
  }

  return vector;
};

const normalizeVector = (vector: SparseVector): SparseVector => {
  let magnitudeSquared = 0;
  for (const value of vector.values()) {
    magnitudeSquared += value * value;
  }

  const magnitude = Math.sqrt(magnitudeSquared);
  if (magnitude === 0) {
    return vector;
  }

  const normalized = new Map<string, number>();
  for (const [term, value] of vector) {
    normalized.set(term, value / magnitude);
  }
  return normalized;
};

const cosineSimilarity = (left: SparseVector, right: SparseVector): number => {
  if (left.size === 0 || right.size === 0) {
    return 0;
  }

  let dotProduct = 0;
  const [small, large] = left.size < right.size ? [left, right] : [right, left];

  for (const [term, value] of small) {
    const otherValue = large.get(term);
    if (typeof otherValue === 'number') {
      dotProduct += value * otherValue;
    }
  }

  if (dotProduct < 0) {
    return 0;
  }

  if (dotProduct > 1) {
    return 1;
  }

  return dotProduct;
};

const createCaseDocument = (moderationCase: ModerationCase): string =>
  [
    moderationCase.title,
    moderationCase.body,
    moderationCase.comment,
    moderationCase.moderatorNote,
    moderationCase.matchedRules.join(' '),
  ].join(' ');

export const scoreSimilarCases = (
  queryText: string,
  cases: ModerationCase[]
): Array<{ moderationCase: ModerationCase; similarity: number }> => {
  const caseTokens = cases.map((moderationCase) =>
    tokenize(createCaseDocument(moderationCase))
  );
  const queryTokens = tokenize(queryText);

  const documents = [...caseTokens, queryTokens];
  const documentFrequency = buildDocumentFrequency(documents);
  const totalDocuments = documents.length;
  const queryVector = normalizeVector(
    buildTfidfVector(queryTokens, documentFrequency, totalDocuments)
  );

  return cases
    .map((moderationCase, index) => {
      const caseVector = normalizeVector(
        buildTfidfVector(
          caseTokens[index] ?? [],
          documentFrequency,
          totalDocuments
        )
      );

      return {
        moderationCase,
        similarity: cosineSimilarity(queryVector, caseVector),
      };
    })
    .sort((left, right) => right.similarity - left.similarity);
};
