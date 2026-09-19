import type { ModelNode } from './modelNodes';

/** Semantic scope carried by variable resolution. */
export type ResolutionScope =
  | { readonly kind: 'model'; readonly model: ModelNode }
  | { readonly kind: 'global' };

export function modelScope(model: ModelNode): ResolutionScope {
  return Object.freeze({ kind: 'model', model });
}

export const GLOBAL_RESOLUTION_SCOPE: ResolutionScope = Object.freeze({ kind: 'global' });
