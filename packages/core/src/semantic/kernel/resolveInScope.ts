import type { SemanticResolution } from '../../types/domain/semanticResolution';
import type { ResolverMeta, SemanticResolutionKernelContract } from '../types';
import type { ResolutionScope } from '../resolutionScope';

export function resolveInScope(
  kernel: SemanticResolutionKernelContract,
  meta: ResolverMeta,
  scope: ResolutionScope,
): SemanticResolution {
  return kernel.resolve(meta, scope);
}
