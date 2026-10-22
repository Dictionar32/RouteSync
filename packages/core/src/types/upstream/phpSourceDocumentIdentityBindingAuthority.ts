import type { PhpSourceDocumentIdentityBindingContract, PhpSourceDocumentIdentityBindingInput, PhpSourceDocumentIdentityBindingInterface, PhpSourceDocumentIdentityBindingJudgment } from './phpSourceDocumentIdentityBindingInterface';
import type { PhpSourceDocumentReadResult } from './phpSourceFrontendInterface';
import type { SourceFile } from './names';

export const PHP_SOURCE_DOCUMENT_IDENTITY_BINDING_CONTRACT: PhpSourceDocumentIdentityBindingContract = Object.freeze({
  kind: 'php_source_document_identity_binding_contract',
  version: 1,
  rule: 'read-result-source-identity-and-any-blocker-source-identity-must-equal-the-exact-requested-source-file-identity',
  rejection: 'identity-mismatch-is-preserved-as-a-closed-judgment-and-cannot-enter-the-complete-source-inventory',
});

const sourceFileIdentityMatches = (left: SourceFile, right: SourceFile): boolean =>
  Object.is(left.value.value, right.value.value);

const bound = (
  requestedSourceFile: SourceFile,
  result: PhpSourceDocumentReadResult,
): PhpSourceDocumentIdentityBindingJudgment => Object.freeze({
  kind: 'php_source_document_identity_bound',
  requestedSourceFile,
  result,
});

const rejected = (
  requestedSourceFile: SourceFile,
  observedSourceFile: SourceFile,
  result: PhpSourceDocumentReadResult,
): PhpSourceDocumentIdentityBindingJudgment => Object.freeze({
  kind: 'php_source_document_identity_rejected',
  requestedSourceFile,
  observedSourceFile,
  result,
});

const bindComplete = (
  requestedSourceFile: SourceFile,
  result: Extract<PhpSourceDocumentReadResult, { readonly kind: 'php_source_document_read_complete' }>,
): PhpSourceDocumentIdentityBindingJudgment => {
  const matches = sourceFileIdentityMatches(requestedSourceFile, result.document.sourceFile);
  switch (matches) {
    case true:
      return bound(requestedSourceFile, result);
    case false:
      return rejected(requestedSourceFile, result.document.sourceFile, result);
    default: {
      const exhaustive: never = matches;
      return exhaustive;
    }
  }
};

const bindBlocked = (
  requestedSourceFile: SourceFile,
  result: Extract<PhpSourceDocumentReadResult, { readonly kind: 'php_source_document_read_blocked' }>,
): PhpSourceDocumentIdentityBindingJudgment => {
  const resultIdentityMatches = sourceFileIdentityMatches(requestedSourceFile, result.sourceFile);
  const blockerIdentityMatches = sourceFileIdentityMatches(requestedSourceFile, result.blocker.sourceFile);
  const bothIdentitiesMatch = resultIdentityMatches && blockerIdentityMatches;
  switch (bothIdentitiesMatch) {
    case true:
      return bound(requestedSourceFile, result);
    case false:
      switch (resultIdentityMatches) {
        case true:
          return rejected(requestedSourceFile, result.blocker.sourceFile, result);
        case false:
          return rejected(requestedSourceFile, result.sourceFile, result);
        default: {
          const exhaustive: never = resultIdentityMatches;
          return exhaustive;
        }
      }
    default: {
      const exhaustive: never = bothIdentitiesMatch;
      return exhaustive;
    }
  }
};

export const phpSourceDocumentIdentityBinding: PhpSourceDocumentIdentityBindingInterface = Object.freeze({
  kind: 'php_source_document_identity_binding',
  contract: PHP_SOURCE_DOCUMENT_IDENTITY_BINDING_CONTRACT,
  bind: (input: PhpSourceDocumentIdentityBindingInput): PhpSourceDocumentIdentityBindingJudgment => {
    switch (input.result.kind) {
      case 'php_source_document_read_complete':
        return bindComplete(input.requestedSourceFile, input.result);
      case 'php_source_document_read_blocked':
        return bindBlocked(input.requestedSourceFile, input.result);
      default: {
        const exhaustive: never = input.result;
        return exhaustive;
      }
    }
  },
});
