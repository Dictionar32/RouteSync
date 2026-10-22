import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { LaravelSourceLexer } from './LaravelSourceLexer';
import { createAstIdentifier, type TokenDescriptor } from './lexer/phpAstTypes';
import { phpClassNameResolutionContextAt } from './lexer/phpClassNameContextParser';
import { phpClassNameResolutionAuthority } from '../../types/upstream/phpClassNameResolutionAuthority';
import { createClassName, createSourceFile, type SourceFile } from '../../types/upstream/names';
import type { PhpClassNameResolution } from '../../types/upstream/phpClassNameResolutionInterface';
import type { SourceProjectIdentity } from '../../types/upstream/highLevelSourceModel';
import type { AttributeAst } from '../../types/upstream/ast';
import type { SourceSpan } from '../../types/upstream/provenance';
import type {
  LaravelAttributeScannerInterface,
  LaravelAttributeContextualityJudgment,
  LaravelAttributeNonContextualDeclarationJudgment,
  LaravelAttributeResolvedInterfaceEvidence,
  LaravelAttributeScanBlocker,
  LaravelAttributeScanFailure,
  LaravelAttributeScanFailureSequence,
  LaravelAttributeScanDiscoveryReceipt,
  LaravelAttributeDirectoryEnumerationEvidence,
  LaravelAttributeScanJudgment,
  LaravelAttributeScanScope,
  LaravelAttributeScannedFileSequence,
  LaravelAttributeSourceFileSequence,
  LaravelContextualAttributeContractResolution,
  LaravelContextualAttributeDeclarationEvidence,
  LaravelContextualAttributeImplementationProof,
  LaravelContextualAttributeResolvedInterfaceEvidence,
} from '../../types/upstream/laravelAttributeScannerInterface';
import { attributeProducer } from './attributeProducer';
import { phpAstExpressionSemanticAuthority } from './lexer/routeAst/phpAstExpressionSemanticAuthority';
import { phpClassConstructorSelectionAuthority } from '../../types/upstream/phpClassConstructorSelectionAuthority';

const source = (file: string, line: number): SourceSpan => Object.freeze({
  kind: 'source_span',
  file: createSourceFile(file),
  start: Object.freeze({ kind: 'number_value', value: line }),
  end: Object.freeze({ kind: 'number_value', value: line }),
});

const joinName = (tokens: readonly TokenDescriptor[]): string => tokens.map(token => token.value).join('');

const declarationIndex = (tokens: readonly TokenDescriptor[]): number =>
  tokens.findIndex((token, index) => token.type === 'IDENTIFIER' && token.value === 'class'
    && tokens[index - 1]?.value !== '::');

const classNameAt = (tokens: readonly TokenDescriptor[], index: number): string => {
  const name = tokens[index + 1];
  if (name === undefined || name.type !== 'IDENTIFIER') {
    throw Error('Attribute class declaration name is not available');
  }
  return name.value;
};

const declarationBodyBoundary = (tokens: readonly TokenDescriptor[], classIndex: number): number =>
  tokens.findIndex((token, index) => index > classIndex && token.value === '{');

const declaredInterfaceNames = (
  tokens: readonly TokenDescriptor[],
  classIndex: number,
): readonly Readonly<{ readonly name: string; readonly line: number }>[] => {
  const bodyBoundary = declarationBodyBoundary(tokens, classIndex);
  if (bodyBoundary < 0) throw Error('Attribute class declaration body boundary is not available');
  const implementsIndex = tokens.findIndex((token, index) => index > classIndex && index < bodyBoundary
    && token.type === 'IDENTIFIER' && token.value === 'implements');
  if (implementsIndex < 0) return Object.freeze([]);
  const segments: TokenDescriptor[][] = [];
  let current: TokenDescriptor[] = [];
  for (const token of tokens.slice(implementsIndex + 1, bodyBoundary)) {
    if (token.value === ',') {
      segments.push(current);
      current = [];
    } else {
      current.push(token);
    }
  }
  segments.push(current);
  return Object.freeze(segments.map(segment => {
    const first = segment[0];
    const name = joinName(segment);
    if (first === undefined || name.length === 0) throw Error('Attribute implemented interface name is incomplete');
    return Object.freeze({ name, line: Number(first.line) });
  }));
};

const canonicalContextualAttributeName = 'Illuminate\\Contracts\\Container\\ContextualAttribute';

type FilesystemAccessFailure = Readonly<{ readonly kind: 'filesystem_path_missing' }> | Readonly<{ readonly kind: 'filesystem_path_unreadable' }>;

