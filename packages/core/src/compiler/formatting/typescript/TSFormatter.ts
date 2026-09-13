/**
 * @file TSFormatter.ts
 * @description Format and optimize TypeScript Target AST
 * 
 * Formatter Phase (Optimization):
 * - Input: TSFile (unformatted Target AST)
 * - Output: TSFile (formatted Target AST)
 * - Pure AST transformation (no strings)
 * - Immutable operations (return new AST)
 */

import { TSFile } from '../../target/typescript/nodes/TSFile';
import {
  type TSFormatterConfig,
  type TSDeclaration,
  DEFAULT_CONFIG,
  formatImportDeclarations,
  formatDeclarations
} from './ast-format';

export type {
  TSDeclaration,
  ImportSortStrategy,
  DeclarationSortStrategy,
  TSFormatterConfig
} from './ast-format';

export class TSFormatter {
  private readonly config: TSFormatterConfig;

  constructor(config: Partial<TSFormatterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    Object.freeze(this.config);
  }

  /**
   * Format TypeScript AST
   * 
   * Main entry point - returns new formatted AST (immutable)
   */
  public format(file: TSFile): TSFile {
    const sortedImports = formatImportDeclarations(
      file.imports,
      this.config.importSorting,
      this.config.groupTypeImports
    );

    const sortedDeclarations = formatDeclarations(
      file.declarations,
      this.config.declarationSorting
    );

    return new TSFile(sortedImports, sortedDeclarations);
  }
}
