/** Resolves chained PHP member access against verified semantic model symbols. */
import type { OriginModelSymbol, ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import { ResourceFieldExpressionFactory } from "../../../../types/route";
import { BoundSemanticFactory, type BoundStepEdge } from "../../../../types/domain/boundAst";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import { ScannedResourceFieldDescriptor } from "../../descriptors/resourceDescriptors";
import { ErrorType } from "../../../types/SemanticType";
import type { ResourcePropertyPathResult } from "../../../types/domain/resourcePropertyPathModel";
import type { PhpAstValue } from "../../lexer/PhpAst";
import type { BoundResourceFieldResult } from "../SemanticResourceBinder";
import { expressionForType, resolvePropertyPath, toBoundStep, unresolved } from './propertyPathResolution';

type Member = Extract<PhpAstValue, { kind: 'property_access' | 'method_chain' }>;

export function bindPropertyPathField(key: string, value: Member, rootModel: OriginModelSymbol, table: ModelSymbolTable): BoundResourceFieldResult {
  const semanticPath: ResourcePropertyPathResult = resolvePropertyPath(value, rootModel, table);
  if (semanticPath.kind !== 'resolved') return unresolved(key, semanticPath.reason);
  const steps: BoundStepEdge[] = semanticPath.steps.map(toBoundStep);
  const resultingType = semanticPath.type;
  const boundAst = BoundSemanticFactory.propertyChain({ rootModel: semanticPath.rootModel, steps, resultingType, nullability: resultingType.isNullable() ? { kind: 'nullable' } : { kind: 'non_nullable' } });
  const finalStep = semanticPath.steps[semanticPath.steps.length - 1];
  const expression = finalStep.kind === 'relation' ? ResourceFieldExpressionFactory.resource(SemanticValueFactory.resourceName(finalStep.targetModel.value)) : expressionForType(resultingType);
  const descriptor = ScannedResourceFieldDescriptor.fromExpression(key, expression, resultingType, undefined, boundAst);
  return { descriptor, boundAst };
}