const filesystemPathUnreadable: FilesystemAccessFailure = Object.freeze({ kind: 'filesystem_path_unreadable' });

const filesystemAccessFailure = (error: Error): FilesystemAccessFailure =>
  'code' in error && typeof error.code === 'string' && error.code === 'ENOENT'
    ? Object.freeze({ kind: 'filesystem_path_missing' })
    : filesystemPathUnreadable;

const resolveName = (name: string, tokens: readonly TokenDescriptor[], declarationIndexValue: number): PhpClassNameResolution =>
  phpClassNameResolutionAuthority.judge(Object.freeze({
    kind: 'php_class_name_resolution_input',
    sourceName: createClassName(name),
    context: phpClassNameResolutionContextAt(tokens, declarationIndexValue),
  }));

const canonicalResolution = (
  resolution: Extract<PhpClassNameResolution, { readonly kind: 'php_class_name_resolved' }>,
): LaravelContextualAttributeContractResolution => Object.freeze({
  kind: 'php_class_name_resolved',
  sourceName: resolution.sourceName,
  rule: resolution.rule,
  qualifiedName: Object.freeze({
    kind: 'php_qualified_class_name',
    value: Object.freeze({
      kind: 'string_value',
      value: canonicalContextualAttributeName,
    }),
  }),
});

const sourceFileSequence = (files: readonly SourceFile[]): LaravelAttributeSourceFileSequence => {
  const [head, ...tail] = files;
  return head === undefined
    ? Object.freeze({ kind: 'laravel_attribute_source_file_sequence_empty' })
    : Object.freeze({ kind: 'laravel_attribute_source_file_sequence_entry', sourceFile: head, rest: sourceFileSequence(tail) });
};

const scannedFileSequence = (files: readonly Readonly<{ sourceFile: SourceFile; ast: AttributeAst; contextuality: LaravelAttributeContextualityJudgment }>[]): LaravelAttributeScannedFileSequence => {
  const [head, ...tail] = files;
  return head === undefined
    ? Object.freeze({ kind: 'laravel_attribute_scanned_file_sequence_empty' })
    : Object.freeze({
        kind: 'laravel_attribute_scanned_file_sequence_entry',
        sourceFile: head.sourceFile,
        evidence: Object.freeze({
          kind: 'laravel_attribute_scanned_file_evidence',
          attribute: head.ast,
          contextuality: head.contextuality,
        }),
        rest: scannedFileSequence(tail),
      });
};

const declarationSequence = (declarations: readonly LaravelContextualAttributeDeclarationEvidence[]): import('../../types/upstream/laravelAttributeScannerInterface').LaravelContextualAttributeDeclarationSequence => {
  const [head, ...tail] = declarations;
  return head === undefined
    ? Object.freeze({ kind: 'laravel_contextual_attribute_declaration_sequence_empty' })
    : Object.freeze({ kind: 'laravel_contextual_attribute_declaration_sequence_entry', declaration: head, rest: declarationSequence(tail) });
};

const resolvedInterfaceSequence = (entries: readonly LaravelAttributeResolvedInterfaceEvidence[]): import('../../types/upstream/laravelAttributeScannerInterface').LaravelAttributeResolvedInterfaceSequence => {
  const [head, ...tail] = entries;
  return head === undefined
    ? Object.freeze({ kind: 'laravel_attribute_resolved_interface_sequence_empty' })
    : Object.freeze({ kind: 'laravel_attribute_resolved_interface_sequence_entry', evidence: head, rest: resolvedInterfaceSequence(tail) });
};

const failureSequenceOrEnd = (failures: readonly LaravelAttributeScanFailure[]): LaravelAttributeScanFailureSequence => {
  const [head, ...tail] = failures;
  if (head === undefined) throw Error('A blocked attribute scan must contain at least one failure');
  return tail.length === 0
    ? Object.freeze({ kind: 'laravel_attribute_scan_failure_sequence_end', failure: head })
    : Object.freeze({ kind: 'laravel_attribute_scan_failure_sequence_entry', failure: head, rest: failureSequenceOrEnd(tail) });
};

type AttributeFileScanJudgment =
  | Readonly<{
      readonly kind: 'laravel_attribute_file_scan_complete';
      readonly sourceFile: SourceFile;
      readonly ast: AttributeAst;
      readonly contextuality: LaravelAttributeContextualityJudgment;
    }>
  | Readonly<{
      readonly kind: 'laravel_attribute_file_scan_blocked';
      readonly sourceFile: SourceFile;
      readonly blockers: readonly LaravelAttributeScanFailure[];
    }>;

