/**
 * Whole-file PHP AST adapter for the upstream source-evidence contract.
 * Parsing and syntax inventory only: namespace/name resolution and invocation
 * semantic judgments remain owned by upstream authorities.
 */
import { Engine } from 'php-parser';
import type {
  Expression,
  ExpressionArgument,
  ExpressionArguments,
  PhpDeclaredFunctionSymbol,
  PhpFunctionImportBinding,
  PhpFunctionNameSegment,
  PhpFunctionNameSyntaxEvidence,
  PhpFunctionResolutionEnvironmentCompletenessWitness,
  PhpFunctionResolutionSourceInventoryInput,
  PhpNamespaceImportBinding,
  PhpNamespaceName,
  PhpNamespaceRegionIdentity,
  PhpNamespaceRegionInventory,
  PhpSourceDocument,
  PhpSourceFrontendExtraction,
  PhpSourceFrontendInterface,
  PhpSourceFrontendParserFailureDiagnostic,
  PhpSourceFrontendParserFailureLocation,
  PhpSourceFrontendTraversalEvidence,
  PhpSourceInvocationSyntaxInventory,
  PhpQualifiedFunctionName,
  SourceFile,
  SourceSpan,
  FunctionName,
} from '@routesync/core';
import { PHP_SOURCE_FRONTEND_CONTRACT, numberValue, sourceSpanFactory, stringValue } from '@routesync/core';

type AstObject = Readonly<Record<string, unknown>>;
type LocatedAstObject = AstObject & Readonly<{ readonly loc: AstObject }>;

const parser = new Engine({ parser: { extractDoc: true, php7: true }, ast: { withPositions: true } });
const wholeFileObligations = Object.freeze([
  'namespace-region-declarations',
  'region-source-boundaries',
  'namespace-prefix-import-declarations',
  'function-import-declarations',
  'named-function-declarations',
  'function-invocation-nodes',
  'invocation-argument-lists',
  'source-offsets-and-file-identity',
] satisfies readonly [
  'namespace-region-declarations', 'region-source-boundaries', 'namespace-prefix-import-declarations', 'function-import-declarations',
  'named-function-declarations', 'function-invocation-nodes', 'invocation-argument-lists', 'source-offsets-and-file-identity',
]);
const regionObligations = Object.freeze([
  'namespace-region-inventoried',
  'namespace-prefix-imports-inventoried',
  'function-imports-inventoried',
  'function-declarations-inventoried',
] satisfies readonly [
  'namespace-region-inventoried', 'namespace-prefix-imports-inventoried', 'function-imports-inventoried', 'function-declarations-inventoried',
]);
const invocationObligations = Object.freeze([
  'all-function-invocation-nodes-inventoried',
  'all-invocation-argument-lists-captured',
  'all-callee-syntax-preserved-before-name-resolution',
] satisfies readonly [
  'all-function-invocation-nodes-inventoried', 'all-invocation-argument-lists-captured', 'all-callee-syntax-preserved-before-name-resolution',
]);

const isObject = (value: unknown): value is AstObject => typeof value === 'object' && value !== null && !Array.isArray(value);
const isArray = (value: unknown): value is readonly unknown[] => Array.isArray(value);
const field = (node: AstObject, key: string): unknown => node[key];
const textField = (node: AstObject, key: string): string | undefined => {
  const value = field(node, key);
  return typeof value === 'string' ? value : undefined;
};
const objectField = (node: AstObject, key: string): AstObject | undefined => {
  const value = field(node, key);
  return isObject(value) ? value : undefined;
};
const arrayField = (node: AstObject, key: string): readonly unknown[] => {
  const value = field(node, key);
  return isArray(value) ? value : [];
};
const nodeKind = (node: AstObject): string => textField(node, 'kind') ?? 'unknown';
const location = (node: AstObject): LocatedAstObject | undefined => {
  const loc = objectField(node, 'loc');
  return loc === undefined ? undefined : { ...node, loc };
};
const offset = (node: LocatedAstObject, side: 'start' | 'end'): number | undefined => {
  const position = objectField(node.loc, side);
  const value = position === undefined ? undefined : field(position, 'offset');
  return typeof value === 'number' && Number.isInteger(value) ? value : undefined;
};
const span = (file: SourceFile, start: number, end: number): SourceSpan =>
  sourceSpanFactory.create(file, numberValue(start), numberValue(end));
