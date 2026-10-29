import type { PhpAstValue } from '../../frontend/php/PhpAst';
import type { ResourceAstExpressionMappingOperationInterface } from '../../../types/upstream/resourceAstExpressionMappingInterface';
import { resourceAstExpressionMappingAuthority } from '../../frontend/php/routeAst/resourceExpressionSemanticAuthority';

/** Semantic owner exposes one typed operation object; scanner consumers only wire it. */
export const resourceAstExpressionMapping: ResourceAstExpressionMappingOperationInterface<PhpAstValue> = Object.freeze({
  map: input => resourceAstExpressionMappingAuthority.map(input),
});
