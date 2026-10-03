import type { OriginModelSymbol, ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import { BoundSemanticFactory, type BoundStepEdge } from "../../../../types/domain/boundAst";
import { ResourceFieldSemanticBinding } from "../../../../types/domain/resourceFieldSemanticBinding";
import type { ResourcePropertyPathResult } from "../../../../types/domain/resourcePropertyPathModel";
import type { PhpAstValue } from "../../lexer/PhpAst";
import type { BoundResourceFieldResult } from "../SemanticResourceBinder";
import { resolvePropertyPath } from './propertyPathResolution';
import { expressionForPath, toBoundStep, unresolved } from './propertyPathBindingSupport';
import { relationGate, relationProject, relationResolve } from "../../../../semantic/kernel/relationalSequence";

type Member = Extract<PhpAstValue, { kind: 'property_access' | 'method_chain' }>;
export function bindPropertyPathField(key: string, value: Member, rootModel: OriginModelSymbol, table: ModelSymbolTable): BoundResourceFieldResult {
  const semanticPath: ResourcePropertyPathResult = resolvePropertyPath(value, rootModel, table);
  return relationGate(Object.is(semanticPath.kind, 'resolved'), () => {
    const resolved = semanticPath as Extract<ResourcePropertyPathResult, { kind: 'resolved' }>;
    const steps: BoundStepEdge[] = relationProject(resolved.steps, toBoundStep);
    const resultingType = resolved.type;
    const boundAst = BoundSemanticFactory.propertyChain({ rootModel: resolved.rootModel.identity.name, steps, resultingType, nullability: relationResolve(resultingType.isNullable(), () => ({ kind: 'nullable' }), () => ({ kind: 'non_nullable' })) });
    const expression = expressionForPath(resolved.rootModel.identity.name, resolved.steps);
    const descriptor = ResourceFieldSemanticBinding.fromExpression(key, expression, resultingType, toCamelCase(key), boundAst);
    return { descriptor, boundAst };
  }, () => unresolved(key, (semanticPath as Exclude<ResourcePropertyPathResult, { kind: 'resolved' }>).reason));
}
