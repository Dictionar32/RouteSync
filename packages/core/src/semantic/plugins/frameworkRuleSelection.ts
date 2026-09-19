import type { ResolverMeta } from '../../types';
import { lookupGlobalFunction, lookupMethod, lookupVariableMethod, type FrameworkMethodRule } from '../FrameworkRegistry';

type MethodMeta = Extract<ResolverMeta, { kind: 'method_call' | 'static_method_call' }>;

export function selectFrameworkRule(meta: MethodMeta): FrameworkMethodRule | undefined {
  if (meta.kind === 'method_call' && meta.target !== null && meta.target.kind === 'variable') {
    const rule = lookupVariableMethod(meta.target.name.value, meta.name.value);
    if (rule !== undefined) return rule;
  }
  if (meta.kind === 'method_call' && meta.target === null) {
    const rule = lookupGlobalFunction(meta.name.value);
    if (rule !== undefined) return rule;
  }
  return lookupMethod(meta.name.value);
}

export function hasFrameworkRule(meta: ResolverMeta): boolean {
  if (meta.kind !== 'method_call' && meta.kind !== 'static_method_call') return false;
  return selectFrameworkRule(meta) !== undefined;
}
