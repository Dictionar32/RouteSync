import type { AxiosRequestConfig } from 'axios';
import type { HttpMethod } from '../types/upstream/routeExecutionVocabulary';

/**
 * Complete transport instruction for an HTTP operation already classified upstream.
 * The executor receives the final method and does not infer method or payload semantics.
 */
export interface HttpRequestExecution<TBody> {
  readonly url: string;
  readonly method: HttpMethod;
  readonly body: TBody;
  readonly config: AxiosRequestConfig;
}
