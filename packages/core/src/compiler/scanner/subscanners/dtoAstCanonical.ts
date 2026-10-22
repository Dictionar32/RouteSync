import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { parseResponseDtoDeclaration } from '../lexer/responseDtoDeclarationParser';
import type { DtoAst } from '../../../types/upstream/ast';
import type { SourceSpan } from '../../../types/upstream/provenance';
import { createSourceFile, createClassName } from '../../../types/upstream/names';
import type { LaravelDtoDeclarationClassIdentity, LaravelDtoDeclarationSourceEvidence, LaravelProjectDtoDeclarationInventoryInterface, LaravelDtoDeclarationDiscoveryBlocker } from '../../../types/upstream/laravelControllerResponseDtoDeclarationInterface';
import { createPhpQualifiedClassName, type PhpClassNameResolutionContext } from '../../../types/upstream/phpClassNameResolutionInterface';
import { phpClassNameResolutionAuthority } from '../../../types/upstream/phpClassNameResolutionAuthority';
import type { StringValue } from '../../../types/upstream/valueObjects';
import { dtoProducer } from './dtoProducer';

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const source = (file: string, line: number): SourceSpan => ({ kind: 'source_span', file: createSourceFile(file), start: { kind: 'number_value', value: line }, end: { kind: 'number_value', value: line } });

const declarationNamespaceContext = (tokens: ReturnType<typeof LaravelSourceLexer.tokenize>, classIndex: number): PhpClassNameResolutionContext => {
  const namespaceIndex = tokens.slice(0, classIndex).findLastIndex(token => token.type === 'IDENTIFIER' && token.value === 'namespace');
  const namespaceTerminator = namespaceIndex < 0
    ? -1
    : tokens.findIndex((token, index) => index > namespaceIndex && index < classIndex && (token.value === ';' || token.value === '{'));
  const namespaceName = namespaceIndex < 0 || namespaceTerminator < 0
    ? ''
    : tokens.slice(namespaceIndex + 1, namespaceTerminator).map(token => token.value).join('').replace(/^\\+|\\+$/g, '');
  return Object.freeze({
    kind: 'php_class_name_resolution_context',
    namespaceName: createPhpQualifiedClassName(namespaceName),
    classImports: Object.freeze([]),
    importInventory: 'complete',
  });
};

const resolveDeclaredDtoIdentity = (
  tokens: ReturnType<typeof LaravelSourceLexer.tokenize>,
  classIndex: number,
  className: string,
): LaravelDtoDeclarationClassIdentity => {
  const resolution = phpClassNameResolutionAuthority.judge(Object.freeze({
    kind: 'php_class_name_resolution_input',
    sourceName: createClassName(`namespace\\${className}`),
    context: declarationNamespaceContext(tokens, classIndex),
  }));
  switch (resolution.kind) {
    case 'php_class_name_resolved':
      return Object.freeze({ kind: 'dto_class_identity_resolved', resolution });
    case 'php_class_name_resolution_blocked':
      return Object.freeze({ kind: 'dto_class_identity_unresolved', resolution });
  }
};

export async function scanDtoAsts(sourceProject: SourceProjectIdentity): Promise<readonly DtoAst[]> {
  const inventory = await scanDtoDeclarationInventory(sourceProject);
  if (inventory.kind === 'laravel_project_dto_declaration_inventory_incomplete') {
    throw new Error(
      `DTO discovery is incomplete for ${sourceProject.root.value.value}: ${inventory.blockers.map(blocker => blocker.kind).join(', ')}`,
    );
  }
  return Object.freeze(inventory.receipt.declarations.map(evidence => evidence.declaration));
}

/**
 * Closed discovery result for the existing DTO scan scope. This stays in the
 * canonical DTO scanner; it does not introduce a second subscanner or semantic
 * name-resolution authority. Declared class identities are qualified through the
 * existing PHP class-name authority using the declaration's lexical namespace.
 */
