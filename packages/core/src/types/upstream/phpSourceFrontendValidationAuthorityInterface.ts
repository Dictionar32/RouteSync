import type { PhpSourceDocument, PhpSourceFrontendExtraction } from './phpSourceFrontendInterface';
import type { SourceFile } from './names';
import type { SourceSpan } from './provenance';
import type { NumberValue } from './valueObjects';

export type PhpSourceFrontendExtractionViolation =
  | Readonly<{ readonly kind: 'document-source-file-mismatch'; readonly expected: SourceFile; readonly actual: SourceFile }>
  | Readonly<{ readonly kind: 'whole-file-span-file-mismatch'; readonly sourceFile: SourceFile; readonly source: SourceSpan }>
  | Readonly<{ readonly kind: 'invalid-whole-file-span'; readonly source: SourceSpan }>
  | Readonly<{ readonly kind: 'whole-file-span-does-not-cover-document-content'; readonly source: SourceSpan; readonly documentLength: NumberValue }>
  | Readonly<{ readonly kind: 'inventory-source-mismatch'; readonly sourceFile: SourceFile; readonly source: SourceSpan }>
  | Readonly<{ readonly kind: 'invocation-inventory-source-mismatch'; readonly sourceFile: SourceFile; readonly source: SourceSpan }>
  | Readonly<{ readonly kind: 'traversal-source-file-mismatch'; readonly sourceFile: SourceFile }>
  | Readonly<{ readonly kind: 'traversal-source-mismatch'; readonly expected: SourceSpan; readonly actual: SourceSpan }>
  | Readonly<{ readonly kind: 'complete-coverage-with-partial-parser-traversal'; readonly sourceFile: SourceFile }>
  | Readonly<{ readonly kind: 'complete-traversal-with-unvisited-syntax-families'; readonly sourceFile: SourceFile }>
  | Readonly<{ readonly kind: 'complete-traversal-obligations-incomplete'; readonly sourceFile: SourceFile }>
  | Readonly<{ readonly kind: 'incomplete-traversal-without-missing-evidence'; readonly sourceFile: SourceFile }>
  | Readonly<{ readonly kind: 'complete-coverage-with-incomplete-invocation-inventory'; readonly sourceFile: SourceFile }>
  | Readonly<{ readonly kind: 'incomplete-invocation-inventory-without-missing-evidence'; readonly sourceFile: SourceFile }>
  | Readonly<{ readonly kind: 'invocation-inventory-obligations-incomplete'; readonly sourceFile: SourceFile }>
  | Readonly<{ readonly kind: 'invocation-source-file-mismatch'; readonly sourceFile: SourceFile; readonly invocation: PhpSourceFrontendExtraction['invocationInventory']['entries'][number] }>
  | Readonly<{ readonly kind: 'invocation-outside-whole-file-span'; readonly source: SourceSpan; readonly invocation: PhpSourceFrontendExtraction['invocationInventory']['entries'][number] }>
  | Readonly<{ readonly kind: 'callee-syntax-outside-whole-file-span'; readonly source: SourceSpan; readonly invocation: PhpSourceFrontendExtraction['invocationInventory']['entries'][number] }>
  | Readonly<{ readonly kind: 'coverage-source-file-mismatch'; readonly sourceFile: SourceFile; readonly coverageSourceFile: SourceFile }>
  | Readonly<{ readonly kind: 'coverage-source-mismatch'; readonly expected: SourceSpan; readonly actual: SourceSpan }>
  | Readonly<{ readonly kind: 'complete-coverage-obligations-incomplete'; readonly sourceFile: SourceFile }>
  | Readonly<{ readonly kind: 'incomplete-coverage-without-missing-evidence'; readonly sourceFile: SourceFile }>
  | Readonly<{ readonly kind: 'complete-coverage-with-incomplete-inventory'; readonly sourceFile: SourceFile }>;

export type PhpSourceFrontendExtractionValidation =
  | Readonly<{
      readonly kind: 'php_source_frontend_extraction_validated';
      readonly extraction: PhpSourceFrontendExtraction;
      readonly completeness: 'complete' | 'incomplete';
    }>
  | Readonly<{
      readonly kind: 'php_source_frontend_extraction_rejected';
      readonly extraction: PhpSourceFrontendExtraction;
      readonly violations: readonly [PhpSourceFrontendExtractionViolation, ...PhpSourceFrontendExtractionViolation[]];
    }>;

export interface PhpSourceFrontendExtractionValidationContract {
  readonly kind: 'php_source_frontend_extraction_validation_contract';
  readonly version: 6;
  readonly ruleOrder: readonly [
    'bind-extraction-to-one-document-source-file',
    'bind-parser-traversal-witness-to-identical-whole-file-source',
    'reject-complete-coverage-from-partial-token-or-method-body-traversal',
    'bind-whole-file-span-to-exact-document-content-extent',
    'bind-name-resolution-inventory-to-identical-whole-file-source',
    'bind-invocation-syntax-inventory-to-identical-whole-file-source',
    'validate-independent-inventory-closure-before-aggregate-completeness',
    'require-a-closed-invocation-inventory-before-complete-coverage',
    'bind-coverage-witness-to-identical-whole-file-source',
    'require-every-complete-coverage-obligation',
    'require-missing-evidence-for-incomplete-coverage',
    'bind-every-invocation-and-callee-syntax-to-the-whole-file-span',
    'never-promote-incomplete-coverage-to-complete-validation',
    'reject-all-provenance-violations-before-downstream-authorities-consume-extraction',
  ];
}

export const PHP_SOURCE_FRONTEND_EXTRACTION_VALIDATION_CONTRACT: PhpSourceFrontendExtractionValidationContract = Object.freeze({
  kind: 'php_source_frontend_extraction_validation_contract',
  version: 6,
  ruleOrder: Object.freeze([
    'bind-extraction-to-one-document-source-file',
    'bind-parser-traversal-witness-to-identical-whole-file-source',
    'reject-complete-coverage-from-partial-token-or-method-body-traversal',
    'bind-whole-file-span-to-exact-document-content-extent',
    'bind-name-resolution-inventory-to-identical-whole-file-source',
    'bind-invocation-syntax-inventory-to-identical-whole-file-source',
    'validate-independent-inventory-closure-before-aggregate-completeness',
    'require-a-closed-invocation-inventory-before-complete-coverage',
    'bind-coverage-witness-to-identical-whole-file-source',
    'require-every-complete-coverage-obligation',
    'require-missing-evidence-for-incomplete-coverage',
    'bind-every-invocation-and-callee-syntax-to-the-whole-file-span',
    'never-promote-incomplete-coverage-to-complete-validation',
    'reject-all-provenance-violations-before-downstream-authorities-consume-extraction',
  ]),
});

export interface PhpSourceFrontendExtractionValidationInput {
  readonly kind: 'php_source_frontend_extraction_validation_input';
  readonly document: PhpSourceDocument;
  readonly extraction: PhpSourceFrontendExtraction;
}

export interface PhpSourceFrontendExtractionValidationAuthorityInterface {
  readonly kind: 'php_source_frontend_extraction_validation_authority';
  readonly contract: PhpSourceFrontendExtractionValidationContract;
  readonly validate: (input: PhpSourceFrontendExtractionValidationInput) => PhpSourceFrontendExtractionValidation;
}
