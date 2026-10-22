/**
 * Interface-first RequestType judgment producer.
 *
 * Supported source-grounded slices:
 * - duplicate canonical identity -> conflict with source-occurrence witnesses;
 * - unresolved route/request/resource evidence -> incomplete with source and
 *   closure ledgers;
 * - ambiguous request identity -> conflict with candidate witnesses.
 *
 * Resource/request identity conflicts are emitted from their own resolution
 * ledgers so one conflict cannot mask another. Contribution-eligible routes
 * produce replayable group-fold receipts for canonical actions, resource-backed
 * response contracts, and explicitly empty responses; unsupported response ASTs
 * remain typed producer gaps. This never wraps legacy RequestType[] output as proof.
 */
import {
  requestTypeDerivationContract,
  type RequestTypeDerivationSemanticReasoningInterface,
  type RequestTypeDerivationSemanticInferenceFor,
  type RequestTypeDerivationSemanticInputPreparation,
  type RequestTypeDuplicateIdentityWitness,
  type RequestTypeDerivationConflict,
  type RequestTypeDerivationLawId,
  type RequestTypeDerivationProofFor,
  type RequestTypeDerivationRelation,
  type RequestTypeDerivationClosure,
  type RequestTypeRouteReceipt,
  type RequestTypeUnresolvedRouteReceipt,
  type RequestTypeRequestReceipt,
  type RequestTypeResourceReceipt,
  type RequestTypeGroupKey,
  type RequestTypeGroupReceipt,
  type RequestTypeGroupContributionReceipt,
  type RequestTypeRouteEvidenceReference,
} from '../../../types/upstream/requestTypeDerivationInterface';
import { RequestTypeDerivationSemanticProducerGapError } from './requestTypeDerivationSemanticProducerGap';
import { requestTypeDerivationSourceEvidenceInventory } from './requestTypeDerivationSourceEvidenceInventory';
import { requestTypeDerivationGroupContributionAlgebra } from './requestTypeDerivationGroupContributionAlgebra';
import { requestTypeRouteActionDerivation } from './actionContribution';
import { requestTypeResponseContributionDerivation } from './responseContribution';
import type { ResourceAst } from '../../../types/upstream/ast';
import type { RequestType } from '../../../types/domain/request';

const equivalentEvidenceValues = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((item, index) => equivalentEvidenceValues(item, right[index]));
  }
  if (typeof left !== 'object' || left === null || typeof right !== 'object' || right === null) return false;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return leftKeys.length === rightKeys.length
    && leftKeys.every(key => Object.hasOwn(right, key)
      && equivalentEvidenceValues(Reflect.get(left, key), Reflect.get(right, key)));
};

const duplicateWitnessCandidates = <T extends RequestTypeDuplicateIdentityWitness>(
  witness: T,
): readonly (T['occurrences']['first'])[] => Object.freeze([
  witness.occurrences.first,
  witness.occurrences.second,
  ...witness.occurrences.additional,
]);

const collisionOccurrenceKeys = (
  preparedInput: RequestTypeDerivationSemanticInputPreparation,
  domain: RequestTypeDuplicateIdentityWitness['domain'],
): ReadonlySet<string> => new Set(
  preparedInput.identityCollisionInventory.kind === 'identity_inventory_collisions'
    ? preparedInput.identityCollisionInventory.witnesses
      .filter(witness => witness.domain === domain)
      .flatMap(witness => duplicateWitnessCandidates(witness as RequestTypeDuplicateIdentityWitness))
      .map(source => source.occurrenceKey)
    : [],
);

const conflictsFromIdentityCollisions = (
  preparedInput: RequestTypeDerivationSemanticInputPreparation,
): readonly RequestTypeDerivationConflict[] => {
  if (preparedInput.identityCollisionInventory.kind !== 'identity_inventory_collisions') return Object.freeze([]);
  return Object.freeze(preparedInput.identityCollisionInventory.witnesses.map(witness => {
    switch (witness.domain) {
      case 'routes':
        return Object.freeze({ kind: 'duplicate_route_identity' as const, candidates: Object.freeze([witness.occurrences.first, witness.occurrences.second, ...witness.occurrences.additional]) });
      case 'requests':
        return Object.freeze({ kind: 'duplicate_request_identity' as const, candidates: Object.freeze([witness.occurrences.first, witness.occurrences.second, ...witness.occurrences.additional]) });
      case 'resources':
        return Object.freeze({ kind: 'duplicate_resource_identity' as const, candidates: Object.freeze([witness.occurrences.first, witness.occurrences.second, ...witness.occurrences.additional]) });
      default: {
        const exhaustive: never = witness;
        return exhaustive;
      }
    }
  }));
};

const requiredLaws = requestTypeDerivationContract.laws;

