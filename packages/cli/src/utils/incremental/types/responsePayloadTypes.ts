/**
 * responsePayloadTypes.ts
 *
 * Level 7 Catamorphic ADT for Route Response Payloads.
 * Replaces unstructured object blobs with verified algebraic variants.
 *
 * @module cli/utils/incremental/types
 */

export interface PrimitiveResponsePayloadContract {
  readonly kind: 'primitive';
  readonly type: string;
}

export interface ObjectResponsePayloadContract {
  readonly kind: 'object';
  readonly fieldEntries: readonly (readonly [string, unknown])[];
}

export interface ArrayResponsePayloadContract {
  readonly kind: 'array';
  readonly element: RouteResponsePayloadContract;
}

export interface ResourceResponsePayloadContract {
  readonly kind: 'resource';
  readonly resourceName: string;
  readonly modelName: string;
  readonly isCollection: boolean;
}

export interface UnknownResponsePayloadContract {
  readonly kind: 'unknown';
  readonly raw: unknown;
}

export type RouteResponsePayloadContract =
  | PrimitiveResponsePayloadContract
  | ObjectResponsePayloadContract
  | ArrayResponsePayloadContract
  | ResourceResponsePayloadContract
  | UnknownResponsePayloadContract;

export interface RouteResponsePayloadVisitor<R> {
  readonly primitive: (p: PrimitiveResponsePayloadContract) => R;
  readonly object: (o: ObjectResponsePayloadContract) => R;
  readonly array: (a: ArrayResponsePayloadContract) => R;
  readonly resource: (r: ResourceResponsePayloadContract) => R;
  readonly unknown: (u: UnknownResponsePayloadContract) => R;
}

export function matchRouteResponsePayload<R>(
  payload: RouteResponsePayloadContract,
  visitor: RouteResponsePayloadVisitor<R>
): R {
  const handler = visitor[payload.kind];
  return (handler as (p: RouteResponsePayloadContract) => R)(payload);
}
