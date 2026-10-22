/**
 * Compatibility facade for RequestType projection.
 * Semantic resolution and contribution reconciliation are owned by the
 * compiler semantic pipeline, not by this scanner module.
 */
import type { RouteSemanticFlow } from '../../../types/route';
import type { ResourceAst, RequestAst } from '../../../types/upstream/ast';
import type { RequestType } from '../../artifacts/RequestTypesArtifact';
import { TypeInterner } from '../../types/TypeInterner';
import { requestTypeDerivationProjectionPipeline } from '../../semantic/request-type-derivation/requestTypeDerivationProjectionPipeline';

export class RequestTypeDeriver {
  public static derive(
    routes: readonly RouteSemanticFlow[] = [],
    resources: readonly ResourceAst[] = [],
    requests: readonly RequestAst[] = [],
    interner: TypeInterner = TypeInterner.create(),
  ): readonly RequestType[] {
    return requestTypeDerivationProjectionPipeline.derive({ routes, resources, requests, interner });
  }
}

export function deriveRequestTypes(
  routes: readonly RouteSemanticFlow[] = [],
  resources: readonly ResourceAst[] = [],
  requests: readonly RequestAst[] = [],
  interner: TypeInterner = TypeInterner.create(),
): readonly RequestType[] {
  return requestTypeDerivationProjectionPipeline.derive({ routes, resources, requests, interner });
}