const routeResolutionFor = (
  preparedInput: RequestTypeDerivationSemanticInputPreparation,
  route: RequestTypeRouteEvidenceReference,
) => {
  const requestReceipts = preparedInput.requestResolutionLedger.filter(receipt => receipt.route.occurrenceKey === route.occurrenceKey);
  const resourceReceipts = preparedInput.resourceResolutionLedger.filter(receipt => receipt.route.occurrenceKey === route.occurrenceKey);
  if (requestReceipts.length !== 1 || resourceReceipts.length !== 1) {
    throw new RequestTypeDerivationSemanticProducerGapError(
      'reasoning',
      `source occurrence ${route.occurrenceKey} must have exactly one request and resource resolution receipt; found ${requestReceipts.length}/${resourceReceipts.length}`,
    );
  }
  return Object.freeze({ request: requestReceipts[0]!, resource: resourceReceipts[0]! });
};

const routeDisposition = (
  preparedInput: RequestTypeDerivationSemanticInputPreparation,
  route: RequestTypeRouteEvidenceReference,
): RequestTypeRouteReceipt['disposition'] => {
  const { request, resource } = routeResolutionFor(preparedInput, route);
  if (request.bindingKind === 'no_request') return Object.freeze({ kind: 'accounted_exclusion', reason: 'no_request_binding' });
  if (request.bindingKind === 'framework_request') return Object.freeze({ kind: 'accounted_exclusion', reason: 'framework_request_binding' });
  if (request.bindingKind === 'unresolved_request' || request.bindingKind === 'unresolved_action_request' || request.bindingKind === 'typed_request') {
    return Object.freeze({ kind: 'unresolved', reason: 'request_missing' });
  }

  // Prefer a source-grounded resource conflict as the route's primary disposition.
  // Request conflicts are still emitted independently from the request ledger below.
  switch (resource.resolution.kind) {
    case 'ambiguous':
      return Object.freeze({ kind: 'conflicted', reason: 'ambiguous_resource' });
    case 'identity_mismatch':
      return Object.freeze({ kind: 'conflicted', reason: 'resource_identity_mismatch' });
    case 'missing':
    case 'resolved':
    case 'not_required':
      break;
    default: {
      const exhaustive: never = resource.resolution;
      return exhaustive;
    }
  }

  switch (request.resolution.kind) {
    case 'missing':
    case 'unresolved_binding':
      return Object.freeze({ kind: 'unresolved', reason: 'request_missing' });
    case 'ambiguous_exact':
    case 'ambiguous_normalized':
      return Object.freeze({ kind: 'conflicted', reason: 'ambiguous_request' });
    case 'resolved_exact':
    case 'resolved_normalized':
      break;
    case 'not_required':
      throw new RequestTypeDerivationSemanticProducerGapError('reasoning', `FormRequest route ${route.occurrenceKey} has a not_required request resolution`);
    default: {
      const exhaustive: never = request.resolution;
      return exhaustive;
    }
  }

  switch (resource.resolution.kind) {
    case 'missing':
      return Object.freeze({ kind: 'unresolved', reason: 'resource_missing' });
    case 'resolved': {
      const requestResolution = request.resolution;
      if (requestResolution.kind !== 'resolved_exact' && requestResolution.kind !== 'resolved_normalized') {
        throw new RequestTypeDerivationSemanticProducerGapError('reasoning', `resolved resource for ${route.occurrenceKey} has no resolved request witness`);
      }
      return Object.freeze({
        kind: 'contributed',
        groupKey: resource.resolution.resource.canonicalIdentity.semanticKey as RequestTypeGroupKey,
        request: requestResolution.request,
        resource: resource.resolution.resource,
      });
    }
    case 'not_required':
      throw new RequestTypeDerivationSemanticProducerGapError('reasoning', `FormRequest route ${route.occurrenceKey} has a not_required resource resolution`);
    default: {
      const exhaustive: never = resource.resolution;
      return exhaustive;
    }
  }
};

const lawsForDisposition = (
  disposition: RequestTypeRouteReceipt['disposition'],
): readonly RequestTypeDerivationLawId[] => Object.freeze([
  'every_source_has_a_disposition',
  'evidence_key_matches_source_domain',
  'source_evidence_inventory_matches_input',
  'request_binding_kind_matches_route_disposition',
  ...(disposition.kind === 'accounted_exclusion' && disposition.reason === 'framework_request_binding'
    ? ['framework_request_binding_is_accounted_exclusion' as const]
    : []),
  ...(disposition.kind === 'conflicted' && (disposition.reason === 'ambiguous_request' || disposition.reason === 'ambiguous_resource' || disposition.reason === 'resource_identity_mismatch')
    ? ['ambiguous_identity_is_conflict' as const]
    : []),
  ...(disposition.kind === 'unresolved' && disposition.reason === 'request_missing'
    ? ['route_has_explicit_request_binding' as const]
    : []),
]);

