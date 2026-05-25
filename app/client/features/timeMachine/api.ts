import type {
  TimeMachineAnalyzeErrorResponse,
  TimeMachineAnalyzeRequest,
  TimeMachineAnalyzeResponse,
} from '../../../../src/shared/contracts/time-machine';

const parseJsonIfPossible = (rawText: string): unknown => {
  if (!rawText.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    return rawText;
  }
};

export const analyzeTimeMachineRequest = async (
  request: TimeMachineAnalyzeRequest
): Promise<TimeMachineAnalyzeResponse> => {
  const response = await fetch('/api/time-machine/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const responseText = await response.text();
  const parsedBody = parseJsonIfPossible(responseText);

  if (!response.ok) {
    if (
      parsedBody &&
      typeof parsedBody === 'object' &&
      'message' in parsedBody &&
      typeof parsedBody.message === 'string'
    ) {
      throw new Error((parsedBody as TimeMachineAnalyzeErrorResponse).message);
    }

    throw new Error(
      typeof parsedBody === 'string'
        ? parsedBody
        : 'Time Machine request failed.'
    );
  }

  if (!parsedBody || typeof parsedBody !== 'object') {
    throw new Error('Invalid response format from Time Machine API.');
  }

  return parsedBody as TimeMachineAnalyzeResponse;
};
