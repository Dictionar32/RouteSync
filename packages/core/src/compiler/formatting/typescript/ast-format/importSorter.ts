/**
 * importSorter.ts
 *
 * Import declarations sorting and grouping algorithms.
 *
 * @module core/compiler/formatting/typescript/ast-format
 */

import type { TSImportDeclaration } from '../../../target/typescript/nodes/TSImportDeclaration';
import type { ImportSortStrategy } from './types';

export function sortImportsAlphabetically(imports: readonly TSImportDeclaration[]): TSImportDeclaration[] {
  return [...imports].sort((a, b) => a.from.localeCompare(b.from));
}

export function sortImportsGrouped(imports: readonly TSImportDeclaration[]): TSImportDeclaration[] {
  return [...imports].sort((a, b) => {
    // 1. Type imports first
    if (a.isType && !b.isType) return -1;
    if (!a.isType && b.isType) return 1;

    // 2. External before local
    const aIsExternal = !a.from.startsWith('.');
    const bIsExternal = !b.from.startsWith('.');

    if (aIsExternal && !bIsExternal) return -1;
    if (!aIsExternal && bIsExternal) return 1;

    // 3. Alphabetically within groups
    return a.from.localeCompare(b.from);
  });
}

export function groupImportsByType(imports: readonly TSImportDeclaration[]): TSImportDeclaration[] {
  const typeImports: TSImportDeclaration[] = [];
  const valueImports: TSImportDeclaration[] = [];

  for (const imp of imports) {
    if (imp.isType) {
      typeImports.push(imp);
    } else {
      valueImports.push(imp);
    }
  }

  return [...typeImports, ...valueImports];
}

export function formatImportDeclarations(
  imports: readonly TSImportDeclaration[],
  strategy: ImportSortStrategy,
  groupTypeImports: boolean
): TSImportDeclaration[] {
  if (strategy === 'none') {
    return [...imports];
  }

  let sorted: TSImportDeclaration[];
  if (strategy === 'alphabetical') {
    sorted = sortImportsAlphabetically(imports);
  } else {
    sorted = sortImportsGrouped(imports);
  }

  if (groupTypeImports) {
    sorted = groupImportsByType(sorted);
  }

  return sorted;
}
