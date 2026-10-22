import type { PhpFunctionNameSyntaxEvidence } from './phpFunctionNameResolutionInterface';
import type { PhpSourceFrontendExtraction } from './phpSourceFrontendInterface';
import type {
  PhpSourceFrontendExtractionValidation,
  PhpSourceFrontendExtractionValidationAuthorityInterface,
  PhpSourceFrontendExtractionValidationInput,
  PhpSourceFrontendExtractionViolation,
} from './phpSourceFrontendValidationAuthorityInterface';
import { PHP_SOURCE_FRONTEND_EXTRACTION_VALIDATION_CONTRACT } from './phpSourceFrontendValidationAuthorityInterface';
import type { SourceFile } from './names';
import type { SourceSpan } from './provenance';
import { numberValue } from './valueObjects';

const sameFile = (left: SourceFile, right: SourceFile): boolean => left.value.value === right.value.value;
const sameSpan = (left: SourceSpan, right: SourceSpan): boolean =>
  sameFile(left.file, right.file)
  && left.start.value === right.start.value
  && left.end.value === right.end.value;
const validSpan = (span: SourceSpan): boolean => span.start.value >= 0 && span.end.value >= span.start.value;
const within = (span: SourceSpan, outer: SourceSpan): boolean =>
  sameFile(span.file, outer.file)
  && validSpan(span)
  && span.start.value >= outer.start.value
  && span.end.value <= outer.end.value;

const syntaxSpans = (syntax: PhpFunctionNameSyntaxEvidence): readonly SourceSpan[] => {
  switch (syntax.kind) {
    case 'unqualified_function_name_evidence':
      return [syntax.segment.source];
    case 'qualified_function_name_evidence':
    case 'fully_qualified_function_name_evidence':
      return syntax.segments.map(segment => segment.source);
    case 'malformed_function_name_evidence':
      return [syntax.source];
  }
};

const nonEmptyViolations = (first: PhpSourceFrontendExtractionViolation, rest: readonly PhpSourceFrontendExtractionViolation[]): readonly [PhpSourceFrontendExtractionViolation, ...PhpSourceFrontendExtractionViolation[]] => [first, ...rest];

const completeTraversalObligations = Object.freeze([
  'namespace-region-declarations',
  'region-source-boundaries',
  'namespace-prefix-import-declarations',
  'function-import-declarations',
  'named-function-declarations',
  'function-invocation-nodes',
  'invocation-argument-lists',
  'source-offsets-and-file-identity',
] as const);

const completeCoverageObligations = Object.freeze([
  'namespace-region-declarations',
  'region-source-boundaries',
  'namespace-prefix-import-declarations',
  'function-import-declarations',
  'named-function-declarations',
  'function-invocation-nodes',
  'invocation-argument-lists',
  'source-offsets-and-file-identity',
] as const);