const nodeSpan = (node: AstObject, file: SourceFile): SourceSpan | undefined => {
  const located = location(node);
  const start = located === undefined ? undefined : offset(located, 'start');
  const end = located === undefined ? undefined : offset(located, 'end');
  return start === undefined || end === undefined || end < start ? undefined : span(file, start, end);
};
const functionName = (value: string): FunctionName => Object.freeze({ kind: 'function_name', value: stringValue.create(value) });
const namespaceName = (value: string): PhpNamespaceName => Object.freeze({ kind: 'php_namespace_name', value: stringValue.create(value.replace(/^\\+/, '').replace(/\\+$/, '')) });
const qualifiedFunctionName = (value: string): PhpQualifiedFunctionName => Object.freeze({ kind: 'php_qualified_function_name', value: stringValue.create(value.replace(/^\\+/, '')) });
const stringNodeValue = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (!isObject(value)) return undefined;
  return textField(value, 'name') ?? textField(value, 'value');
};
const nameText = (node: AstObject): string | undefined => stringNodeValue(field(node, 'name'));
const aliasText = (node: AstObject): string | undefined => stringNodeValue(field(node, 'alias'));
const walk = (root: unknown): readonly AstObject[] => {
  const output: AstObject[] = [];
  const visited = new Set<object>();
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!isObject(value) || visited.has(value)) return;
    visited.add(value);
    if (typeof field(value, 'kind') === 'string') output.push(value);
    Object.entries(value).forEach(([key, child]) => {
      if (key !== 'loc' && key !== 'comments' && key !== 'tokens' && key !== 'parent') visit(child);
    });
  };
  visit(root);
  return output;
};
const sequence = <T>(items: readonly T[]): import('@routesync/core').Sequence<T> =>
  items.reduceRight<import('@routesync/core').Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });

const parserFailureDiagnostic = (error: unknown): PhpSourceFrontendParserFailureDiagnostic => {
  if (!(error instanceof Error)) return Object.freeze({ kind: 'php_source_frontend_parser_failure_diagnostic_unavailable' });
  const line: unknown = Reflect.get(error, 'lineNumber');
  const column: unknown = Reflect.get(error, 'columnNumber');
  const location: PhpSourceFrontendParserFailureLocation =
    typeof line === 'number' && Number.isInteger(line) && line > 0
      && typeof column === 'number' && Number.isInteger(column) && column > 0
      ? Object.freeze({ kind: 'php_source_frontend_parser_location_available', line: numberValue(line), column: numberValue(column) })
      : Object.freeze({ kind: 'php_source_frontend_parser_location_unavailable' });
  return Object.freeze({ kind: 'php_source_frontend_parser_error_diagnostic', message: stringValue.create(error.message), location });
};