const makeRouteReceipts = (
  preparedInput: RequestTypeDerivationSemanticInputPreparation,
): readonly RequestTypeRouteReceipt[] => {
  const duplicateRouteOccurrences = collisionOccurrenceKeys(preparedInput, 'routes');
  return Object.freeze(preparedInput.inventory.routes.map(route => {
  const resolutions = routeResolutionFor(preparedInput, route);
  const disposition: RequestTypeRouteReceipt['disposition'] = duplicateRouteOccurrences.has(route.occurrenceKey)
    ? Object.freeze({ kind: 'conflicted', reason: 'duplicate_route_identity' })
    : routeDisposition(preparedInput, route);
  return Object.freeze({
    route,
    requestBindingKind: resolutions.request.bindingKind,
    requestResolution: resolutions.request.resolution,
    resourceResolution: resolutions.resource.resolution,
    disposition,
    appliedLaws: lawsForDisposition(disposition),
  });
}));
};

const makeRequestReceipts = (
  preparedInput: RequestTypeDerivationSemanticInputPreparation,
): readonly RequestTypeRequestReceipt[] => {
  const duplicateRequestOccurrences = collisionOccurrenceKeys(preparedInput, 'requests');
  return Object.freeze(preparedInput.inventory.requests.map(request => {
  const matchedRoutes = preparedInput.requestResolutionLedger.filter(receipt =>
    (receipt.resolution.kind === 'resolved_exact' || receipt.resolution.kind === 'resolved_normalized')
      && receipt.resolution.request.occurrenceKey === request.occurrenceKey,
  ).map(receipt => receipt.route);
  return Object.freeze({
    request,
    disposition: duplicateRequestOccurrences.has(request.occurrenceKey)
      ? Object.freeze({ kind: 'conflicted' as const, reason: 'duplicate_exact_identity' as const })
      : matchedRoutes.length > 0
        ? Object.freeze({ kind: 'matched' as const, routeReferences: Object.freeze(matchedRoutes) })
        : Object.freeze({ kind: 'unused' as const }),
  });
}));
};

const makeResourceReceipts = (
  preparedInput: RequestTypeDerivationSemanticInputPreparation,
): readonly RequestTypeResourceReceipt[] => {
  const duplicateResourceOccurrences = collisionOccurrenceKeys(preparedInput, 'resources');
  return Object.freeze(preparedInput.inventory.resources.map(resource => {
  const resolved = preparedInput.resourceResolutionLedger.some(receipt =>
    receipt.resolution.kind === 'resolved' && receipt.resolution.resource.occurrenceKey === resource.occurrenceKey,
  );
  const canonicalKey = resource.canonicalIdentity.semanticKey as RequestTypeGroupKey;
  return Object.freeze({
    resource,
    disposition: duplicateResourceOccurrences.has(resource.occurrenceKey)
      ? Object.freeze({ kind: 'conflicted' as const, reason: 'duplicate_canonical_identity' as const })
      : resolved
        ? Object.freeze({ kind: 'available' as const, canonicalKey })
        : Object.freeze({ kind: 'unused' as const, canonicalKey }),
  });
}));
};