export async function scanDtoDeclarationInventory(
  sourceProject: SourceProjectIdentity,
): Promise<LaravelProjectDtoDeclarationInventoryInterface> {
  const sourceRoot = sourceProject.root.value.value;
  const directory = path.join(sourceRoot, 'app', 'Http', 'DTOs');
  const scope = Object.freeze({
    kind: 'laravel_dto_declaration_discovery_scope' as const,
    projectRoot: sourceProject.root,
    relativeDirectory: 'app/Http/DTOs' as const,
  });
  const discoveredSourceFiles: ReturnType<typeof createSourceFile>[] = [];
  const declarations: LaravelDtoDeclarationSourceEvidence[] = [];
  const blockers: LaravelDtoDeclarationDiscoveryBlocker[] = [];

  const discoverDirectory = async (currentDirectory: string): Promise<void> => {
    let entries: Dirent[];
    try {
      entries = await fs.readdir(currentDirectory, { withFileTypes: true });
    } catch {
      blockers.push(Object.freeze({
        kind: 'dto_discovery_directory_unreadable',
        directory: createSourceFile(currentDirectory),
      }));
      return;
    }

    for (const entry of entries) {
      const entryPath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        await discoverDirectory(entryPath);
      } else if (entry.isFile() && entry.name.endsWith('.php')) {
        const sourceFile = createSourceFile(entryPath);
        discoveredSourceFiles.push(sourceFile);
        let sourceText: string;
        try {
          sourceText = await fs.readFile(entryPath, 'utf-8');
        } catch {
          blockers.push(Object.freeze({ kind: 'dto_source_file_unreadable', sourceFile }));
          continue;
        }

        try {
          const tokens = LaravelSourceLexer.tokenize(sourceText);
          const classIndex = tokens.findIndex(token => token.value === 'class');
          if (classIndex < 0) {
            continue;
          }
          const classNameToken = tokens[classIndex + 1];
          if (classNameToken === undefined) {
            throw Error(`DTO class name not found: ${entryPath}`);
          }
          const className = createAstIdentifier(classNameToken.value);
          const declaration = parseResponseDtoDeclaration(tokens, className);
          const ast = dtoProducer.produce({
            declaration,
            source: source(entryPath, Number(declaration.source.line)),
          });
          declarations.push(Object.freeze({
            kind: 'laravel_dto_declaration_source_evidence',
            sourceProject,
            declaration: ast,
            sourceFile,
            classIdentity: resolveDeclaredDtoIdentity(tokens, classIndex, ast.definition.name.value.value),
          }));
        } catch {
          blockers.push(Object.freeze({ kind: 'dto_declaration_parse_failed', sourceFile }));
        }
      }
    }
  };

  try {
    const rootStat = await fs.stat(directory);
    if (!rootStat.isDirectory()) {
      blockers.push(Object.freeze({ kind: 'dto_discovery_root_missing', root: createSourceFile(directory) }));
    } else {
      await discoverDirectory(directory);
    }
  } catch {
    blockers.push(Object.freeze({ kind: 'dto_discovery_root_missing', root: createSourceFile(directory) }));
  }

  const partialEvidence = Object.freeze({
    discoveredSourceFiles: Object.freeze([...discoveredSourceFiles]),
    declarations: Object.freeze([...declarations]),
  });
  const unresolved = Object.freeze([...blockers]) as readonly [LaravelDtoDeclarationDiscoveryBlocker, ...LaravelDtoDeclarationDiscoveryBlocker[]];
  return blockers.length === 0
    ? Object.freeze({
        kind: 'laravel_project_dto_declaration_inventory_complete',
        contractVersion: 4,
        sourceProject,
        receipt: Object.freeze({
          kind: 'laravel_dto_declaration_discovery_receipt',
          sourceProject,
          scope,
          discoveredSourceFiles: partialEvidence.discoveredSourceFiles,
          declarations: partialEvidence.declarations,
          obligations: Object.freeze([
            'all-php-files-discovered-within-declared-scope',
            'each-discovered-file-was-considered-for-a-dto-declaration',
            'each-produced-declaration-retains-canonical-source-identity',
            'class-identity-is-qualified-by-the-existing-php-class-name-resolution-authority-or-explicitly-unresolved',
          ] as const),
        }),
      })
    : Object.freeze({
        kind: 'laravel_project_dto_declaration_inventory_incomplete',
        contractVersion: 4,
        sourceProject,
        scope,
        partialEvidence,
        blockers: unresolved,
      });
}
