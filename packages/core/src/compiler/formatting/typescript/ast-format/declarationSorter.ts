/**
 * declarationSorter.ts
 *
 * AST declaration sorting algorithms (type-first, alphabetical).
 *
 * @module core/compiler/formatting/typescript/ast-format
 */

import type { TSDeclaration, DeclarationSortStrategy } from './types';

export function sortDeclarationsTypeFirst(declarations: readonly TSDeclaration[]): TSDeclaration[] {
  return [...declarations].sort((a, b) => {
    // 1. Interfaces before type aliases
    if (a.kind === 'interface-declaration' && b.kind !== 'interface-declaration') {
      return -1;
    }
    if (a.kind !== 'interface-declaration' && b.kind === 'interface-declaration') {
      return 1;
    }

    // 2. Alphabetically by name within same type
    return a.name.localeCompare(b.name);
  });
}

export function sortDeclarationsAlphabetically(declarations: readonly TSDeclaration[]): TSDeclaration[] {
  return [...declarations].sort((a, b) => a.name.localeCompare(b.name));
}

export function formatDeclarations(
  declarations: readonly TSDeclaration[],
  strategy: DeclarationSortStrategy
): TSDeclaration[] {
  switch (strategy) {
    case 'type-first':
      return sortDeclarationsTypeFirst(declarations);
    case 'alphabetical':
      return sortDeclarationsAlphabetically(declarations);
    case 'none':
      return [...declarations];
  }
}
