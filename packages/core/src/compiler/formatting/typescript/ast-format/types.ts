/**
 * types.ts
 *
 * Types and defaults for TSFormatter AST optimization.
 *
 * @module core/compiler/formatting/typescript/ast-format
 */

import type { TSInterfaceDeclaration } from '../../../target/typescript/nodes/TSInterfaceDeclaration';
import type { TSTypeAliasDeclaration } from '../../../target/typescript/nodes/TSTypeAliasDeclaration';

export type TSDeclaration = TSInterfaceDeclaration | TSTypeAliasDeclaration;

export type ImportSortStrategy = 'alphabetical' | 'grouped' | 'none';

export type DeclarationSortStrategy = 'type-first' | 'alphabetical' | 'none';

export interface TSFormatterConfig {
  readonly importSorting: ImportSortStrategy;
  readonly declarationSorting: DeclarationSortStrategy;
  readonly groupTypeImports: boolean;
}

export const DEFAULT_CONFIG: TSFormatterConfig = {
  importSorting: 'grouped',
  declarationSorting: 'type-first',
  groupTypeImports: true
};
