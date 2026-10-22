import { relationUnique } from '../../../semantic/relations/relationMembership';
import { assertSemanticTypeDerivationJudgment } from '../../../types/upstream/semanticTypeDerivationInterface';
import { semanticTypeSourceEvidence, type SemanticTypeDerivationAuthorityInterface, type SemanticTypeDerivationJudgment, type SemanticTypeDerivationProof, type SemanticTypeDerivationRequest } from '../../../types/upstream/semanticTypeDerivationInterface';
import { SemanticDerivationContext } from './SemanticDerivationContext';
import { deriveResourceTypes } from './resourceTypeDeriver';
import { deriveRouteResponseTypes } from './routeResponseDeriver';
import { deriveModelTypes } from './modelTypeDeriver';

const deriveJudgment = (request: SemanticTypeDerivationRequest): SemanticTypeDerivationJudgment => {
  const context = SemanticDerivationContext.create(
    request.resources,
    request.models,
    request.interner,
    request.routes,
  );
  const seenNames = relationUnique([] as readonly string[]);
  const resourceResults = deriveResourceTypes(context, seenNames);
  const routeResponseResults = deriveRouteResponseTypes(context, seenNames);
  const modelResults = deriveModelTypes(context, seenNames);
  const result = Object.freeze([
    ...resourceResults,
    ...routeResponseResults,
    ...modelResults,
  ]);
  return Object.freeze({
    kind: 'semantic_type_derivation_judgment',
    status: 'closed',
    result,
    sourceCoverage: Object.freeze({
      resources: request.resources.length,
      models: request.models.length,
      routes: request.routes.length,
    }),
    proof: Object.freeze({
      kind: 'semantic_type_derivation_proof',
      stageReceipts: Object.freeze([
        Object.freeze({ stage: 'resource' as const, evidenceCount: request.resources.length, resultCount: resourceResults.length }),
        Object.freeze({ stage: 'route_response' as const, evidenceCount: request.routes.length, resultCount: routeResponseResults.length }),
        Object.freeze({ stage: 'model' as const, evidenceCount: request.models.length, resultCount: modelResults.length }),
      ]) as SemanticTypeDerivationProof['stageReceipts'],
      sourceEvidence: semanticTypeSourceEvidence(request),
      sourceCoverage: Object.freeze({
        resources: request.resources.length,
        models: request.models.length,
        routes: request.routes.length,
      }),
      resultCount: result.length,
      complete: true,
    }),
    derivation: 'resource+route_response+model',
    authority: 'semantic_type_derivation',
    closed: true,
  });
};

export const semanticTypeDerivationAuthority: SemanticTypeDerivationAuthorityInterface = Object.freeze({
  resolve: request => assertSemanticTypeDerivationJudgment(request, deriveJudgment(request)),
  authority: 'semantic_type_derivation',
  closed: true,
});
