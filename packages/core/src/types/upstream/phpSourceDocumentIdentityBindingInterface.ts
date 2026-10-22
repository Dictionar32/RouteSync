import type { PhpSourceDocumentReadResult } from './phpSourceFrontendInterface';
import type { SourceFile } from './names';

/** Source acquisition identity is checked before a read result can enter a complete inventory. */
export interface PhpSourceDocumentIdentityBindingInput {
  readonly kind: 'php_source_document_identity_binding_input';
  readonly requestedSourceFile: SourceFile;
  readonly result: PhpSourceDocumentReadResult;
}

export type PhpSourceDocumentIdentityBindingJudgment =
  | Readonly<{
      readonly kind: 'php_source_document_identity_bound';
      readonly requestedSourceFile: SourceFile;
      readonly result: PhpSourceDocumentReadResult;
    }>
  | Readonly<{
      readonly kind: 'php_source_document_identity_rejected';
      readonly requestedSourceFile: SourceFile;
      readonly observedSourceFile: SourceFile;
      readonly result: PhpSourceDocumentReadResult;
    }>;

export interface PhpSourceDocumentIdentityBindingContract {
  readonly kind: 'php_source_document_identity_binding_contract';
  readonly version: 1;
  readonly rule: 'read-result-source-identity-and-any-blocker-source-identity-must-equal-the-exact-requested-source-file-identity';
  readonly rejection: 'identity-mismatch-is-preserved-as-a-closed-judgment-and-cannot-enter-the-complete-source-inventory';
}

export interface PhpSourceDocumentIdentityBindingInterface {
  readonly kind: 'php_source_document_identity_binding';
  readonly contract: PhpSourceDocumentIdentityBindingContract;
  readonly bind: (input: PhpSourceDocumentIdentityBindingInput) => PhpSourceDocumentIdentityBindingJudgment;
}
