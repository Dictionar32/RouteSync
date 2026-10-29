import type { PhpSourceDocumentIdentityBindingContract, PhpSourceDocumentIdentityBindingInput, PhpSourceDocumentIdentityBindingInterface, PhpSourceDocumentIdentityBindingJudgment, PhpSourceDocumentIdentityBoundEvidence, PhpSourceDocumentIdentityRejectedEvidence, PhpSourceDocumentIdentityBindingBatchAccumulator } from './phpSourceDocumentIdentityBindingInterface';
import { phpSourceDocumentReadResultFactory, type PhpSourceDocumentReadResult, type PhpSourceDocumentReadCompleteEvidence, type PhpSourceDocumentReadBlockedEvidence } from './phpSourceFrontendInterface';
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
): PhpSourceDocumentIdentityBindingJudgment => {
  const evidence: PhpSourceDocumentIdentityBoundEvidence = Object.freeze({
    kind: 'php_source_document_identity_bound', requestedSourceFile, result,
  });
  return Object.freeze({ ...evidence, contributeToBatch: (accumulator: PhpSourceDocumentIdentityBindingBatchAccumulator): PhpSourceDocumentIdentityBindingBatchAccumulator => accumulator.includeBound(evidence) });
};

const rejected = (
  requestedSourceFile: SourceFile,
  observedSourceFile: SourceFile,
  result: PhpSourceDocumentReadResult,
): PhpSourceDocumentIdentityBindingJudgment => {
  const evidence: PhpSourceDocumentIdentityRejectedEvidence = Object.freeze({
    kind: 'php_source_document_identity_rejected', requestedSourceFile, observedSourceFile, result,
  });
  return Object.freeze({ ...evidence, contributeToBatch: (accumulator: PhpSourceDocumentIdentityBindingBatchAccumulator): PhpSourceDocumentIdentityBindingBatchAccumulator => accumulator.includeRejected(evidence) });
};

const bindComplete = (
  requestedSourceFile: SourceFile,
  evidence: PhpSourceDocumentReadCompleteEvidence,
): PhpSourceDocumentIdentityBindingJudgment => {
  const result = phpSourceDocumentReadResultFactory.complete(evidence.document);
  const matches = sourceFileIdentityMatches(requestedSourceFile, evidence.document.sourceFile);
  switch (matches) {
    case true:
      return bound(requestedSourceFile, result);
    case false:
      return rejected(requestedSourceFile, evidence.document.sourceFile, result);
    default: {
      const exhaustive: never = matches;
      return exhaustive;
    }
  }
};

const bindBlocked = (
  requestedSourceFile: SourceFile,
  evidence: PhpSourceDocumentReadBlockedEvidence,
): PhpSourceDocumentIdentityBindingJudgment => {
  const result = phpSourceDocumentReadResultFactory.blocked(evidence.sourceFile, evidence.blocker);
  const resultIdentityMatches = sourceFileIdentityMatches(requestedSourceFile, evidence.sourceFile);
  const blockerIdentityMatches = sourceFileIdentityMatches(requestedSourceFile, evidence.blocker.sourceFile);
  const bothIdentitiesMatch = resultIdentityMatches && blockerIdentityMatches;
  switch (bothIdentitiesMatch) {
    case true:
      return bound(requestedSourceFile, result);
    case false:
      switch (resultIdentityMatches) {
        case true:
          return rejected(requestedSourceFile, evidence.blocker.sourceFile, result);
        case false:
          return rejected(requestedSourceFile, evidence.sourceFile, result);
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
  bindCompleteResult: (requestedSourceFile, result): PhpSourceDocumentIdentityBindingJudgment => bindComplete(requestedSourceFile, result),
  bindBlockedResult: (requestedSourceFile, result): PhpSourceDocumentIdentityBindingJudgment => bindBlocked(requestedSourceFile, result),
  bind: (input: PhpSourceDocumentIdentityBindingInput): PhpSourceDocumentIdentityBindingJudgment =>
    input.result.bindIdentity(input.requestedSourceFile, phpSourceDocumentIdentityBinding),
});