const scanAttribute = (file: string, text: string): AttributeFileScanJudgment => {
  const tokens = LaravelSourceLexer.tokenize(text);
  const classIndex = declarationIndex(tokens);
  if (classIndex < 0) {
    return Object.freeze({
      kind: 'laravel_attribute_file_scan_blocked',
      sourceFile: createSourceFile(file),
      blockers: Object.freeze([{ kind: 'laravel_attribute_declaration_parse_failed', sourceFile: createSourceFile(file) }]),
    });
  }
  const name = classNameAt(tokens, classIndex);
  const classSpan = source(file, Number(tokens[classIndex]?.line ?? 1));
  const classIdentityResolution = phpClassNameResolutionAuthority.judge(Object.freeze({
    kind: 'php_class_name_resolution_input',
    sourceName: createClassName(`namespace\\${name}`),
    context: phpClassNameResolutionContextAt(tokens, classIndex),
  }));
  const interfaces = declaredInterfaceNames(tokens, classIndex);
  const resolvedInterfaces = interfaces.map(entry => Object.freeze({
    entry,
    resolution: resolveName(entry.name, tokens, classIndex),
  }));
  const interfaceBlockers: LaravelAttributeScanBlocker[] = resolvedInterfaces
    .filter((candidate): candidate is typeof candidate & Readonly<{ resolution: Extract<PhpClassNameResolution, { readonly kind: 'php_class_name_resolution_blocked' }> }> => candidate.resolution.kind === 'php_class_name_resolution_blocked')
    .map(candidate => Object.freeze({
      kind: 'laravel_attribute_scan_blocker',
      source: source(file, candidate.entry.line),
      resolution: candidate.resolution,
    }));
  const failures: LaravelAttributeScanFailure[] = [...interfaceBlockers];
  if (classIdentityResolution.kind === 'php_class_name_resolution_blocked') {
    failures.push(Object.freeze({ kind: 'laravel_attribute_scan_blocker', source: classSpan, resolution: classIdentityResolution }));
  }
  if (failures.length > 0) return Object.freeze({ kind: 'laravel_attribute_file_scan_blocked', sourceFile: createSourceFile(file), blockers: Object.freeze(failures) });
  if (classIdentityResolution.kind !== 'php_class_name_resolved') {
    return Object.freeze({ kind: 'laravel_attribute_file_scan_blocked', sourceFile: createSourceFile(file), blockers: Object.freeze([{ kind: 'laravel_attribute_declaration_parse_failed', sourceFile: createSourceFile(file) }]) });
  }

  type ResolvedInterfaceCandidate = Readonly<{
    readonly entry: (typeof interfaces)[number];
    readonly resolution: Extract<PhpClassNameResolution, { readonly kind: 'php_class_name_resolved' }>;
  }>;
  const resolvedEvidence: readonly LaravelAttributeResolvedInterfaceEvidence[] = resolvedInterfaces
    .filter((candidate): candidate is ResolvedInterfaceCandidate => candidate.resolution.kind === 'php_class_name_resolved')
    .map(candidate => Object.freeze({
      kind: 'laravel_attribute_resolved_interface_evidence',
      declaration: Object.freeze({
        kind: 'laravel_attribute_declared_interface_evidence',
        sourceName: createClassName(candidate.entry.name),
        source: source(file, candidate.entry.line),
      }),
      resolution: candidate.resolution,
    }));
  const contextualIndex = resolvedEvidence.findIndex(evidence =>
    evidence.resolution.qualifiedName.value.value.toLowerCase() === canonicalContextualAttributeName.toLowerCase());
  const contextuality: LaravelAttributeContextualityJudgment = contextualIndex < 0
    ? Object.freeze({
        kind: 'laravel_attribute_non_contextual_declaration',
        closed: true,
        qualifiedIdentity: classIdentityResolution.qualifiedName,
        source: classSpan,
        interfaceInventory: Object.freeze({
          kind: 'laravel_attribute_resolved_interface_inventory',
          closed: true,
          declarationSource: classSpan,
          entries: resolvedInterfaceSequence(resolvedEvidence),
        }),
      } satisfies LaravelAttributeNonContextualDeclarationJudgment)
    : (() => {
        const implementationEvidence = resolvedEvidence[contextualIndex];
        if (implementationEvidence === undefined) {
          return Object.freeze({
            kind: 'laravel_attribute_non_contextual_declaration',
            closed: true,
            qualifiedIdentity: classIdentityResolution.qualifiedName,
            source: classSpan,
            interfaceInventory: Object.freeze({
              kind: 'laravel_attribute_resolved_interface_inventory',
              closed: true,
              declarationSource: classSpan,
              entries: resolvedInterfaceSequence(resolvedEvidence),
            }),
          } satisfies LaravelAttributeNonContextualDeclarationJudgment);
        }
        const contextualEvidence: LaravelContextualAttributeResolvedInterfaceEvidence = Object.freeze({
          kind: 'laravel_attribute_resolved_interface_evidence',
          declaration: implementationEvidence.declaration,
          resolution: canonicalResolution(implementationEvidence.resolution),
        });
        const proof: LaravelContextualAttributeImplementationProof = Object.freeze({
          kind: 'laravel_contextual_attribute_implementation_proof',
          contract: Object.freeze({ kind: 'laravel_contextual_attribute_contract_identity', qualifiedName: canonicalContextualAttributeName }),
          interfaceEvidence: contextualEvidence,
        });
        return Object.freeze({
          kind: 'laravel_contextual_attribute_declaration_evidence',
          identity: createClassName(name),
          qualifiedIdentity: classIdentityResolution.qualifiedName,
          source: classSpan,
          interfaceInventory: Object.freeze({
            kind: 'laravel_contextual_attribute_resolved_interface_inventory',
            closed: true,
            declarationSource: classSpan,
            before: resolvedInterfaceSequence(resolvedEvidence.slice(0, contextualIndex)),
            implementation: proof,
            after: resolvedInterfaceSequence(resolvedEvidence.slice(contextualIndex + 1)),
          }),
        });
      })();
  const declaration = LaravelSourceLexer.parseControllerDeclaration(text, tokens, createAstIdentifier(name), { kind: 'syntax_only' });
  const produced = attributeProducer.produce({ declaration, source: classSpan, contextuality, expressionAuthority: phpAstExpressionSemanticAuthority, constructorSelectionAuthority: phpClassConstructorSelectionAuthority });
  if (produced.kind === 'attribute_producer_blocked') {
    return Object.freeze({
      kind: 'laravel_attribute_file_scan_blocked',
      sourceFile: createSourceFile(file),
      blockers: Object.freeze([produced.blocker.kind === 'attribute_producer_constructor_missing'
        ? { kind: 'laravel_attribute_constructor_missing' as const, declarationSource: produced.blocker.declarationSource }
        : produced.blocker.kind === 'attribute_producer_constructor_ambiguous'
          ? { kind: 'laravel_attribute_constructor_ambiguous' as const, declarationSource: produced.blocker.declarationSource, candidates: produced.blocker.candidates }
          : { kind: 'laravel_attribute_constructor_inventory_blocked' as const, declarationSource: produced.blocker.declarationSource, blockers: produced.blocker.blockers }]),
    });
  }
  return Object.freeze({ kind: 'laravel_attribute_file_scan_complete', sourceFile: createSourceFile(file), ast: produced.attribute, contextuality });
};

