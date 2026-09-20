import type { FormRequestSource, RequestType } from '../../../types/domain/request';

/**
 * Legacy compatibility seam. FormRequestSource is now an upstream fact source;
 * it must never be converted into a second inferred RequestType.
 */
export function mergeRequestTypeSources(
  _formRequests: readonly FormRequestSource[],
  derivedRequests: readonly RequestType[]
): readonly RequestType[] {
  return derivedRequests;
}
