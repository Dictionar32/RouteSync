/**
 * sdkContracts.ts
 *
 * Generated SDK payload contracts, hooks, and transport definitions.
 *
 * @module core/types/semantic
 */

import type { SemanticNode } from './semanticTypes';
import type { ZodAST } from './zodAstTypes';

export interface RouteParamTypeMap { [param: string]: "string" | "number"; }
export interface RouteQueryTypeMap { [query: string]: "string" | "number" | "boolean"; }

export interface RequestPayloadContract {
  readonly params: readonly (readonly [string, 'string' | 'number'])[];
  readonly query: readonly (readonly [string, 'string' | 'number' | 'boolean'])[];
  readonly body: ZodAST;
}

export type RequestContract = {
  params?: RouteParamTypeMap;
  query?: RouteQueryTypeMap;
  body?: ZodAST;
};

export interface ModelResponsePayloadContract {
  readonly type: 'model';
  readonly model: string;
  readonly schema: ZodAST;
  readonly semantic: SemanticNode;
  readonly confidence: number;
}

export interface NonModelResponsePayloadContract {
  readonly type: 'object' | 'array' | 'primitive';
  readonly schema: ZodAST;
  readonly semantic: SemanticNode;
  readonly confidence: number;
}

export type ResponsePayloadContract =
  | ModelResponsePayloadContract
  | NonModelResponsePayloadContract;

export type ResponseContract = {
  type: "object" | "array" | "primitive" | "model";
  model?: string;
  schema: ZodAST;
  semantic: SemanticNode;
  confidence: number;
};

export interface ZodContract {
  ast: ZodAST;
  imports: string[];
}

export interface QueryHookContract {
  readonly kind: 'query';
  readonly key: readonly string[];
  readonly hookName: string;
  readonly enabled: boolean;
}

export interface MutationHookContract {
  readonly kind: 'mutation';
  readonly key: readonly string[];
  readonly hookName: string;
}

export type ReactQueryHooksContract = QueryHookContract | MutationHookContract;

export type ReactQueryHooks = {
  key: string[];
  useQuery?: string;
  useMutation?: string;
  enabled?: boolean;
};

export interface GeneratedSDKModule {
  routeName: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  request: RequestContract;
  response: ResponseContract;
  hooks: ReactQueryHooks;
  zod: ZodContract;
}