const makeRelations = (
  receipts: readonly RequestTypeRouteReceipt[],
  resources: readonly RequestTypeResourceReceipt[],
  requests: readonly RequestTypeRequestReceipt[],
  conflicts: readonly RequestTypeDerivationConflict[],
  groupReceipts: readonly RequestTypeGroupReceipt[] = Object.freeze([]),
): readonly RequestTypeDerivationRelation[] => Object.freeze([
  ...receipts.map(receipt => Object.freeze({
    relation: 'route_disposition' as const,
    routeKey: receipt.route.semanticKey,
    disposition: receipt.disposition.kind,
  })),
  ...receipts.flatMap(receipt => {
    const resolution = receipt.requestResolution;
    if (resolution.kind !== 'resolved_exact' && resolution.kind !== 'resolved_normalized') return [];
    return [Object.freeze({
      relation: 'request_resolves_to' as const,
      routeKey: receipt.route.semanticKey,
      requestKey: resolution.request.semanticKey,
      mode: resolution.kind === 'resolved_exact' ? 'exact' as const : 'normalized' as const,
    })];
  }),
  ...resources.flatMap(receipt => receipt.disposition.kind === 'available'
    ? [Object.freeze({ relation: 'resource_available_as' as const, resourceKey: receipt.resource.semanticKey, canonicalKey: receipt.disposition.canonicalKey })]
    : []),
  ...groupReceipts.flatMap(group => group.contributingRoutes.map(route => Object.freeze({ relation: 'route_groups_by' as const, routeKey: route.semanticKey, groupKey: group.canonicalKey }))),
  ...groupReceipts.flatMap(group => group.contributingRoutes.map(route => Object.freeze({ relation: 'group_contains_route' as const, groupKey: group.canonicalKey, routeKey: route.semanticKey }))),
  ...receipts.flatMap(receipt => receipt.disposition.kind === 'conflicted'
    ? [Object.freeze({ relation: 'source_conflict' as const, sourceKey: receipt.route.semanticKey, conflictKind: receipt.disposition.reason === 'duplicate_route_identity' ? 'duplicate_route_identity' as const : receipt.disposition.reason === 'ambiguous_request' ? 'ambiguous_request_identity' as const : receipt.disposition.reason === 'ambiguous_resource' ? 'ambiguous_resource_identity' as const : receipt.disposition.reason === 'resource_identity_mismatch' ? 'resource_identity_mismatch' as const : 'incompatible_group_contribution' as const })]
    : []),
  ...resources.flatMap(receipt => receipt.disposition.kind === 'conflicted'
    ? [Object.freeze({ relation: 'source_conflict' as const, sourceKey: receipt.resource.semanticKey, conflictKind: 'duplicate_resource_identity' as const })]
    : []),
  ...requests.flatMap(receipt => receipt.disposition.kind === 'conflicted'
    ? [Object.freeze({ relation: 'source_conflict' as const, sourceKey: receipt.request.semanticKey, conflictKind: 'duplicate_request_identity' as const })]
    : []),
  ...conflicts.flatMap((conflict): readonly RequestTypeDerivationRelation[] => {
    switch (conflict.kind) {
      case 'ambiguous_request_identity':
        return [Object.freeze({ relation: 'source_conflict' as const, sourceKey: conflict.route.semanticKey, conflictKind: conflict.kind })];
      case 'ambiguous_resource_identity':
      case 'resource_identity_mismatch':
        return [Object.freeze({ relation: 'source_conflict' as const, sourceKey: conflict.route.semanticKey, conflictKind: conflict.kind })];
      case 'duplicate_route_identity':
        return conflict.candidates.map(candidate => Object.freeze({ relation: 'source_conflict' as const, sourceKey: candidate.semanticKey, conflictKind: conflict.kind }));
      case 'duplicate_request_identity':
        return conflict.candidates.map(candidate => Object.freeze({ relation: 'source_conflict' as const, sourceKey: candidate.semanticKey, conflictKind: conflict.kind }));
      case 'duplicate_resource_identity':
        return conflict.candidates.map(candidate => Object.freeze({ relation: 'source_conflict' as const, sourceKey: candidate.semanticKey, conflictKind: conflict.kind }));
      case 'incompatible_group_contribution':
        return conflict.routeReceipts.map(receipt => Object.freeze({ relation: 'source_conflict' as const, sourceKey: receipt.route.semanticKey, conflictKind: conflict.kind }));
      default: {
        const exhaustive: never = conflict;
        return exhaustive;
      }
    }
  }),
]);

const makeProof = (
  preparedInput: RequestTypeDerivationSemanticInputPreparation,
  routeReceipts: readonly RequestTypeRouteReceipt[],
  resourceReceipts: readonly RequestTypeResourceReceipt[],
  requestReceipts: readonly RequestTypeRequestReceipt[],
  conflicts: readonly RequestTypeDerivationConflict[],
  closure: RequestTypeDerivationClosure,
  groupReceipts: readonly RequestTypeGroupReceipt[] = Object.freeze([]),
) => Object.freeze({
  kind: 'request_type_derivation_proof' as const,
  authority: 'upstream_request_type_derivation' as const,
  reasoning: 'declarative_source_relation_closure' as const,
  policy: requestTypeDerivationContract.policy,
  // This names required obligations only; it does not claim they have been verified.
  requiredLaws: requestTypeDerivationContract.laws,
  sourceEvidence: Object.freeze({
    routes: preparedInput.inventory.routes,
    resources: preparedInput.inventory.resources,
    requests: preparedInput.inventory.requests,
  }),
  routeReceipts,
  resourceReceipts,
  requestReceipts,
  groupReceipts,
  relations: makeRelations(routeReceipts, resourceReceipts, requestReceipts, conflicts, groupReceipts),
  conflicts,
  closure,
});

const countAccountedOccurrences = (
  expectedOccurrenceKeys: readonly string[],
  receiptOccurrenceKeys: readonly string[],
): number => {
  const expected = new Set(expectedOccurrenceKeys);
  const accounted = new Set(receiptOccurrenceKeys.filter(key => expected.has(key)));
  return accounted.size;
};

