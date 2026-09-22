/** Resolves chained PHP member access against verified semantic model symbols. */
import type { OriginModelSymbol, ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import { BoundSemanticFactory, type BoundStepEdge } from "../../../../types/domain/boundAst";
import { ScannedResourceFieldDescriptor } from "../../descriptors/resourceDescriptors";
import { ErrorType } from "../../../types/SemanticType";
import type { ResourcePropertyPathResult } from "../../../../types/domain/resourcePropertyPathModel";
import type { PhpAstValue } from "../../lexer/PhpAst";
import type { BoundResourceFieldResult } from "../SemanticResourceBinder";
import { resolvePropertyPath } from './propertyPathResolution';
import { expressionForPath, toBoundStep, unresolved } from './propertyPathBindingSupport';

type Member = Extract<PhpAstValue, { kind: 'property_access' | 'method_chain' }>;

export function bindPropertyPathField(key: string, value: Member, rootModel: OriginModelSymbol, table: ModelSymbolTable): BoundResourceFieldResult {
  const semanticPath: ResourcePropertyPathResult = resolvePropertyPath(value, rootModel, table);
  if (semanticPath.kind !== 'resolved') return unresolved(key, semanticPath.reason);
  const steps: BoundStepEdge[] = semanticPath.steps.map(toBoundStep);
  const resultingType = semanticPath.type;
  const boundAst = BoundSemanticFactory.propertyChain({ rootModel: semanticPath.rootModel.identity.name, steps, resultingType, nullability: resultingType.isNullable() ? { kind: 'nullable' } : { kind: 'non_nullable' } });
  const expression = expressionForPath(semanticPath.rootModel.identity.name, semanticPath.steps);
  const descriptor = ScannedResourceFieldDescriptor.fromExpression(key, expression, resultingType, undefined, boundAst);
  return { descriptor, boundAst };
}
