/**
 * Constraint.ts
 * Constraint definitions for type inference
 */

import type { FileSpan } from '../types/FileSpan';
import type { SemanticType } from '../types/SemanticType';
import type { TypeVariable } from './TypeVariable';

export type Constraint =
    | { kind: 'PropertyExists'; source: TypeVariable; property: string; expected: TypeVariable; span?: FileSpan }
    | { kind: 'Equality'; source: TypeVariable; target: TypeVariable; span?: FileSpan }
    | { kind: 'Subtype'; source: TypeVariable; target: TypeVariable; span?: FileSpan }
    | { kind: 'ReturnType'; source: TypeVariable; expected: TypeVariable; span?: FileSpan }
    | { kind: 'HasType'; source: TypeVariable; type: SemanticType; span?: FileSpan };

export interface ConstraintViolation {
    readonly code: string;
    readonly message: string;
    readonly location?: FileSpan;
}
