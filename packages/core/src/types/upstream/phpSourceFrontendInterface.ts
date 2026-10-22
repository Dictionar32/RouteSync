import type { ExpressionArguments } from './expression';
import type {
  PhpFunctionNameSyntaxEvidence,
  PhpFunctionResolutionSourceInventoryInput,
  PhpFunctionResolutionSourceInventoryObligation,
} from './phpFunctionNameResolutionInterface';
import type { SourceFile } from './names';
import type { SourceSpan } from './provenance';
import { stringValue, type NumberValue, type StringValue } from './valueObjects';

/** Source bytes/text are owned by the frontend; downstream stages receive typed evidence, not reparsed strings. */
export interface PhpSourceDocument {
  readonly kind: 'php_source_document';
  readonly sourceFile: SourceFile;
  readonly content: PhpSourceText;
}

export interface PhpSourceText {
  readonly kind: 'php_source_text';
  readonly value: StringValue;
}

/** Constructs the source-domain value used at scanner ingress boundaries. */
export const phpSourceTextOf = (value: string): PhpSourceText => Object.freeze({
  kind: 'php_source_text',
  value: stringValue(value),
});


/** Filesystem-backed source acquisition preserves failures instead of throwing away inventory evidence. */
export type PhpSourceDocumentReadBlocker =
  | Readonly<{ readonly kind: 'php_source_document_file_missing'; readonly sourceFile: SourceFile }>
  | Readonly<{ readonly kind: 'php_source_document_path_not_file'; readonly sourceFile: SourceFile }>
  | Readonly<{ readonly kind: 'php_source_document_file_unreadable'; readonly sourceFile: SourceFile }>;

export type PhpSourceDocumentReadResult =
  | Readonly<{ readonly kind: 'php_source_document_read_complete'; readonly document: PhpSourceDocument }>
  | Readonly<{ readonly kind: 'php_source_document_read_blocked'; readonly sourceFile: SourceFile; readonly blocker: PhpSourceDocumentReadBlocker }>;

export interface PhpSourceDocumentReadInput {
  readonly kind: 'php_source_document_read_input';
  readonly sourceFile: SourceFile;
}

/** Runtime reader contract: acquire source text; do not infer or classify invocation semantics. */
export interface PhpSourceDocumentReaderInterface {
  readonly kind: 'php_source_document_reader';
  readonly closed: true;
  readonly contractVersion: 1;
  readonly read: (input: PhpSourceDocumentReadInput) => Promise<PhpSourceDocumentReadResult>;
}

/** Parser-owned call evidence before namespace environment projection and name resolution. */
export interface PhpFunctionInvocationSourceSyntaxEvidence {
  readonly kind: 'php_function_invocation_source_syntax_evidence';
  readonly sourceFile: SourceFile;
  readonly source: SourceSpan;
  readonly syntax: PhpFunctionNameSyntaxEvidence;
  readonly arguments: ExpressionArguments;
}

/** Parser failure diagnostics are source evidence, not a semantic judgment. */
export type PhpSourceFrontendParserFailureLocation =
  | Readonly<{ readonly kind: 'php_source_frontend_parser_location_available'; readonly line: NumberValue; readonly column: NumberValue }>
  | Readonly<{ readonly kind: 'php_source_frontend_parser_location_unavailable' }>;

export type PhpSourceFrontendParserFailureDiagnostic =
  | Readonly<{ readonly kind: 'php_source_frontend_parser_error_diagnostic'; readonly message: StringValue; readonly location: PhpSourceFrontendParserFailureLocation }>
  | Readonly<{ readonly kind: 'php_source_frontend_parser_failure_diagnostic_unavailable' }>;

export type PhpSourceFrontendCoverageObligation =
  | PhpFunctionResolutionSourceInventoryObligation
  | 'function-invocation-nodes'
  | 'invocation-argument-lists'
  | 'source-offsets-and-file-identity';

