/**
 * requestTransformer.ts
 *
 * Prepares HTTP requests with casing normalization and multipart support.
 *
 * @module core/client/http
 */

import type { AxiosRequestConfig } from 'axios';
import { snakeCaseKeys } from '../../utils';
import { hasFiles, toFormData } from './formDataTransformer';

export interface PreparedRequest {
  readonly processedBody: unknown;
  readonly processedConfig: AxiosRequestConfig | undefined;
}

export function prepareRequest(body?: unknown, config?: AxiosRequestConfig): PreparedRequest {
  let finalBody = body;
  if (finalBody && typeof finalBody === 'object' && !(finalBody instanceof FormData)) {
    finalBody = snakeCaseKeys(finalBody);
  }

  if (!finalBody || !hasFiles(finalBody)) {
    return { processedBody: finalBody, processedConfig: config };
  }

  const formData = toFormData(finalBody);
  const newConfig = { ...config };

  if (!newConfig.headers) {
    newConfig.headers = {};
  }

  // Let browser/client set the boundary for multipart/form-data automatically
  newConfig.headers['Content-Type'] = 'multipart/form-data';

  return { processedBody: formData, processedConfig: newConfig };
}