const incompleteExtraction = (document: PhpSourceDocument, diagnostic: PhpSourceFrontendParserFailureDiagnostic): PhpSourceFrontendExtraction => {
  const file = document.sourceFile;
  const end = document.content.value.value.length;
  const source = span(file, 0, end);
  const missing = Object.freeze([
    'namespace-region-declarations',
    'namespace-prefix-import-declarations',
    'function-import-declarations',
    'named-function-declarations',
    'region-source-boundaries',
  ] satisfies readonly ['namespace-region-declarations', 'namespace-prefix-import-declarations', 'function-import-declarations', 'named-function-declarations', 'region-source-boundaries']);
  const inventory: PhpFunctionResolutionSourceInventoryInput = Object.freeze({
    kind: 'php_function_resolution_source_inventory_input', sourceFile: file, source, regions: Object.freeze([]),
    coverage: Object.freeze({ kind: 'php_function_resolution_source_inventory_coverage_incomplete', sourceFile: file, source, missingEvidence: missing }),
  });
  const invocationInventory: PhpSourceInvocationSyntaxInventory = Object.freeze({
    kind: 'php_source_invocation_syntax_inventory_incomplete', sourceFile: file, source, entries: Object.freeze([]),
    missingEvidence: Object.freeze(['all-function-invocation-nodes-inventoried', 'all-invocation-argument-lists-captured', 'all-callee-syntax-preserved-before-name-resolution']),
  });
  const traversal: PhpSourceFrontendTraversalEvidence = Object.freeze({
    kind: 'php_source_partial_token_or_method_body_traversal', sourceFile: file, source, completeness: 'incomplete',
    missingEvidence: Object.freeze(['namespace-region-declarations', 'function-invocation-nodes']),
  });
  return Object.freeze({
    kind: 'php_source_frontend_extraction', sourceFile: file, source, nameResolutionInventory: inventory,
    invocationInventory, traversal,
    coverage: Object.freeze({ kind: 'php_source_frontend_parse_blocked', sourceFile: file, source, failure: Object.freeze({ kind: 'php_source_frontend_parser_rejected_source', diagnostic }) }),
  });
};

const makeSyntax = (callee: AstObject, sourceText: string, file: SourceFile): PhpFunctionNameSyntaxEvidence | undefined => {
  const calleeSpan = nodeSpan(callee, file);
  if (calleeSpan === undefined) return undefined;
  const raw = sourceText.slice(calleeSpan.start.value, calleeSpan.end.value).trim();
  const fullyQualified = raw.startsWith('\\');
  const pieces = raw.replace(/^\\+/, '').split('\\').filter(piece => piece.length > 0);
  if (pieces.length === 0) return Object.freeze({ kind: 'malformed_function_name_evidence', reason: 'missing_name_segment', source: calleeSpan });
  let cursor = calleeSpan.start.value + (fullyQualified ? 1 : 0);
  const segments: PhpFunctionNameSegment[] = pieces.map(piece => {
    const start = sourceText.indexOf(piece, cursor);
    const resolvedStart = start < 0 ? cursor : start;
    cursor = resolvedStart + piece.length;
    return Object.freeze({ kind: 'php_function_name_segment', name: functionName(piece), source: span(file, resolvedStart, cursor) });
  });
  if (segments.length === 1 && !fullyQualified) return Object.freeze({ kind: 'unqualified_function_name_evidence', segment: segments[0] });
  const [first, ...rest] = segments;
  if (first === undefined) return Object.freeze({ kind: 'malformed_function_name_evidence', reason: 'missing_name_segment', source: calleeSpan });
  const nonEmptySegments: readonly [PhpFunctionNameSegment, ...PhpFunctionNameSegment[]] = [first, ...rest];
  if (fullyQualified) return Object.freeze({ kind: 'fully_qualified_function_name_evidence', segments: nonEmptySegments });
  return Object.freeze({ kind: 'qualified_function_name_evidence', segments: nonEmptySegments });
};

const unsupportedArgumentExpression = (value: unknown, file: SourceFile): Expression | undefined => {
  const valueNode = isObject(value) ? value : undefined;
  const source = valueNode === undefined ? undefined : nodeSpan(valueNode, file);
  return source === undefined ? undefined : Object.freeze({ kind: 'unsupported_expression', reason: { kind: 'unsupported_syntax' }, source });
};
const argumentList = (call: AstObject, file: SourceFile): ExpressionArguments | undefined => {
  const values = arrayField(call, 'arguments');
  const items: ExpressionArgument[] = [];
  for (const item of values) {
    if (!isObject(item)) return undefined;
    const kind = nodeKind(item);
    const named = kind === 'namedargument';
    const unpacked = kind === 'variadic' || field(item, 'unpack') === true;
    const value = named
      ? field(item, 'value')
      : unpacked
        ? field(item, 'what') ?? field(item, 'value') ?? item
        : nodeKind(item) === 'argument'
          ? field(item, 'value') ?? field(item, 'expression')
          : item;
    const expression = unsupportedArgumentExpression(value, file);
    if (expression === undefined) return undefined;
    if (named) {
      const name = stringNodeValue(field(item, 'name'));
      if (name === undefined) return undefined;
      items.push(Object.freeze({ kind: 'named', name: Object.freeze({ kind: 'expression_argument_name', value: stringValue.create(name) }), value: expression }));
    } else {
      items.push(Object.freeze({ kind: unpacked ? 'unpacked' : 'positional', value: expression }));
    }
  }
  return Object.freeze({ kind: 'expression_arguments', items: sequence(items) });
};

