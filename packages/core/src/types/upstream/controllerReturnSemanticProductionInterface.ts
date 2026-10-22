import type { ControllerReturnSemantic, ControllerResponseReferenceJudgment } from './controller';
import type { SourceFile } from './names';

/**
 * Typed boundary for producing the canonical return-semantic ADT from one exact
 * controller-method source subject. This is a production contract, not a second
 * response authority: integrated response continues to consume ControllerReturnSemantic.
 */
export interface ControllerReturnSemanticProductionInput<TMethodEvidence> {
  readonly method: TMethodEvidence;
  readonly sourceFile: SourceFile;
  readonly responseReferenceJudgment: ControllerResponseReferenceJudgment;
}

export interface ControllerReturnSemanticProductionInterface<TMethodEvidence> {
  readonly kind: 'controller_return_semantic_production';
  readonly ownership: 'produces-the-existing-ControllerReturnSemantic-ADT-for-the-exact-method-source-subject';
  readonly produce: (
    input: ControllerReturnSemanticProductionInput<TMethodEvidence>,
  ) => ControllerReturnSemantic;
}