const closureCounts = (
  preparedInput: RequestTypeDerivationSemanticInputPreparation,
  routeReceipts: readonly RequestTypeRouteReceipt[],
  resourceReceipts: readonly RequestTypeResourceReceipt[],
  requestReceipts: readonly RequestTypeRequestReceipt[],
) => {
  const routes = Object.freeze({
    expected: preparedInput.inventory.routes.length,
    accounted: countAccountedOccurrences(
      preparedInput.inventory.routes.map(source => source.occurrenceKey),
      routeReceipts.map(receipt => receipt.route.occurrenceKey),
    ),
  });
  const resources = Object.freeze({
    expected: preparedInput.inventory.resources.length,
    accounted: countAccountedOccurrences(
      preparedInput.inventory.resources.map(source => source.occurrenceKey),
      resourceReceipts.map(receipt => receipt.resource.occurrenceKey),
    ),
  });
  const requests = Object.freeze({
    expected: preparedInput.inventory.requests.length,
    accounted: countAccountedOccurrences(
      preparedInput.inventory.requests.map(source => source.occurrenceKey),
      requestReceipts.map(receipt => receipt.request.occurrenceKey),
    ),
  });
  return Object.freeze({ routes, resources, requests });
};

const makeClosure = (
  preparedInput: RequestTypeDerivationSemanticInputPreparation,
  routeReceipts: readonly RequestTypeRouteReceipt[],
  resourceReceipts: readonly RequestTypeResourceReceipt[],
  requestReceipts: readonly RequestTypeRequestReceipt[],
  unresolvedCount: number,
  conflictCount: number,
): RequestTypeDerivationClosure => {
  const counts = closureCounts(preparedInput, routeReceipts, resourceReceipts, requestReceipts);
  if (conflictCount > 0) return Object.freeze({ kind: 'conflicted', ...counts, unresolved: unresolvedCount, conflicts: conflictCount });
  return Object.freeze({ kind: 'incomplete', ...counts, unresolved: unresolvedCount, conflicts: 0 });
};

const makeClosedClosure = (
  preparedInput: RequestTypeDerivationSemanticInputPreparation,
  routeReceipts: readonly RequestTypeRouteReceipt[],
  resourceReceipts: readonly RequestTypeResourceReceipt[],
  requestReceipts: readonly RequestTypeRequestReceipt[],
): RequestTypeDerivationClosure => {
  const counts = closureCounts(preparedInput, routeReceipts, resourceReceipts, requestReceipts);
  const isFullyAccounted = counts.routes.expected === counts.routes.accounted
    && counts.resources.expected === counts.resources.accounted
    && counts.requests.expected === counts.requests.accounted;
  if (!isFullyAccounted) {
    throw new RequestTypeDerivationSemanticProducerGapError(
      'reasoning',
      `cannot emit closed judgment: source receipt coverage is incomplete (routes=${counts.routes.accounted}/${counts.routes.expected}, resources=${counts.resources.accounted}/${counts.resources.expected}, requests=${counts.requests.accounted}/${counts.requests.expected})`,
    );
  }
  return Object.freeze({ kind: 'closed', ...counts, unresolved: 0, conflicts: 0 });
};

/**
 * Derive contribution receipts from the original RouteSemanticFlow and the exact
 * resolved request ledger. This slice deliberately supports only explicit void
 * response descriptors; non-void response projection remains a typed producer gap.
 */
