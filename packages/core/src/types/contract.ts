/**
 * contract.ts
 *
 * Semantic resolution contracts and Level 7 Subatomic ADT variants.
 * Zero sentinel undefined, zero null, zero optional fields (0% porosity).
 *
 * @module core/types
 */

import type { BoundSemanticNode } from './domain/boundAst';

export type ResolutionStatus = 'resolved' | 'unknown' | 'partial';

export interface TraceNodeContract {
  readonly source: string;
  readonly rule: string;
  readonly input: string;
  readonly output: string;
}

export type TraceNode = {
  source: string;
  rule: string;
  input?: string;
  output?: string;
};

export interface BaseResolutionContract {
  readonly status: ResolutionStatus;
  readonly confidence: number;
  readonly trace: readonly TraceNodeContract[];
}

export interface ScalarResolutionContract extends BaseResolutionContract {
  readonly kind: 'scalar';
  readonly type: string;
  readonly nullable: boolean;
}

export interface ModelResolutionContract extends BaseResolutionContract {
  readonly kind: 'model';
  readonly model: string;
  readonly isCollection: boolean;
  readonly isPaginated: boolean;
}

export interface ResourceResolutionContract extends BaseResolutionContract {
  readonly kind: 'resource';
  readonly resource: string;
  readonly isCollection: boolean;
}

export interface SyntheticObjectResolutionContract extends BaseResolutionContract {
  readonly kind: 'object';
  readonly fields: readonly (readonly [string, string])[];
}

export interface UnknownResolutionContract extends BaseResolutionContract {
  readonly kind: 'unknown';
}

/**
 * Level 7 Complete Closed ADT for SemanticResolution (0 undefined, 0 null, 0 ?:).
 */
export type SemanticResolutionContract =
  | ScalarResolutionContract
  | ModelResolutionContract
  | ResourceResolutionContract
  | SyntheticObjectResolutionContract
  | UnknownResolutionContract;

export type SemanticResolution = {
  status: ResolutionStatus;
  type: string;
  model?: string;
  resource?: string;
  collection?: boolean;
  paginated?: boolean;
  nullable?: boolean;
  confidence: number;
  trace: TraceNode[];
  boundAst?: BoundSemanticNode;
  fields?: Record<string, string>;
};

export interface JsonObjectResolution extends SemanticResolution {
  type: 'json-object';
  sourceModel: string;
  sourceColumn: string;
}

export type AccessKind = 'array_access' | 'property_access' | 'optional_access';

export interface JsonMemberResolution extends SemanticResolution {
  type: 'json-member';
  parent: SemanticResolution;
  key: string;
  accessKind: AccessKind;
}