const validate = (input: PhpSourceFrontendExtractionValidationInput): PhpSourceFrontendExtractionValidation => {
  const extraction = input.extraction;
  const violations: PhpSourceFrontendExtractionViolation[] = [];
  const source = extraction.source;
  const sourceFile = extraction.sourceFile;

  if (!sameFile(input.document.sourceFile, sourceFile)) {
    violations.push({ kind: 'document-source-file-mismatch', expected: input.document.sourceFile, actual: sourceFile });
  }
  if (!sameFile(source.file, sourceFile)) {
    violations.push({ kind: 'whole-file-span-file-mismatch', sourceFile, source });
  }
  if (!validSpan(source)) {
    violations.push({ kind: 'invalid-whole-file-span', source });
  }
  const documentLength = input.document.content.value.value.length;
  if (source.start.value !== 0 || source.end.value !== documentLength) {
    violations.push({
      kind: 'whole-file-span-does-not-cover-document-content',
      source,
      documentLength: numberValue(documentLength),
    });
  }
  if (!sameFile(extraction.nameResolutionInventory.sourceFile, sourceFile)
    || !sameSpan(extraction.nameResolutionInventory.source, source)) {
    violations.push({ kind: 'inventory-source-mismatch', sourceFile, source });
  }
  if (!sameFile(extraction.invocationInventory.sourceFile, sourceFile)
    || !sameSpan(extraction.invocationInventory.source, source)) {
    violations.push({ kind: 'invocation-inventory-source-mismatch', sourceFile, source });
  }
  if (!sameFile(extraction.traversal.sourceFile, sourceFile)) {
    violations.push({ kind: 'traversal-source-file-mismatch', sourceFile });
  }
  if (!sameSpan(extraction.traversal.source, source)) {
    violations.push({ kind: 'traversal-source-mismatch', expected: source, actual: extraction.traversal.source });
  }
  if (extraction.traversal.kind === 'php_source_whole_file_ast_traversal'
    && extraction.traversal.unvisitedSyntaxFamilies.length !== 0) {
    violations.push({ kind: 'complete-traversal-with-unvisited-syntax-families', sourceFile });
  }
  if (extraction.traversal.kind === 'php_source_whole_file_ast_traversal'
    && (extraction.traversal.obligations.length !== completeTraversalObligations.length
      || completeTraversalObligations.some((obligation, index) => extraction.traversal.kind === 'php_source_whole_file_ast_traversal'
        && extraction.traversal.obligations[index] !== obligation))) {
    violations.push({ kind: 'complete-traversal-obligations-incomplete', sourceFile });
  }
  if (extraction.traversal.kind === 'php_source_partial_token_or_method_body_traversal'
    && extraction.traversal.missingEvidence.length === 0) {
    violations.push({ kind: 'incomplete-traversal-without-missing-evidence', sourceFile });
  }
  if (extraction.invocationInventory.kind === 'php_source_invocation_syntax_inventory_complete'
    && (extraction.invocationInventory.obligations.length !== 3
      || extraction.invocationInventory.obligations[0] !== 'all-function-invocation-nodes-inventoried'
      || extraction.invocationInventory.obligations[1] !== 'all-invocation-argument-lists-captured'
      || extraction.invocationInventory.obligations[2] !== 'all-callee-syntax-preserved-before-name-resolution')) {
    violations.push({ kind: 'invocation-inventory-obligations-incomplete', sourceFile });
  }
  if (extraction.invocationInventory.kind === 'php_source_invocation_syntax_inventory_incomplete'
    && extraction.invocationInventory.missingEvidence.length === 0) {
    violations.push({ kind: 'incomplete-invocation-inventory-without-missing-evidence', sourceFile });
  }
  if (!sameFile(extraction.coverage.sourceFile, sourceFile)) {
    violations.push({
      kind: 'coverage-source-file-mismatch',
      sourceFile,
      coverageSourceFile: extraction.coverage.sourceFile,
    });
  }
  if (!sameSpan(extraction.coverage.source, source)) {
    violations.push({ kind: 'coverage-source-mismatch', expected: source, actual: extraction.coverage.source });
  }
  if (extraction.coverage.kind === 'php_source_frontend_coverage_complete'
    && (extraction.coverage.obligations.length !== completeCoverageObligations.length
      || completeCoverageObligations.some((obligation, index) => extraction.coverage.kind === 'php_source_frontend_coverage_complete'
        && extraction.coverage.obligations[index] !== obligation))) {
    violations.push({ kind: 'complete-coverage-obligations-incomplete', sourceFile });
  }
  if (extraction.coverage.kind === 'php_source_frontend_coverage_incomplete'
    && extraction.coverage.missingEvidence.length === 0) {
    violations.push({ kind: 'incomplete-coverage-without-missing-evidence', sourceFile });
  }
  if (extraction.coverage.kind === 'php_source_frontend_parse_blocked'
    && (extraction.nameResolutionInventory.kind === 'php_function_resolution_source_inventory_complete'
      || extraction.invocationInventory.kind === 'php_source_invocation_syntax_inventory_complete'
      || extraction.traversal.kind === 'php_source_whole_file_ast_traversal')) {
    violations.push({ kind: 'parser-blocked-coverage-with-complete-evidence-claims', sourceFile });
  }
  if (extraction.coverage.kind === 'php_source_frontend_coverage_complete'
    && extraction.nameResolutionInventory.kind !== 'php_function_resolution_source_inventory_complete') {
    violations.push({ kind: 'complete-coverage-with-incomplete-inventory', sourceFile });
  }
  if (extraction.coverage.kind === 'php_source_frontend_coverage_complete'
    && extraction.invocationInventory.kind !== 'php_source_invocation_syntax_inventory_complete') {
    violations.push({ kind: 'complete-coverage-with-incomplete-invocation-inventory', sourceFile });
  }
  if (extraction.coverage.kind === 'php_source_frontend_coverage_complete'
    && extraction.traversal.kind !== 'php_source_whole_file_ast_traversal') {
    violations.push({ kind: 'complete-coverage-with-partial-parser-traversal', sourceFile });
  }

  extraction.invocationInventory.entries.forEach(invocation => {
    if (!sameFile(invocation.sourceFile, sourceFile) || !sameFile(invocation.source.file, sourceFile)) {
      violations.push({ kind: 'invocation-source-file-mismatch', sourceFile, invocation });
    }
    if (!within(invocation.source, source)) {
      violations.push({ kind: 'invocation-outside-whole-file-span', source, invocation });
    }
    if (syntaxSpans(invocation.syntax).some(span => !within(span, source))) {
      violations.push({ kind: 'callee-syntax-outside-whole-file-span', source, invocation });
    }
  });

  const [firstViolation, ...remainingViolations] = violations;
  if (firstViolation !== undefined) {
    return Object.freeze({
      kind: 'php_source_frontend_extraction_rejected',
      extraction,
      violations: Object.freeze(nonEmptyViolations(firstViolation, remainingViolations)),
    });
  }

  return Object.freeze({
    kind: 'php_source_frontend_extraction_validated',
    extraction,
    completeness: extraction.coverage.kind === 'php_source_frontend_coverage_complete'
      && extraction.nameResolutionInventory.kind === 'php_function_resolution_source_inventory_complete'
      && extraction.invocationInventory.kind === 'php_source_invocation_syntax_inventory_complete'
      && extraction.traversal.kind === 'php_source_whole_file_ast_traversal'
      ? 'complete'
      : 'incomplete',
  });
};

export const phpSourceFrontendExtractionValidationAuthority: PhpSourceFrontendExtractionValidationAuthorityInterface = Object.freeze({
  kind: 'php_source_frontend_extraction_validation_authority',
  contract: PHP_SOURCE_FRONTEND_EXTRACTION_VALIDATION_CONTRACT,
  validate,
});