const makeGroupReceipts = (
  preparedInput: RequestTypeDerivationSemanticInputPreparation,
  routeReceipts: readonly RequestTypeRouteReceipt[],
): readonly RequestTypeGroupReceipt[] => {
  const groups = new Map<RequestTypeGroupKey, { routes: RequestTypeRouteEvidenceReference[]; requests: import('../../../types/upstream/requestTypeDerivationInterface').RequestTypeRequestEvidenceReference[]; contributions: RequestTypeGroupContributionReceipt[]; result: RequestType }>();
  for (const receipt of routeReceipts) {
    if (receipt.disposition.kind !== 'contributed') continue;
    const route = preparedInput.input.routes.find(candidate =>
      requestTypeDerivationSourceEvidenceInventory.canonicalRouteOccurrenceKey(candidate.provenance) === receipt.route.occurrenceKey,
    );
    if (!route) throw new RequestTypeDerivationSemanticProducerGapError('reasoning', `route source ${receipt.route.occurrenceKey} disappeared from input inventory`);
    if (route.binding.request.kind !== 'form_request') {
      throw new RequestTypeDerivationSemanticProducerGapError('reasoning', `contributed route ${receipt.route.occurrenceKey} has no FormRequest source`);
    }
    const responseProjection = route.binding.responseProjection;
    const resourceIndex = new Map<string, ResourceAst>(preparedInput.input.resources.map(resource => [
      resource.definition.name.value.value,
      resource,
    ]));
    let response: RequestType['response'];
    if (responseProjection.kind === 'controller_method_response'
      && responseProjection.product.result.kind === 'resource') {
      // Reuse the canonical response contributor so resource fields and the
      // response contract stay source-grounded; never infer a body from the
      // route's broad response kind alone.
      const projectedResponse = requestTypeResponseContributionDerivation.derive(route, resourceIndex);
      if (projectedResponse.kind !== 'some') {
        throw new RequestTypeDerivationSemanticProducerGapError('reasoning', `resource response for ${receipt.route.occurrenceKey} has no correlated ResourceAst contract`);
      }
      response = Object.freeze({ kind: 'data', value: projectedResponse.value });
    } else {
      const responseIsExplicitlyEmpty = responseProjection.kind === 'empty_response'
        || (responseProjection.kind === 'controller_method_response'
          && (responseProjection.product.result.kind === 'no_content'
            || (responseProjection.product.result.kind === 'content' && responseProjection.product.result.body.kind === 'empty')));
      if (!responseIsExplicitlyEmpty) {
        throw new RequestTypeDerivationSemanticProducerGapError('reasoning', `response contribution for ${receipt.route.occurrenceKey} requires a correlated resource response or explicit empty-response evidence; observed ${route.binding.response.kind}/${responseProjection.kind}`);
      }
      response = Object.freeze({ kind: 'none' as const });
    }
    const requestReceipt = preparedInput.requestResolutionLedger.find(candidate =>
      candidate.route.occurrenceKey === receipt.route.occurrenceKey
      && (candidate.resolution.kind === 'resolved_exact' || candidate.resolution.kind === 'resolved_normalized'),
    );
    if (!requestReceipt || (requestReceipt.resolution.kind !== 'resolved_exact' && requestReceipt.resolution.kind !== 'resolved_normalized')) {
      throw new RequestTypeDerivationSemanticProducerGapError('reasoning', `contributed route ${receipt.route.occurrenceKey} has no resolved request witness`);
    }
    const incoming: RequestType = Object.freeze({
      identity: route.binding.request.identity,
      source: route.binding.request.source,
      actions: requestTypeRouteActionDerivation.derive(route).actionObj,
      response,
    });
    const key = receipt.disposition.groupKey;
    const current = groups.get(key);
    const contribution = requestTypeDerivationGroupContributionAlgebra.fold({
      canonicalKey: key,
      route: receipt.route,
      request: requestReceipt.resolution.request,
      before: current?.result ?? Object.freeze({ kind: 'group_absent' as const }),
      incoming,
    });
    if (current) {
      current.routes.push(receipt.route);
      current.requests.push(requestReceipt.resolution.request);
      current.contributions.push(contribution);
      current.result = contribution.after;
    } else {
      groups.set(key, {
        routes: [receipt.route],
        requests: [requestReceipt.resolution.request],
        contributions: [contribution],
        result: contribution.after,
      });
    }
  }
  return Object.freeze([...groups.entries()].map(([canonicalKey, group]) => Object.freeze({
    canonicalKey,
    contributingRoutes: Object.freeze(group.routes),
    contributingRequests: Object.freeze(group.requests),
    contributions: Object.freeze(group.contributions),
    result: group.result,
    resultIdentity: group.result.identity,
  })));
};

const unresolvedReceipts = (
  receipts: readonly RequestTypeRouteReceipt[],
): readonly RequestTypeUnresolvedRouteReceipt[] => Object.freeze(receipts.filter(
  (receipt): receipt is RequestTypeUnresolvedRouteReceipt => receipt.disposition.kind === 'unresolved',
));

const inferenceFor = (
  preparedInput: RequestTypeDerivationSemanticInputPreparation,
  judgment: RequestTypeDerivationSemanticInferenceFor['judgment'],
): RequestTypeDerivationSemanticInferenceFor => Object.freeze({
  contract: requestTypeDerivationContract,
  input: preparedInput.input,
  preparedInput,
  judgment,
});