export type PhpSourceInvocationSyntaxInventoryObligation =
  | 'all-function-invocation-nodes-inventoried'
  | 'all-invocation-argument-lists-captured'
  | 'all-callee-syntax-preserved-before-name-resolution';

/** Parser traversal provenance distinguishes whole-file AST evidence from method-body-only token parsing. */
export type PhpSourceFrontendTraversalObligation =
  | 'namespace-region-declarations'
  | 'region-source-boundaries'
  | 'namespace-prefix-import-declarations'
  | 'function-import-declarations'
  | 'named-function-declarations'
  | 'function-invocation-nodes'
  | 'invocation-argument-lists'
  | 'source-offsets-and-file-identity';

export type PhpSourceFrontendTraversalEvidence =
  | Readonly<{
      readonly kind: 'php_source_whole_file_ast_traversal';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly completeness: 'complete';
      readonly obligations: readonly [
        'namespace-region-declarations',
        'region-source-boundaries',
        'namespace-prefix-import-declarations',
        'function-import-declarations',
        'named-function-declarations',
        'function-invocation-nodes',
        'invocation-argument-lists',
        'source-offsets-and-file-identity',
      ];
      readonly unvisitedSyntaxFamilies: readonly [];
    }>
  | Readonly<{
      readonly kind: 'php_source_partial_token_or_method_body_traversal';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly completeness: 'incomplete';
      readonly missingEvidence: readonly [PhpSourceFrontendTraversalObligation, ...PhpSourceFrontendTraversalObligation[]];
    }>;

/** Invocation syntax has its own closed inventory; a raw array cannot claim whole-file completeness. */
export type PhpSourceInvocationSyntaxInventory =
  | Readonly<{
      readonly kind: 'php_source_invocation_syntax_inventory_complete';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly entries: readonly PhpFunctionInvocationSourceSyntaxEvidence[];
      readonly obligations: readonly [
        'all-function-invocation-nodes-inventoried',
        'all-invocation-argument-lists-captured',
        'all-callee-syntax-preserved-before-name-resolution',
      ];
    }>
  | Readonly<{
      readonly kind: 'php_source_invocation_syntax_inventory_incomplete';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly entries: readonly PhpFunctionInvocationSourceSyntaxEvidence[];
      readonly missingEvidence: readonly PhpSourceInvocationSyntaxInventoryObligation[];
    }>;

/** Coverage is a parser-produced claim with an explicit closed outcome; empty lists alone prove nothing. */
export type PhpSourceFrontendCoverage =
  | Readonly<{
      readonly kind: 'php_source_frontend_coverage_complete';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly obligations: readonly [
        'namespace-region-declarations',
        'region-source-boundaries',
        'namespace-prefix-import-declarations',
        'function-import-declarations',
        'named-function-declarations',
        'function-invocation-nodes',
        'invocation-argument-lists',
        'source-offsets-and-file-identity',
      ];
    }>
  | Readonly<{
      readonly kind: 'php_source_frontend_coverage_incomplete';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly missingEvidence: readonly PhpSourceFrontendCoverageObligation[];
    }>
  | Readonly<{
      readonly kind: 'php_source_frontend_parse_blocked';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly failure: Readonly<{ readonly kind: 'php_source_frontend_parser_rejected_source'; readonly diagnostic: PhpSourceFrontendParserFailureDiagnostic }>;
    }>;

/** One frontend extraction keeps whole-file scope and call syntax in the same provenance domain. */
export interface PhpSourceFrontendExtraction {
  readonly kind: 'php_source_frontend_extraction';
  readonly sourceFile: SourceFile;
  readonly source: SourceSpan;
  readonly nameResolutionInventory: PhpFunctionResolutionSourceInventoryInput;
  readonly invocationInventory: PhpSourceInvocationSyntaxInventory;
  readonly traversal: PhpSourceFrontendTraversalEvidence;
  readonly coverage: PhpSourceFrontendCoverage;
}

