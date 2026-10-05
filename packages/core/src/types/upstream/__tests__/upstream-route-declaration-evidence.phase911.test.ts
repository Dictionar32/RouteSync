import type { RouteDeclarationEvidence } from '../routeDeclarationEvidence';
import type { RouteProducerInput } from '../route';

export const phase911RouteDeclarationEvidenceContractTest = (): void => {
  type Declaration = RouteProducerInput['declaration'];
  const declarationIsNeutral: Declaration extends RouteDeclarationEvidence ? true : false = true;
  const evidenceIsExported: RouteDeclarationEvidence extends Declaration ? true : false = true;
  void declarationIsNeutral;
  void evidenceIsExported;
};
