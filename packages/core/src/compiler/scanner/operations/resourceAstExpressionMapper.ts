import type { PhpAstValue } from '../lexer/PhpAst';
import type { ResourceAstExpressionMappingOperationInterface } from '../../../types/upstream/resourceAstExpressionMappingInterface';
import { resourceAstExpressionMappingAuthority } from '../lexer/routeAst/resourceExpressionSemanticAuthority';

/** Runtime-facing operation delegates mapping judgment to the upstream semantic authority. */
export const mapResourceAstExpression: ResourceAstExpressionMappingOperationInterface<PhpAstValue> = input =>
  resourceAstExpressionMappingAuthority.map(input);