export const requestTypeDerivationSemanticReasoning: RequestTypeDerivationSemanticReasoningInterface = Object.freeze({
  contract: requestTypeDerivationContract,
  infer: (preparedInput: RequestTypeDerivationSemanticInputPreparation): RequestTypeDerivationSemanticInferenceFor => {
    const identityConflicts = conflictsFromIdentityCollisions(preparedInput);

    // Resource identity policy explicitly says duplicate canonical identities are
    // semantic conflicts, not malformed input. Keep this classification in the
    // judgment ADT and carry all colliding source occurrences into the proof.
    const routeReceipts = makeRouteReceipts(preparedInput);
    const resourceReceipts = makeResourceReceipts(preparedInput);
    const requestReceipts = makeRequestReceipts(preparedInput);
    const unresolved = unresolvedReceipts(routeReceipts);
    const conflicts: RequestTypeDerivationConflict[] = [...identityConflicts];
    // Collect request conflicts directly from their authoritative ledger rather than
    // from the single route disposition. A route can simultaneously have request
    // ambiguity and resource ambiguity/mismatch; neither witness may mask the other.
    for (const requestReceipt of preparedInput.requestResolutionLedger) {
      const resolution = requestReceipt.resolution;
      if (resolution.kind === 'ambiguous_exact' || resolution.kind === 'ambiguous_normalized') {
        conflicts.push(Object.freeze({ kind: 'ambiguous_request_identity', route: requestReceipt.route, candidates: resolution.candidates }));
      }
    }

    for (const resourceReceipt of preparedInput.resourceResolutionLedger) {
      if (resourceReceipt.resolution.kind === 'ambiguous') {
        conflicts.push(Object.freeze({ kind: 'ambiguous_resource_identity', route: resourceReceipt.route, candidates: resourceReceipt.resolution.candidates }));
      } else if (resourceReceipt.resolution.kind === 'identity_mismatch') {
        conflicts.push(Object.freeze({ kind: 'resource_identity_mismatch', route: resourceReceipt.route, routeResourceName: resourceReceipt.resolution.routeResourceName, bindingResourceName: resourceReceipt.resolution.bindingResourceName }));
      }
    }

    // Conflict and unresolved judgments are emitted only when their ledgers are
    // complete. Contribution-eligible routes are folded below for the closed slice.

    if (conflicts.length > 0) {
      // A conflict in one source occurrence does not erase independently valid
      // contributions from other occurrences. Fold eligible routes and publish
      // their receipts alongside the conflict ledger; unsupported contribution
      // shapes still fail with the typed producer-gap error below.
      const groupReceipts = makeGroupReceipts(preparedInput, routeReceipts);
      const groups = Object.freeze(groupReceipts.map(group => group.result));
      const proof = makeProof(
        preparedInput, routeReceipts, resourceReceipts, requestReceipts, conflicts,
        makeClosure(preparedInput, routeReceipts, resourceReceipts, requestReceipts, unresolved.length, conflicts.length),
        groupReceipts,
      );
      return inferenceFor(preparedInput, Object.freeze({
        kind: 'conflict',
        groups,
        conflicts: conflicts as [RequestTypeDerivationConflict, ...RequestTypeDerivationConflict[]],
        proof: proof as unknown as RequestTypeDerivationProofFor<'conflicted'>,
      }));
    }

    const assessmentClaimsIncomplete = preparedInput.resourceAssessment.kind === 'incomplete'
      || preparedInput.requestAssessment.kind === 'incomplete'
      || preparedInput.requestAssessment.kind === 'incomplete_and_conflicted';
    if (unresolved.length > 0 || assessmentClaimsIncomplete) {
      // The judgment ADT requires a non-empty unresolved ledger. Assessment
      // variants are computed from source ledgers, but the preparation packet is
      // a public boundary and can be stale/forged; never satisfy the tuple type
      // with an unchecked cast when the route-level witnesses are absent.
      if (unresolved.length === 0) {
        throw new RequestTypeDerivationSemanticProducerGapError(
          'reasoning',
          `resolution assessment claims incomplete while route receipts contain no unresolved witness (request=${preparedInput.requestAssessment.kind}, resource=${preparedInput.resourceAssessment.kind})`,
        );
      }
      // Preserve contributions from resolved routes even while another route
      // remains unresolved. Closure remains incomplete and never upgrades to closed.
      const groupReceipts = makeGroupReceipts(preparedInput, routeReceipts);
      const groups = Object.freeze(groupReceipts.map(group => group.result));
      const proof = makeProof(
        preparedInput, routeReceipts, resourceReceipts, requestReceipts, [],
        makeClosure(preparedInput, routeReceipts, resourceReceipts, requestReceipts, unresolved.length, 0),
        groupReceipts,
      );
      return inferenceFor(preparedInput, Object.freeze({
        kind: 'incomplete',
        groups,
        unresolved: unresolved as [RequestTypeUnresolvedRouteReceipt, ...RequestTypeUnresolvedRouteReceipt[]],
        proof: proof as unknown as RequestTypeDerivationProofFor<'incomplete'>,
      }));
    }

    const groupReceipts = makeGroupReceipts(preparedInput, routeReceipts);
    const groups = Object.freeze(groupReceipts.map(group => group.result));
    const proof = makeProof(
      preparedInput,
      routeReceipts,
      resourceReceipts,
      requestReceipts,
      [],
      makeClosedClosure(preparedInput, routeReceipts, resourceReceipts, requestReceipts),
      groupReceipts,
    );
    return inferenceFor(preparedInput, Object.freeze({
      kind: 'derived',
      groups,
      proof: proof as unknown as RequestTypeDerivationProofFor<'closed'>,
    }));
  },
});