const explicitImportKind = (node: AstObject): 'function' | 'namespace' | undefined => {
  const value = textField(node, 'type');
  return value === 'function' ? 'function' : value === 'class' || value === 'namespace' ? 'namespace' : undefined;
};
const importItems = (node: AstObject): readonly AstObject[] => {
  const items = arrayField(node, 'items').filter(isObject);
  return items.length > 0 ? items : [node];
};
const importTarget = (node: AstObject, groupPrefix: string): string | undefined => {
  const name = nameText(node);
  if (name === undefined) return undefined;
  const prefix = groupPrefix.replace(/\\+$/, '');
  const suffix = name.replace(/^\\+/, '');
  return prefix.length === 0 ? suffix : `${prefix}\\${suffix}`;
};
const defaultAlias = (target: string): string => target.split('\\').filter(part => part.length > 0).at(-1) ?? target;

export const phpSourceFrontendAstAdapter: PhpSourceFrontendInterface = Object.freeze({
  kind: 'php_source_frontend',
  contract: PHP_SOURCE_FRONTEND_CONTRACT,
  extract: (document: PhpSourceDocument): PhpSourceFrontendExtraction => {
    const sourceText = document.content.value.value;
    const file = document.sourceFile;
    const source = span(file, 0, sourceText.length);
    let root: unknown;
    try {
      root = parser.parseCode(sourceText, file.value.value);
    } catch (error: unknown) {
      return incompleteExtraction(document, parserFailureDiagnostic(error));
    }
    const nodes = walk(root);
    let sourceInventoryMappingComplete = true;
    let invocationMappingComplete = true;
    const allNamespaceNodes = nodes.filter(node => nodeKind(node) === 'namespace');
    const namespaceNodes = allNamespaceNodes.filter(node => nodeSpan(node, file) !== undefined);
    if (namespaceNodes.length !== allNamespaceNodes.length) sourceInventoryMappingComplete = false;
    const orderedNamespaces = [...namespaceNodes].sort((left, right) => (nodeSpan(left, file)?.start.value ?? 0) - (nodeSpan(right, file)?.start.value ?? 0));
    const regions: { readonly identity: PhpNamespaceRegionIdentity; readonly start: number; readonly end: number; readonly namespace: string }[] = [];
    if (orderedNamespaces.length === 0) {
      regions.push({ identity: Object.freeze({ kind: 'global_php_namespace_region', sourceFile: file, source }), start: 0, end: sourceText.length, namespace: '' });
    } else {
      orderedNamespaces.forEach((node, index) => {
        const nodeSource = nodeSpan(node, file);
        if (nodeSource === undefined) return;
        const end = orderedNamespaces[index + 1] === undefined ? sourceText.length : nodeSpan(orderedNamespaces[index + 1], file)?.start.value ?? sourceText.length;
        const declaredNamespace = nameText(node);
        const bracketedGlobalNamespace = field(node, 'withBrackets') === true;
        if (declaredNamespace === undefined && !bracketedGlobalNamespace) sourceInventoryMappingComplete = false;
        const name = declaredNamespace ?? '';
        const regionSource = span(file, nodeSource.start.value, end);
        const identity: PhpNamespaceRegionIdentity = name.length === 0
          ? Object.freeze({ kind: 'global_php_namespace_region', sourceFile: file, source: regionSource })
          : Object.freeze({ kind: 'named_php_namespace_region', sourceFile: file, source: regionSource, namespace: namespaceName(name) });
        regions.push({ identity, start: regionSource.start.value, end: regionSource.end.value, namespace: name.replace(/^\\+/, '').replace(/\\+$/, '') });
      });
    }
    const regionFor = (node: AstObject) => {
      const nodeSource = nodeSpan(node, file);
      return nodeSource === undefined ? undefined : regions.find(region => nodeSource.start.value >= region.start && nodeSource.start.value < region.end);
    };
    const namespaceImports = new Map<PhpNamespaceRegionIdentity, PhpNamespaceImportBinding[]>();
    const functionImports = new Map<PhpNamespaceRegionIdentity, PhpFunctionImportBinding[]>();
    const declarations = new Map<PhpNamespaceRegionIdentity, PhpDeclaredFunctionSymbol[]>();
    regions.forEach(region => {
      namespaceImports.set(region.identity, []);
      functionImports.set(region.identity, []);
      declarations.set(region.identity, []);
    });
    nodes.filter(node => ['usegroup', 'use'].includes(nodeKind(node))).forEach(node => {
      const region = regionFor(node);
      const nodeSource = nodeSpan(node, file);
      if (region === undefined || nodeSource === undefined) { sourceInventoryMappingComplete = false; return; }
      const groupPrefix = nodeKind(node) === 'usegroup' ? nameText(node) ?? '' : '';
      importItems(node).forEach(item => {
        const kind = explicitImportKind(item) ?? explicitImportKind(node) ?? 'namespace';
        const target = importTarget(item, groupPrefix);
        const itemSource = nodeSpan(item, file) ?? nodeSource;
        if (target === undefined || kind === undefined) { sourceInventoryMappingComplete = false; return; }
        const alias = aliasText(item) ?? defaultAlias(target);
        if (kind === 'function') {
          functionImports.get(region.identity)?.push(Object.freeze({ kind: 'php_function_import_binding', alias: functionName(alias), target: qualifiedFunctionName(target), source: itemSource, region: region.identity }));
        } else {
          namespaceImports.get(region.identity)?.push(Object.freeze({ kind: 'php_namespace_import_binding', alias: functionName(alias), target: namespaceName(target), source: itemSource, region: region.identity }));
        }
      });
    });
    nodes.filter(node => nodeKind(node) === 'function').forEach(node => {
      const region = regionFor(node);
      const nodeSource = nodeSpan(node, file);
      const name = nameText(node);
      if (region === undefined || nodeSource === undefined || name === undefined) { sourceInventoryMappingComplete = false; return; }
      const qualified = region.namespace.length === 0 ? name : `${region.namespace}\\${name}`;
      declarations.get(region.identity)?.push(Object.freeze({ kind: 'php_declared_function_symbol', name: functionName(name), qualifiedName: qualifiedFunctionName(qualified), source: nodeSource, region: region.identity }));
    });
    const regionInventories: PhpNamespaceRegionInventory[] = regions.map(region => {
      const completeness: PhpFunctionResolutionEnvironmentCompletenessWitness = Object.freeze({
        kind: 'php_function_resolution_environment_complete', sourceFile: file,
        source: region.identity.source, region: region.identity, obligations: regionObligations,
      });
      return Object.freeze({
        kind: 'php_namespace_region_inventory', region: region.identity,
        namespaceImports: Object.freeze({ kind: 'php_namespace_imports', items: Object.freeze(namespaceImports.get(region.identity) ?? []) }),
        functionImports: Object.freeze({ kind: 'php_function_imports', items: Object.freeze(functionImports.get(region.identity) ?? []) }),
        declarations: Object.freeze({ kind: 'php_declared_functions', items: Object.freeze(declarations.get(region.identity) ?? []) }),
        completeness,
      });
    });
    const inventory: PhpFunctionResolutionSourceInventoryInput = Object.freeze({
      kind: 'php_function_resolution_source_inventory_input', sourceFile: file, source,
      regions: Object.freeze(regionInventories),
      coverage: sourceInventoryMappingComplete
        ? Object.freeze({ kind: 'php_function_resolution_source_inventory_coverage_complete', sourceFile: file, source, obligations: Object.freeze(['all-namespace-region-declarations-visited', 'all-import-declarations-visited-per-region', 'all-named-function-declarations-visited-per-region', 'all-region-boundaries-accounted-for'] satisfies readonly ['all-namespace-region-declarations-visited', 'all-import-declarations-visited-per-region', 'all-named-function-declarations-visited-per-region', 'all-region-boundaries-accounted-for']) })
        : Object.freeze({ kind: 'php_function_resolution_source_inventory_coverage_incomplete', sourceFile: file, source, missingEvidence: Object.freeze(['namespace-region-declarations', 'namespace-prefix-import-declarations', 'function-import-declarations', 'named-function-declarations'] satisfies readonly ['namespace-region-declarations', 'namespace-prefix-import-declarations', 'function-import-declarations', 'named-function-declarations']) }),
    });
    const invocationEntries = nodes.flatMap((node) => {
      if (nodeKind(node) !== 'call') return [];
      const callee = objectField(node, 'what');
      // A parser call node that is not representable by the function-name
      // syntax algebra is still source evidence. Do not silently omit it and
      // then publish a false whole-file-complete invocation inventory.
      if (callee === undefined || nodeKind(callee) !== 'name') {
        invocationMappingComplete = false;
        return [];
      }
      const invocationSource = nodeSpan(node, file);
      const syntax = makeSyntax(callee, sourceText, file);
      if (invocationSource === undefined || syntax === undefined) { invocationMappingComplete = false; return []; }
      const argumentsEvidence = argumentList(node, file);
      if (argumentsEvidence === undefined) { invocationMappingComplete = false; return []; }
      return [Object.freeze({
        kind: 'php_function_invocation_source_syntax_evidence', sourceFile: file,
        source: invocationSource, syntax, arguments: argumentsEvidence,
      })];
    });
    const invocationInventory: PhpSourceInvocationSyntaxInventory = invocationMappingComplete
      ? Object.freeze({ kind: 'php_source_invocation_syntax_inventory_complete', sourceFile: file, source, entries: Object.freeze(invocationEntries), obligations: invocationObligations })
      : Object.freeze({ kind: 'php_source_invocation_syntax_inventory_incomplete', sourceFile: file, source, entries: Object.freeze(invocationEntries), missingEvidence: Object.freeze(['all-function-invocation-nodes-inventoried', 'all-invocation-argument-lists-captured', 'all-callee-syntax-preserved-before-name-resolution']) });
    const traversal: PhpSourceFrontendTraversalEvidence = Object.freeze({
      kind: 'php_source_whole_file_ast_traversal', sourceFile: file, source, completeness: 'complete',
      obligations: wholeFileObligations, unvisitedSyntaxFamilies: Object.freeze([]),
    });
    return Object.freeze({
      kind: 'php_source_frontend_extraction', sourceFile: file, source, nameResolutionInventory: inventory,
      invocationInventory, traversal,
      coverage: sourceInventoryMappingComplete && invocationMappingComplete
        ? Object.freeze({ kind: 'php_source_frontend_coverage_complete', sourceFile: file, source, obligations: wholeFileObligations })
        : Object.freeze({ kind: 'php_source_frontend_coverage_incomplete', sourceFile: file, source, missingEvidence: Object.freeze([
          ...(!sourceInventoryMappingComplete ? ['namespace-region-declarations', 'function-import-declarations'] as const : []),
          ...(!invocationMappingComplete ? ['function-invocation-nodes', 'invocation-argument-lists'] as const : []),
        ]) }),
    });
  },
});
