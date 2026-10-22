import type { RequestTypeDerivationProjectionInput, RequestTypeDerivationProjectionInterface } from './requestTypeDerivationProjectionInterface';
import { createDerivationContext, aggregateRequestTypeGroups } from './requestTypeDerivationSolver';

/**
 * The only compiler-facing entry point for RequestType semantic projection.
 * The scanner/wiring layer delegates here instead of orchestrating semantic
 * resolution and contribution merging itself.
 */
export const requestTypeDerivationProjectionPipeline: RequestTypeDerivationProjectionInterface = Object.freeze({
  derive: (input: RequestTypeDerivationProjectionInput) => {
    const { routes, resources, requests, interner } = input;
    const context = createDerivationContext(resources, requests, interner);
    return aggregateRequestTypeGroups(routes, resources, context);
  },
});
