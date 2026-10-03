import type { ResolverMeta } from '../../types';
import { lookupGlobalFunction, lookupMethod, lookupVariableMethod, type FrameworkMethodRule } from '../FrameworkRegistry';
import { solveCandidate, requirement } from '../kernel/semanticDecisionRewriteEngine';
import { relationResolve, relationIsSome, type RelationOption } from '../kernel/relationalSequence';
import { relationAll, relationEqual } from '../kernel/semanticRelations';

type MethodMeta = Extract<ResolverMeta, { kind: 'method_call' | 'static_method_call' }>;
type Candidate = { readonly id: string; readonly value: FrameworkMethodRule; readonly requirements: readonly ReturnType<typeof requirement>[] };

const targetVariableName = (meta: MethodMeta): string => relationResolve(
  relationAll([relationEqual(meta.kind, 'method_call'), relationEqual(meta.target?.kind, 'variable')]),
  () => meta.target.name.value,
  () => '',
);
const targetIsGlobal = (meta: MethodMeta): boolean => relationResolve(relationEqual(meta.kind, 'method_call'), () => !meta.target, () => false);

export function selectFrameworkRule(meta: MethodMeta): RelationOption<FrameworkMethodRule> {
  const variableRule = lookupVariableMethod(targetVariableName(meta), meta.name.value);
  const globalRule = lookupGlobalFunction(meta.name.value);
  const methodRule = lookupMethod(meta.name.value);
  const candidates: readonly Candidate[] = [
    ...relationResolve(relationIsSome(variableRule), () => [{ id: 'variable-method', value: variableRule.value, requirements: [requirement('method-target-variable', relationAll([relationEqual(meta.kind, 'method_call'), relationEqual(meta.target?.kind, 'variable')])), requirement('variable-rule-found', true)] }], () => []),
    ...relationResolve(relationIsSome(globalRule), () => [{ id: 'global-function', value: globalRule.value, requirements: [requirement('global-target', targetIsGlobal(meta)), requirement('global-rule-found', true)] }], () => []),
    ...relationResolve(relationIsSome(methodRule), () => [{ id: 'method', value: methodRule.value, requirements: [requirement('method-rule-found', true)] }], () => []),
  ];
  return solveCandidate(candidates);
}

export function hasFrameworkRule(meta: MethodMeta): boolean {
  return relationIsSome(selectFrameworkRule(meta));
}