/** Domain operation contract for independently checking duplicate-identity conflict evidence. */
export interface RequestTypeDerivationIdentityConflictLedgerVerificationInterface {
  readonly matchesInput: (inference: RequestTypeDerivationSemanticInferenceFor) => boolean;
}

/** Independently correlate duplicate-identity conflict candidates to raw source occurrences. */
export const requestTypeDerivationIdentityConflictLedgerVerification: RequestTypeDerivationIdentityConflictLedgerVerificationInterface = Object.freeze({
  matchesInput: (inference: RequestTypeDerivationSemanticInferenceFor): boolean => {
  const judgment = inference.judgment;
  if (judgment.kind !== 'conflict') return false;
  if (inference.preparedInput.input !== inference.input) return false;
  const collisionInventory = requestTypeDerivationSourceEvidenceInventory.identityCollisionInventory(inference.input);
  if (collisionInventory.kind !== 'identity_inventory_collisions') return false;
  const expected = conflictsFromIdentityCollisions(inference.preparedInput);
  const supplied = judgment.conflicts.filter(conflict =>
    conflict.kind === 'duplicate_route_identity'
      || conflict.kind === 'duplicate_request_identity'
      || conflict.kind === 'duplicate_resource_identity',
  );
  const recomputed = collisionInventory.witnesses.map(witness => {
    switch (witness.domain) {
      case 'routes': return Object.freeze({ kind: 'duplicate_route_identity' as const, candidates: Object.freeze([witness.occurrences.first, witness.occurrences.second, ...witness.occurrences.additional]) });
      case 'requests': return Object.freeze({ kind: 'duplicate_request_identity' as const, candidates: Object.freeze([witness.occurrences.first, witness.occurrences.second, ...witness.occurrences.additional]) });
      case 'resources': return Object.freeze({ kind: 'duplicate_resource_identity' as const, candidates: Object.freeze([witness.occurrences.first, witness.occurrences.second, ...witness.occurrences.additional]) });
      default: { const exhaustive: never = witness; return exhaustive; }
    }
  });
  const rawInventory = requestTypeDerivationSourceEvidenceInventory.inventory(inference.input);
  const routeCollisionKeys = new Set(collisionInventory.witnesses
    .filter((witness): witness is Extract<RequestTypeDuplicateIdentityWitness, { readonly domain: 'routes' }> => witness.domain === 'routes')
    .flatMap(witness => duplicateWitnessCandidates(witness).map(source => source.occurrenceKey)));
  const requestCollisionKeys = new Set(collisionInventory.witnesses
    .filter((witness): witness is Extract<RequestTypeDuplicateIdentityWitness, { readonly domain: 'requests' }> => witness.domain === 'requests')
    .flatMap(witness => duplicateWitnessCandidates(witness).map(source => source.occurrenceKey)));
  const resourceCollisionKeys = new Set(collisionInventory.witnesses
    .filter((witness): witness is Extract<RequestTypeDuplicateIdentityWitness, { readonly domain: 'resources' }> => witness.domain === 'resources')
    .flatMap(witness => duplicateWitnessCandidates(witness).map(source => source.occurrenceKey)));
  const routeReceiptsMatch = [...routeCollisionKeys].every(key => judgment.proof.routeReceipts.some(receipt => receipt.route.occurrenceKey === key && receipt.disposition.kind === 'conflicted' && receipt.disposition.reason === 'duplicate_route_identity'));
  const requestReceiptsMatch = [...requestCollisionKeys].every(key => judgment.proof.requestReceipts.some(receipt => receipt.request.occurrenceKey === key && receipt.disposition.kind === 'conflicted'));
  const resourceReceiptsMatch = [...resourceCollisionKeys].every(key => judgment.proof.resourceReceipts.some(receipt => receipt.resource.occurrenceKey === key && receipt.disposition.kind === 'conflicted'));
  const closure = judgment.proof.closure;
  return equivalentEvidenceValues(expected, recomputed)
    && equivalentEvidenceValues(supplied, recomputed)
    && equivalentEvidenceValues(judgment.proof.conflicts, judgment.conflicts)
    && equivalentEvidenceValues(inference.preparedInput.inventory, rawInventory)
    && equivalentEvidenceValues(judgment.proof.sourceEvidence, rawInventory)
    && routeReceiptsMatch && requestReceiptsMatch && resourceReceiptsMatch
    && closure.kind === 'conflicted'
    && closure.conflicts === judgment.conflicts.length
    && closure.routes.expected === rawInventory.routes.length && closure.routes.accounted === rawInventory.routes.length
    && closure.resources.expected === rawInventory.resources.length && closure.resources.accounted === rawInventory.resources.length
    && closure.requests.expected === rawInventory.requests.length && closure.requests.accounted === rawInventory.requests.length;
  },
});
