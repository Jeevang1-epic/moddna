import type {
  ConstitutionBuildErrorResponse,
  ConstitutionBuildRequest,
  ConstitutionBuildResponse,
} from '../../../../src/shared/contracts/constitution';

export const buildConstitutionRequest = async (
  request: ConstitutionBuildRequest
): Promise<ConstitutionBuildResponse> => {
  const response = await fetch('/api/constitution/build', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorBody = (await response.json()) as ConstitutionBuildErrorResponse;
    throw new Error(errorBody.message);
  }

  return (await response.json()) as ConstitutionBuildResponse;
};
