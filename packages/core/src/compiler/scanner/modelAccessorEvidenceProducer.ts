import type { ModelDeclarationAst } from '../frontend/php';
import type { SourceSpan } from '../../types/upstream/provenance';
import type { ModelAccessorMethodEvidence, ModelAccessorReturnTypeEvidence } from '../../types/upstream/modelAccessorFactsAuthorityInterface';
import { createClassName, createMethodName } from '../../types/upstream/names';
import { sourceFileIdentityFactory, stringValue } from '../../types/upstream/names';
import { phpAstExpressionSemanticAuthority } from '../frontend/php/routeAst/phpAstExpressionSemanticAuthority';

export interface ModelAccessorEvidenceProductionInput {
  readonly declaration: ModelDeclarationAst;
  readonly source: SourceSpan;
}

export interface ModelAccessorEvidenceProducerInterface {
  readonly kind: 'model_accessor_evidence_producer';
  readonly contractVersion: 1;
  readonly produce: (input: ModelAccessorEvidenceProductionInput) => readonly ModelAccessorMethodEvidence[];
}

const returnTypeEvidence = (method: ModelDeclarationAst['methods'][number]): ModelAccessorReturnTypeEvidence => {
  const returnType = method.returnType;
  const classReference = returnType.kind === 'present' && returnType.value.kind === 'class_reference';
  return classReference
    ? { kind: 'class_reference', className: createClassName(returnType.value.className) }
    : returnType.kind === 'absent'
      ? { kind: 'absent' }
      : { kind: 'other_return_type' };
};

const evidenceFor = (method: ModelDeclarationAst['methods'][number], source: SourceSpan): ModelAccessorMethodEvidence => Object.freeze({
  kind: 'model_accessor_method_evidence',
  method: createMethodName(method.name),
  visibility: method.visibility,
  returnType: returnTypeEvidence(method),
  returnedExpressions: Object.freeze(method.returns.slice(0, 1).map(returned => phpAstExpressionSemanticAuthority.derive({
    kind: 'php_ast_expression_evidence',
    evidence: returned,
    sourceFile: sourceFileIdentityFactory.create(stringValue.create(source.file.value.value)),
    classContext: { kind: 'none' },
  }))),
  source,
});

export const modelAccessorEvidenceProducer: ModelAccessorEvidenceProducerInterface = Object.freeze({
  kind: 'model_accessor_evidence_producer',
  contractVersion: 1,
  produce: input => Object.freeze(input.declaration.methods.map(method => evidenceFor(method, input.source))),
});
