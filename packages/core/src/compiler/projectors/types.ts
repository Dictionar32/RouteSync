/**
 * types.ts
 *
 * Core contracts and interfaces for Catamorphic Domain Projectors.
 *
 * @module compiler/projectors
 */

import type { CodeSink } from '../sink/CodeSink';

export interface DomainProjector<TEntity, R = void> {
    project(entity: TEntity, sink: CodeSink): R;
}

export interface ProjectorOutput<TMetadata = Record<string, unknown>> {
    readonly code: string;
    readonly metadata: TMetadata;
}