type AttributeFileDiscovery = Readonly<{
  readonly files: readonly string[];
  readonly failures: readonly LaravelAttributeScanFailure[];
}>;

const discoverFiles = async (directory: string): Promise<AttributeFileDiscovery> => {
  let entries: readonly import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch {
    const failure: LaravelAttributeScanFailure = Object.freeze({
      kind: 'laravel_attribute_discovery_directory_unreadable',
      directory: createSourceFile(directory),
    });
    return Object.freeze({ files: Object.freeze([]), failures: Object.freeze([failure]) });
  }
  const nested = await Promise.all(entries.map(async entry => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return discoverFiles(absolute);
    return Object.freeze({
      files: entry.isFile() && entry.name.endsWith('.php') ? Object.freeze([absolute]) : Object.freeze([]),
      failures: Object.freeze([]),
    });
  }));
  return Object.freeze({
    files: Object.freeze(nested.flatMap(result => result.files).sort((left, right) => left.localeCompare(right, 'en'))),
    failures: Object.freeze(nested.flatMap(result => result.failures)),
  });
};

const failureResult = (
  sourceProject: SourceProjectIdentity,
  scope: LaravelAttributeScanScope,
  discoveredFiles: readonly SourceFile[],
  failures: readonly LaravelAttributeScanFailure[],
): LaravelAttributeScanJudgment => Object.freeze({
  kind: 'laravel_attribute_scan_blocked',
  closed: true,
  contractVersion: 20,
  sourceProject,
  partialDiscovery: Object.freeze({ scope, discoveredSourceFiles: sourceFileSequence(discoveredFiles) }),
  blockers: failureSequenceOrEnd(failures),
});