export interface PhpSourceFrontendContract {
  readonly kind: 'php_source_frontend_contract';
  readonly version: 7;
  readonly unsupportedInvocationHandling: 'every-parser-call-node-must-be-inventoried-or-force-an-incomplete-invocation-inventory; unsupported-callee-shapes-must-never-be-silently-dropped';
  readonly extractionRuleOrder: readonly [
    'preserve-one-source-file-identity-through-whole-file-extraction',
    'bind-coverage-claims-to-an-explicit-parser-traversal-witness',
    'only-whole-file-ast-traversal-may-claim-complete-source-coverage',
    'inventory-every-namespace-region-import-and-named-function-declaration',
    'inventory-every-ordinary-function-call-and-its-arguments-through-a-closed-invocation-inventory',
    'preserve-callee-segment-syntax-before-name-resolution',
    'bind-every-source-span-to-the-same-whole-file-source',
    'derive-name-resolution-inventory-completeness-only-from-region-import-declaration-evidence',
    'derive-invocation-inventory-completeness-only-from-invocation-callee-argument-evidence',
    'require-both-closed-inventories-before-aggregate-complete-coverage',
    'preserve-parser-rejection-diagnostic-without-promoting-a-partial-or-missing-ast',
    'publish-incomplete-coverage-instead-of-inferring-completeness-from-empty-evidence',
    'never-resolve-names-or-create-invocation-judgments-in-the-frontend',
  ];
  readonly ownership: 'frontend-owns-parsing-and-source-evidence-only-semantic-meaning-belongs-to-upstream-authorities';
  readonly scope: 'whole-file-namespace-import-declaration-and-invocation-inventory-not-method-body-only';
  readonly failure: 'parser-rejection-is-a-typed-blocker-with-preserved-diagnostic-evidence-and-incomplete-or-unbound-source-evidence-cannot-be-promoted-to-complete-frontend-coverage';
}

export const PHP_SOURCE_FRONTEND_CONTRACT: PhpSourceFrontendContract = Object.freeze({
  kind: 'php_source_frontend_contract',
  version: 7,
  unsupportedInvocationHandling: 'every-parser-call-node-must-be-inventoried-or-force-an-incomplete-invocation-inventory; unsupported-callee-shapes-must-never-be-silently-dropped',
  extractionRuleOrder: Object.freeze([
    'preserve-one-source-file-identity-through-whole-file-extraction',
    'bind-coverage-claims-to-an-explicit-parser-traversal-witness',
    'only-whole-file-ast-traversal-may-claim-complete-source-coverage',
    'inventory-every-namespace-region-import-and-named-function-declaration',
    'inventory-every-ordinary-function-call-and-its-arguments-through-a-closed-invocation-inventory',
    'preserve-callee-segment-syntax-before-name-resolution',
    'bind-every-source-span-to-the-same-whole-file-source',
    'derive-name-resolution-inventory-completeness-only-from-region-import-declaration-evidence',
    'derive-invocation-inventory-completeness-only-from-invocation-callee-argument-evidence',
    'require-both-closed-inventories-before-aggregate-complete-coverage',
    'preserve-parser-rejection-diagnostic-without-promoting-a-partial-or-missing-ast',
    'publish-incomplete-coverage-instead-of-inferring-completeness-from-empty-evidence',
    'never-resolve-names-or-create-invocation-judgments-in-the-frontend',
  ]),
  ownership: 'frontend-owns-parsing-and-source-evidence-only-semantic-meaning-belongs-to-upstream-authorities',
  scope: 'whole-file-namespace-import-declaration-and-invocation-inventory-not-method-body-only',
  failure: 'parser-rejection-is-a-typed-blocker-with-preserved-diagnostic-evidence-and-incomplete-or-unbound-source-evidence-cannot-be-promoted-to-complete-frontend-coverage',
});

/** Interface-first seam for the existing parser or a future PHP parser adapter. */
export interface PhpSourceFrontendInterface {
  readonly kind: 'php_source_frontend';
  readonly contract: PhpSourceFrontendContract;
  readonly extract: (document: PhpSourceDocument) => PhpSourceFrontendExtraction;
}
