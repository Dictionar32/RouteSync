import { scannerSemanticType } from '../../../semanticTypeConstructionRelations';
import { ResourceFieldExpressionFactory, type ResourceFieldExpression } from "../../../../types/route";
import { BoundSemanticFactory, type BoundStepEdge } from "../../../../types/domain/boundAst";
import { ErrorType } from "../../../types/SemanticType";
import type { ResourcePropertyPathStep } from "../../../../types/domain/resourcePropertyPathModel";
import { toCamelCase } from "../../../../utils/resource-naming";
import type { ModelName } from "../../../../types/domain/semanticValues";
import { ScannedResourceFieldDescriptor } from "../../descriptors/resourceDescriptors";
import type { PhpAstValue } from "../../lexer/PhpAst";
import { matchPhpAccessMode } from "../../lexer/phpAstAlgebra";
import { relationFold, relationProject, relationResolve } from "../../../../semantic/kernel/relationalSequence";

type Member = Extract<PhpAstValue, { kind: 'property_access' | 'method_chain' }>;

const boundKind = (step: ResourcePropertyPathStep): BoundStepEdge => {
  const nullsafe = matchPhpAccessMode(step.access, { direct: () => false, nullsafe: () => true });
  const relation = () => ({ kind: 'property', sourceModel: step.sourceModel.identity.name, property: step.property, step: { kind: 'relation', cardinality: step.cardinality }, nullsafe, stepType: step.type, targetModel: { kind: 'model', name: step.targetModel.identity.name } } as BoundStepEdge);
  const property = () => ({ kind: 'property', sourceModel: step.sourceModel.identity.name, property: step.property, step: { kind: step.semantic.kind }, nullsafe, stepType: step.type, targetModel: { kind: 'model', name: step.sourceModel.identity.name } } as BoundStepEdge);
  const method = () => relationResolve(Object.is(step.result.kind, 'single_model'), () => step.result.model.identity.name, () => step.sourceModel.identity.name);
  return relationResolve(Object.is(step.kind, 'relation'), relation, () => relationResolve(Object.is(step.kind, 'property'), property, () => ({ kind: 'method', sourceModel: step.sourceModel.identity.name, method: step.method, cardinality: step.cardinality, nullsafe, stepType: step.type, targetModel: { kind: 'model', name: method() } } as BoundStepEdge)));
};
export function toBoundStep(step: ResourcePropertyPathStep): BoundStepEdge { return boundKind(step); }

const cardinalityCatalog = Object.freeze({ one: { kind: 'single' }, many: { kind: 'collection' } } as const);
export function relationCardinality(cardinality: import("../../../../types/domain/eloquentTypes").EloquentRelationCardinality): import("../../../../types/domain/boundAst").BoundCardinality { return cardinalityCatalog[cardinality]; }

const MEMBER_KINDS: Readonly<Record<PhpAstValue['kind'], boolean>> = Object.freeze({ property_access: true, method_chain: true } as Record<PhpAstValue['kind'], boolean>);
const isMember = (value: PhpAstValue): value is Member => Object.is(MEMBER_KINDS[value.kind], true);
export function collectMembers(value: Member): readonly Member[] {
  const receiver = relationResolve(isMember(value.receiver), () => collectMembers(value.receiver as Member), () => [] as readonly Member[]);
  return relationFold(receiver, [value] as readonly Member[], (acc, item) => [...acc, item]);
}

const stepExpression = (expression: ResourceFieldExpression, step: ResourcePropertyPathStep): ResourceFieldExpression => {
  const nullsafe = matchPhpAccessMode(step.access, { direct: () => false, nullsafe: () => true });
  const call = (name: string) => relationResolve(nullsafe, () => ResourceFieldExpressionFactory.nullsafeMethodCall(expression, name), () => ResourceFieldExpressionFactory.methodCall(expression, name));
  const access = (name: string) => relationResolve(nullsafe, () => ResourceFieldExpressionFactory.nullsafePropertyAccess(expression, name), () => ResourceFieldExpressionFactory.propertyAccess(expression, name));
  const property = () => relationResolve(Object.is(step.semantic.kind, 'accessor'), () => call(step.semantic.method), () => access(step.property));
  return relationResolve(Object.is(step.kind, 'method'), () => call(step.method), () => relationResolve(Object.is(step.kind, 'property'), property, () => access(step.property)));
};

export function expressionForPath(rootModel: ModelName, steps: readonly ResourcePropertyPathStep[]) {
  return relationFold(steps, ResourceFieldExpressionFactory.model(rootModel), stepExpression);
}

export function unresolved(key: string, reason: 'missing_property' | 'non_terminal_scalar' | 'missing_target_model'): BoundResourceFieldResult {
  const boundAst = BoundSemanticFactory.unsupported('unresolved_property');
  return { descriptor: ScannedResourceFieldDescriptor.fromExpression(key, ResourceFieldExpressionFactory.unsupported('unresolved_property'), scannerSemanticType.error('Property path could not be resolved'), toCamelCase(key), boundAst), boundAst };
}