export const laravelAttributeScanner: LaravelAttributeScannerInterface = Object.freeze({
  kind: 'laravel_attribute_scanner',
  closed: true,
  contractVersion: 20,
  scan: async (sourceProject: SourceProjectIdentity): Promise<LaravelAttributeScanJudgment> => {
  const rootPath = sourceProject.root.value.value;
  const root = createSourceFile(rootPath);
  const directory = path.join(rootPath, 'app', 'Attributes');
  const directorySource = createSourceFile(directory);
  const scope: LaravelAttributeScanScope = Object.freeze({
    kind: 'laravel_attribute_scan_scope',
    sourceProject,
    relativeDirectory: 'app/Attributes',
  });
  try {
    await fs.access(rootPath);
  } catch (error: unknown) {
    const accessFailure = error instanceof Error
      ? filesystemAccessFailure(error)
      : filesystemPathUnreadable;
    return accessFailure.kind === 'filesystem_path_missing'
      ? failureResult(sourceProject, scope, [], [Object.freeze({ kind: 'laravel_attribute_discovery_root_missing', root })])
      : failureResult(sourceProject, scope, [], [Object.freeze({ kind: 'laravel_attribute_discovery_root_unreadable', root })]);
  }
  try {
    await fs.access(directory);
  } catch (error: unknown) {
    const accessFailure = error instanceof Error
      ? filesystemAccessFailure(error)
      : filesystemPathUnreadable;
    return accessFailure.kind === 'filesystem_path_missing'
      ? failureResult(sourceProject, scope, [], [Object.freeze({ kind: 'laravel_attribute_discovery_scope_missing', directory: directorySource })])
      : failureResult(sourceProject, scope, [], [Object.freeze({ kind: 'laravel_attribute_discovery_directory_unreadable', directory: directorySource })]);
  }
  const discovery = await discoverFiles(directory);
  const filePaths = discovery.files;
  const sourceFiles = filePaths.map(createSourceFile);
  if (discovery.failures.length > 0) {
    return failureResult(sourceProject, scope, sourceFiles, discovery.failures);
  }
  const results: AttributeFileScanJudgment[] = await Promise.all(filePaths.map(async (file): Promise<AttributeFileScanJudgment> => {
    let text: string;
    try {
      text = await fs.readFile(file, 'utf8');
    } catch {
      return Object.freeze({
        kind: 'laravel_attribute_file_scan_blocked',
        sourceFile: createSourceFile(file),
        blockers: Object.freeze([{ kind: 'laravel_attribute_source_file_unreadable', sourceFile: createSourceFile(file) }]),
      });
    }
    try {
      return scanAttribute(file, text);
    } catch {
      return Object.freeze({
        kind: 'laravel_attribute_file_scan_blocked',
        sourceFile: createSourceFile(file),
        blockers: Object.freeze([{ kind: 'laravel_attribute_declaration_parse_failed', sourceFile: createSourceFile(file) }]),
      });
    }
  }));
  const failures = results.flatMap(result => result.kind === 'laravel_attribute_file_scan_blocked' ? result.blockers : []);
  if (failures.length > 0) return failureResult(sourceProject, scope, sourceFiles, failures);

  const complete = results.flatMap(result => result.kind === 'laravel_attribute_file_scan_complete'
    ? [{ sourceFile: result.sourceFile, ast: result.ast, contextuality: result.contextuality }]
    : []);
  const contextualDeclarations = complete.flatMap(result => result.contextuality.kind === 'laravel_contextual_attribute_declaration_evidence'
    ? [result.contextuality]
    : []);
  const enumeration: LaravelAttributeDirectoryEnumerationEvidence = Object.freeze({
    kind: 'laravel_attribute_directory_enumeration_evidence',
    closed: true,
    sourceRoot: root,
    directory: directorySource,
    scope,
    order: 'deterministic-relative-path-order',
  });
  const receipt: LaravelAttributeScanDiscoveryReceipt = Object.freeze({
    kind: 'laravel_attribute_scan_discovery_receipt',
    closed: true,
    sourceProject,
    scope,
    files: scannedFileSequence(complete),
    enumeration,
  });
  return Object.freeze({
    kind: 'laravel_attribute_scan_complete',
    closed: true,
    contractVersion: 20,
    sourceProject,
    discoveryReceipt: receipt,
    contextualAttributeInventory: Object.freeze({
      kind: 'laravel_contextual_attribute_inventory_complete',
      closed: true,
      sourceProject,
      scope,
      declarations: declarationSequence(contextualDeclarations),
    }),
  });
  },
});
