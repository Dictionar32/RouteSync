/**
 * Model Symbol sub-domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/compiler/scanner/symbols/model
 */

export {
    type ResolvedPropertyBinding
} from './types';

export type {
    OriginModelSymbol
} from './originModelSymbol';

export type { ModelSymbolTable } from './modelSymbolTableClass';
export { createModelSymbolTable } from './modelSymbolTableClass';
