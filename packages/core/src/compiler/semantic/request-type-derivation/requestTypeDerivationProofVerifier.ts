/**
 * Independent RequestType proof-verification entrypoint.
 *
 * This verifier deliberately does not call the producer's group-fold algebra.
 * It replays the published before/incoming/after receipts using the contract's
 * declared action/response policy, then correlates each final group with both
 * the judgment output and its proof receipt. A successful slice remains
 * `verification_incomplete` until every canonical law has an independent check.
 */
import {
  REQUEST_TYPE_DERIVATION_LAW_IDS,
  requestTypeDerivationContract,
  type RequestTypeDerivationIncomingContributionAstVerificationInterface,
  type RequestTypeDerivationGroupIdentityVerificationInterface,
  type RequestTypeDerivationConflictGroupVerificationInterface,
  type RequestTypeDerivationConflictLedgerClosureVerificationInterface,
  type RequestTypeDerivationInventoryAstVerificationInterface,
  type RequestTypeDerivationProofVerificationInterface,
  type RequestTypeDerivationSemanticInferenceFor,
  type RequestTypeDerivationSemanticVerificationFor,
  type RequestTypeGroupContributionReceipt,
  type RequestTypeGroupReceipt,
} from '../../../types/upstream/requestTypeDerivationInterface';
import type { RequestType } from '../../../types/domain/request';
import { FormActionName } from '../../../types/domain/request';
import { typeExpressionToSemanticType } from '../type-derivation/resourceTypeDeriver';
import type { RequestTypeDerivationSemanticInputPreparation } from '../../../types/upstream/requestTypeDerivationInterface';
import type { Sequence } from '../../../types/upstream/collections';
import { RequestTypeDerivationSemanticProducerGapError } from './requestTypeDerivationSemanticProducerGap';
import { requestTypeDerivationIdentityConflictLedgerVerification } from './requestTypeDerivationSemanticReasoning';
import { requestTypeDerivationSourceEvidenceInventory } from './requestTypeDerivationSourceEvidenceInventory';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Structural equality that ignores object property insertion order, not array order. */
const structurallyEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) => structurallyEqual(value, right[index]));
  }
  if (!isRecord(left) || !isRecord(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) => key === rightKeys[index]
      && structurallyEqual(left[key], right[key]));
};

const isGroupAbsent = (value: RequestTypeGroupContributionReceipt['before']): boolean =>
  isRecord(value) && value.kind === 'group_absent';

const replayContribution = (
  receipt: RequestTypeGroupContributionReceipt,
  expectedBefore: RequestTypeGroupContributionReceipt['before'],
  first: boolean,
): boolean => {
  if (!structurallyEqual(receipt.before, expectedBefore)) return false;
  if (first !== (receipt.transition === 'initial_group')) return false;
  if (first !== isGroupAbsent(receipt.before)) return false;

  const existing = first ? undefined : receipt.before as RequestType;
  const actions = [...(existing?.actions ?? [])];
  let expectedAction: RequestTypeGroupContributionReceipt['action'] = { kind: 'not_applicable' };
  if (receipt.incoming.actions.length > 1) return false;
  const incomingAction = receipt.incoming.actions[0];
  if (incomingAction) {
    const index = actions.findIndex(action => action.name === incomingAction.name);
    if (index < 0) {
      actions.push(incomingAction);
      expectedAction = { kind: 'appended', actionName: incomingAction.name };
    } else if (actions[index]!.fields.length === 0 && incomingAction.fields.length > 0) {
      actions[index] = incomingAction;
      expectedAction = { kind: 'replaced_existing', actionName: incomingAction.name };
    } else {
      expectedAction = { kind: 'retained_existing', actionName: incomingAction.name };
    }
  }

  const incomingResponse = receipt.incoming.response;
  const existingResponse = existing?.response;
  let expectedResponse: RequestTypeGroupContributionReceipt['response'];
  let response: RequestType['response'];
  if (incomingResponse.kind === 'none') {
    expectedResponse = { kind: 'no_incoming_response' };
    response = first ? incomingResponse : existingResponse!;
  } else if (first || existingResponse?.kind === 'none') {
    expectedResponse = { kind: 'accepted_incoming' };
    response = incomingResponse;
  } else {
    expectedResponse = { kind: 'retained_existing' };
    response = existingResponse!;
  }

  const expectedAfter: RequestType = first
    ? { ...receipt.incoming, actions, response }
    : { ...existing!, actions, response };
  return structurallyEqual(receipt.action, expectedAction)
    && structurallyEqual(receipt.response, expectedResponse)
    && structurallyEqual(receipt.after, expectedAfter);
};

const sequenceToArray = <T>(sequence: Sequence<T>): readonly T[] => {
  const values: T[] = [];
  let cursor: Sequence<T> = sequence;
  while (cursor.kind === 'cons') {
    values.push(cursor.head);
    cursor = cursor.tail;
  }
  return values;
};

/**
 * Re-derive the contribution's action/response boundary from the source route
 * and ResourceAst. This deliberately does not call producer operation objects;
 * producer output is not independent verification evidence. Unsupported
 * response forms remain rejected rather than guessed.
 */
export const requestTypeDerivationIncomingContributionAstVerification: RequestTypeDerivationIncomingContributionAstVerificationInterface = Object.freeze({
  matchesAst: (
    groups: readonly RequestTypeGroupReceipt[],
    preparedInput: RequestTypeDerivationSemanticInputPreparation,
  ): boolean => {
  const resources = new Map(preparedInput.input.resources.map(resource => [
    resource.definition.name.value.value,
    resource,
  ]));

  for (const group of groups) {
    for (const receipt of group.contributions) {
      const route = preparedInput.input.routes.find(candidate =>
        requestTypeDerivationSourceEvidenceInventory.canonicalRouteOccurrenceKey(candidate.provenance) === receipt.route.occurrenceKey,
      );
      if (!route || route.binding.request.kind !== 'form_request') return false;

      const actionKind = route.capability.actionKind;
      const expectedActions = actionKind === 'create'
        ? [{ name: FormActionName.Create, fields: route.binding.schema.fields }]
        : actionKind === 'update'
          ? [{ name: FormActionName.Update, fields: route.binding.schema.fields }]
          : actionKind === 'read' || actionKind === 'delete'
            ? []
            : undefined;
      if (!expectedActions || !structurallyEqual(receipt.incoming.actions, expectedActions)) return false;

      const projection = route.binding.responseProjection;
      if (projection.kind === 'controller_method_response' && projection.product.result.kind === 'resource') {
        const result = projection.product.result;
        const resourceName = result.resource.name.value.value;
        const resource = resources.get(resourceName);
        if (!resource || receipt.incoming.response.kind !== 'data') return false;
        const sourceFields = sequenceToArray(resource.definition.fields.items);
        const response = receipt.incoming.response.value;
        if (response.fields.length !== sourceFields.length
          || response.contract.kind !== 'object'
          || response.contract.shape !== (result.cardinality.kind === 'collection' ? 'collection' : 'single')
          || response.contract.name.value.value !== resourceName
          || response.contract.fields.length !== sourceFields.length) return false;
        for (let index = 0; index < sourceFields.length; index += 1) {
          const sourceField = sourceFields[index]!;
          const responseField = response.fields[index]!;
          const contractField = response.contract.fields[index]!;
          if (responseField.name.value.value !== sourceField.name.value.value
            || !structurallyEqual(responseField.type, typeExpressionToSemanticType(sourceField.type))
            || contractField.name.value !== sourceField.name.value.value) return false;
        }
        continue;
      }

      const isExplicitEmpty = projection.kind === 'empty_response'
        || (projection.kind === 'controller_method_response'
          && (projection.product.result.kind === 'no_content'
            || (projection.product.result.kind === 'content' && projection.product.result.body.kind === 'empty')));
      if (!isExplicitEmpty || receipt.incoming.response.kind !== 'none') return false;
    }
  }
  return groups.every(group => group.contributions.length > 0);
  },
});


/**
 * Correlate every full incoming value back to the exact route/request source
 * occurrences in the canonical preparation packet. This closes the previous
 * gap where receipts carried only actions/response and could not prove whose
 * AST contribution those values represented.
 */
/**
 * Independently bind every contribution to the resource resolution ledger.
 * A route/request receipt can be individually authentic yet still be forged
 * into a different resource group. Duplicate occurrences across groups are
 * rejected rather than silently counted twice.
 */
export const requestTypeDerivationGroupIdentityVerification: RequestTypeDerivationGroupIdentityVerificationInterface = Object.freeze({
  matchesInput: (
    groups: readonly RequestTypeGroupReceipt[],
    preparedInput: RequestTypeDerivationSemanticInputPreparation,
  ): boolean => {
    if (groups.length === 0) return false;
    const seenRoutes = new Set<string>();
    const seenGroupKeys = new Set<string>();

    for (const group of groups) {
      if (!group.canonicalKey.startsWith('resource:') || seenGroupKeys.has(group.canonicalKey)) return false;
      seenGroupKeys.add(group.canonicalKey);
      if (group.contributions.length === 0) return false;

      for (const contribution of group.contributions) {
        const routeKey = contribution.route.occurrenceKey;
        const requestKey = contribution.request.occurrenceKey;
        if (seenRoutes.has(routeKey)) return false;
        seenRoutes.add(routeKey);

        const routeResourceReceipts = preparedInput.resourceResolutionLedger.filter(candidate =>
          candidate.route.occurrenceKey === routeKey,
        );
        if (routeResourceReceipts.length !== 1) return false;
        const resolution = routeResourceReceipts[0]!.resolution;
        if (resolution.kind !== 'resolved') return false;
        if (resolution.resource.canonicalIdentity.semanticKey !== group.canonicalKey) return false;
        if (routeResourceReceipts[0]!.route.occurrenceKey !== contribution.route.occurrenceKey) return false;

        const requestReceipts = preparedInput.requestResolutionLedger.filter(candidate =>
          candidate.route.occurrenceKey === routeKey,
        );
        if (requestReceipts.length !== 1) return false;
        const requestResolution = requestReceipts[0]!.resolution;
        if ((requestResolution.kind !== 'resolved_exact' && requestResolution.kind !== 'resolved_normalized')
          || requestResolution.request.occurrenceKey !== requestKey) return false;
      }
    }
    return true;
  },
});


/**
 * Conflict judgments may preserve contributions from unrelated, valid routes.
 * Verifying only the collision ledger is insufficient: a malformed or forged
 * group could otherwise ride along with a legitimate duplicate-identity conflict.
 * Empty groups are accepted only when no route claims contribution.
 */
/**
 * Conflict witnesses do not excuse missing or duplicated source receipts.
 * Close every route/resource/request inventory occurrence exactly once and
 * bind each route receipt back to its authoritative resolution ledgers.
 */
/**
 * Re-check inventory identity and source coordinates against raw AST nodes.
 * A self-consistent ledger is not authoritative if its own inventory was forged.
 */
export const requestTypeDerivationInventoryAstVerification: RequestTypeDerivationInventoryAstVerificationInterface = Object.freeze({
  matchesInput: (preparedInput: RequestTypeDerivationSemanticInputPreparation): boolean => {
    const input = preparedInput.input;
    const inventory = preparedInput.inventory;
    if (inventory.routes.length !== input.routes.length
      || inventory.resources.length !== input.resources.length
      || inventory.requests.length !== input.requests.length) return false;

    const spanKey = (span: { file: { value: { value: string } }; start: { value: number }; end: { value: number } }) =>
      `${encodeURIComponent(span.file.value.value)}:${span.start.value}:${span.end.value}`;

    const routeKeys = new Set<string>();
    for (const route of input.routes) {
      const key = requestTypeDerivationSourceEvidenceInventory.canonicalRouteOccurrenceKey(route.provenance);
      if (routeKeys.has(key)) return false;
      routeKeys.add(key);
      const ref = inventory.routes.find(candidate => candidate.occurrenceKey === key);
      if (!ref || ref.semanticKey !== ref.canonicalIdentity.semanticKey
        || ref.semanticKey !== `route:${[
          route.identity.coordinates.method,
          route.identity.coordinates.path.value.value,
          route.identity.coordinates.name.value.value,
          route.identity.domain.resource.value.value,
          route.identity.domain.domain.value.value,
          route.identity.domain.group.value.value,
        ].map(encodeURIComponent).join(':')}`
        || !structurallyEqual(ref.source.identity, route.identity)
        || !structurallyEqual(ref.source.provenance, route.provenance)
        || !structurallyEqual(ref.location.span, route.provenance.declarationSpan)
        || !structurallyEqual(ref.location.file, route.provenance.sourceFile)
        || !structurallyEqual(ref.location.line, route.provenance.sourceLine)) return false;
    }

    const resourceKeys = new Set<string>();
    for (const resource of input.resources) {
      const key = `resource-occurrence:${spanKey(resource.source)}`;
      if (resourceKeys.has(key)) return false;
      resourceKeys.add(key);
      const ref = inventory.resources.find(candidate => candidate.occurrenceKey === key);
      const canonicalName = resource.definition.name.value.value.toLowerCase();
      if (!ref || ref.semanticKey !== `resource:${canonicalName}`
        || ref.canonicalIdentity.semanticKey !== ref.semanticKey
        || ref.canonicalIdentity.canonicalName.value.value !== canonicalName
        || !structurallyEqual(ref.source.identity, resource.definition.name)
        || !structurallyEqual(ref.source.source, resource.source)
        || !structurallyEqual(ref.location.span, resource.source)) return false;
    }

    const requestKeys = new Set<string>();
    for (const request of input.requests) {
      const key = requestTypeDerivationSourceEvidenceInventory.canonicalRequestOccurrenceKey(request.source);
      if (requestKeys.has(key)) return false;
      requestKeys.add(key);
      const ref = inventory.requests.find(candidate => candidate.occurrenceKey === key);
      const identity = request.definition.identity;
      const expectedKey = identity.kind === 'http_request_identity'
        ? `request:http:${encodeURIComponent(identity.request.value.value)}`
        : identity.kind === 'form_request_identity'
          ? `request:form:${encodeURIComponent(identity.request.value.value)}:${encodeURIComponent(identity.formType.value.value)}`
          : undefined;
      if (!expectedKey || !ref || ref.semanticKey !== expectedKey
        || ref.canonicalIdentity.semanticKey !== ref.semanticKey
        || !structurallyEqual(ref.source.identity, identity)
        || !structurallyEqual(ref.source.source, request.source)
        || !structurallyEqual(ref.location.span, request.source)) return false;
    }
    return true;
  },
});


export const requestTypeDerivationConflictLedgerClosureVerification: RequestTypeDerivationConflictLedgerClosureVerificationInterface = Object.freeze({
  matchesInput: (inference: RequestTypeDerivationSemanticInferenceFor): boolean => {
    const judgment = inference.judgment;
    if (judgment.kind !== 'conflict' || inference.preparedInput.input !== inference.input) return false;
    const proof = judgment.proof;
    const inventory = inference.preparedInput.inventory;
    if (!requestTypeDerivationInventoryAstVerification.matchesInput(inference.preparedInput)) return false;
    const routeRefs = new Map(inventory.routes.map(reference => [reference.occurrenceKey, reference]));
    const resourceRefs = new Map(inventory.resources.map(reference => [reference.occurrenceKey, reference]));
    const requestRefs = new Map(inventory.requests.map(reference => [reference.occurrenceKey, reference]));
    if (routeRefs.size !== inventory.routes.length || resourceRefs.size !== inventory.resources.length || requestRefs.size !== inventory.requests.length) return false;
    if (proof.routeReceipts.length !== routeRefs.size
      || proof.resourceReceipts.length !== resourceRefs.size
      || proof.requestReceipts.length !== requestRefs.size) return false;

    const seenRoutes = new Set<string>();
    for (const receipt of proof.routeReceipts) {
      const key = receipt.route.occurrenceKey;
      const source = routeRefs.get(key);
      if (!source || seenRoutes.has(key) || !structurallyEqual(source, receipt.route)) return false;
      seenRoutes.add(key);
      const routeAst = inference.preparedInput.input.routes.find(route => requestTypeDerivationSourceEvidenceInventory.canonicalRouteOccurrenceKey(route.provenance) === key);
      const requestLedger = inference.preparedInput.requestResolutionLedger.filter(candidate => candidate.route.occurrenceKey === key);
      const resourceLedger = inference.preparedInput.resourceResolutionLedger.filter(candidate => candidate.route.occurrenceKey === key);
      if (!routeAst || requestLedger.length !== 1 || resourceLedger.length !== 1) return false;
      if (receipt.requestBindingKind !== routeAst.binding.request.kind
        || !structurallyEqual(receipt.requestResolution, requestLedger[0]!.resolution)
        || !structurallyEqual(receipt.resourceResolution, resourceLedger[0]!.resolution)) return false;
    }

    const seenResources = new Set<string>();
    for (const receipt of proof.resourceReceipts) {
      const key = receipt.resource.occurrenceKey;
      const source = resourceRefs.get(key);
      if (!source || seenResources.has(key) || !structurallyEqual(source, receipt.resource)) return false;
      seenResources.add(key);
    }
    const seenRequests = new Set<string>();
    for (const receipt of proof.requestReceipts) {
      const key = receipt.request.occurrenceKey;
      const source = requestRefs.get(key);
      if (!source || seenRequests.has(key) || !structurallyEqual(source, receipt.request)) return false;
      seenRequests.add(key);
    }
    return seenRoutes.size === routeRefs.size && seenResources.size === resourceRefs.size && seenRequests.size === requestRefs.size;
  },
});


export const requestTypeDerivationConflictGroupVerification: RequestTypeDerivationConflictGroupVerificationInterface = Object.freeze({
  matchesInput: (inference: RequestTypeDerivationSemanticInferenceFor): boolean => {
    const judgment = inference.judgment;
    if (judgment.kind !== 'conflict') return false;
    const groups = judgment.proof.groupReceipts;
    if (groups.length === 0) {
      return judgment.groups.length === 0
        && !judgment.proof.routeReceipts.some(receipt => receipt.disposition.kind === 'contributed');
    }
    return requestTypeDerivationGroupReceiptsReplayVerification.replay(groups, judgment.groups)
      && requestTypeDerivationIncomingSourceVerification.matchesInput(groups, inference.preparedInput)
      && requestTypeDerivationIncomingContributionAstVerification.matchesAst(groups, inference.preparedInput)
      && requestTypeDerivationGroupIdentityVerification.matchesInput(groups, inference.preparedInput);
  },
});


export interface RequestTypeDerivationIncomingSourceVerificationInterface {
  readonly matchesInput: (
    groups: readonly RequestTypeGroupReceipt[],
    preparedInput: RequestTypeDerivationSemanticInputPreparation,
  ) => boolean;
}

export const requestTypeDerivationIncomingSourceVerification: RequestTypeDerivationIncomingSourceVerificationInterface = Object.freeze({
  matchesInput: (
    groups: readonly RequestTypeGroupReceipt[],
    preparedInput: RequestTypeDerivationSemanticInputPreparation,
  ): boolean => {
  const routes = new Map(preparedInput.inventory.routes.map(route => [route.occurrenceKey, route]));
  const requests = new Map(preparedInput.inventory.requests.map(request => [request.occurrenceKey, request]));
  for (const group of groups) {
    for (const receipt of group.contributions) {
      const routeReference = routes.get(receipt.route.occurrenceKey);
      const requestReference = requests.get(receipt.request.occurrenceKey);
      if (!routeReference || !requestReference) return false;
      if (!structurallyEqual(routeReference, receipt.route)
        || !structurallyEqual(requestReference, receipt.request)) return false;
      const routeAst = preparedInput.input.routes.find(candidate =>
        requestTypeDerivationSourceEvidenceInventory.canonicalRouteOccurrenceKey(candidate.provenance) === receipt.route.occurrenceKey,
      );
      const requestAst = preparedInput.input.requests.find(candidate =>
        requestTypeDerivationSourceEvidenceInventory.canonicalRequestOccurrenceKey(candidate.source) === receipt.request.occurrenceKey,
      );
      if (!routeAst || !requestAst || routeAst.binding.request.kind !== 'form_request') return false;
      if (!structurallyEqual(routeAst.provenance.declarationSpan, routeReference.location.span)
        || !structurallyEqual(requestAst.source, requestReference.location.span)
        || !structurallyEqual(requestReference.source.identity, requestAst.definition.identity)
        || !structurallyEqual(requestReference.source.source, requestAst.source)) return false;
      if (!structurallyEqual(receipt.incoming.identity, routeAst.binding.request.identity)
        || !structurallyEqual(receipt.incoming.source, routeAst.binding.request.source)
        || !structurallyEqual(receipt.incoming.identity, requestAst.definition.identity)
        || !structurallyEqual(receipt.incoming.source, requestAst.source)) return false;
      const resolution = preparedInput.requestResolutionLedger.filter(candidate =>
        candidate.route.occurrenceKey === receipt.route.occurrenceKey
        && (candidate.resolution.kind === 'resolved_exact' || candidate.resolution.kind === 'resolved_normalized'),
      );
      if (resolution.length !== 1) return false;
      const resolutionResult = resolution[0]!.resolution;
      if ((resolutionResult.kind !== 'resolved_exact' && resolutionResult.kind !== 'resolved_normalized')
        || !structurallyEqual(resolutionResult.request, receipt.request)) return false;
    }
  }
  return true;  },
});


export interface RequestTypeDerivationGroupReceiptsReplayVerificationInterface {
  readonly replay: (
    groups: readonly RequestTypeGroupReceipt[],
    judgmentGroups: readonly RequestType[],
  ) => boolean;
}

/** Independent replay operation exposed as a domain object for focused tests. */
export const requestTypeDerivationGroupReceiptsReplayVerification: RequestTypeDerivationGroupReceiptsReplayVerificationInterface = Object.freeze({
  replay: (
    groups: readonly RequestTypeGroupReceipt[],
    judgmentGroups: readonly RequestType[],
  ): boolean => {
  if (groups.length === 0) return false;
  const expectedPolicy = requestTypeDerivationContract.policy;
  if (expectedPolicy.actionContribution.kind !== 'merge_by_action_name'
    || expectedPolicy.responseContribution.kind !== 'merge_response'
    || expectedPolicy.groupContribution.chain !== 'each_before_equals_previous_after') return false;

  const allResults: RequestType[] = [];
  for (const group of groups) {
    if (group.contributions.length === 0) return false;
    if (!structurallyEqual(group.resultIdentity, group.result.identity)) return false;
    if (group.contributingRoutes.length !== group.contributions.length
      || group.contributingRequests.length !== group.contributions.length) return false;

    let previous: RequestTypeGroupContributionReceipt['before'] = { kind: 'group_absent' };
    for (let index = 0; index < group.contributions.length; index += 1) {
      const receipt = group.contributions[index]!;
      if (!structurallyEqual(group.contributingRoutes[index], receipt.route)
        || !structurallyEqual(group.contributingRequests[index], receipt.request)
        || !replayContribution(receipt, previous, index === 0)) return false;
      previous = receipt.after;
    }
    if (!structurallyEqual(previous, group.result)) return false;
    allResults.push(group.result);
  }
  return structurallyEqual(allResults, judgmentGroups);  },
});


export const requestTypeDerivationProofVerifier: RequestTypeDerivationProofVerificationInterface = Object.freeze({
  contract: requestTypeDerivationContract,
  verify: (inference: RequestTypeDerivationSemanticInferenceFor): RequestTypeDerivationSemanticVerificationFor => {
    const judgment = inference.judgment;
    // Inventory-to-AST identity is a prerequisite for every judgment, not only
    // conflict-ledger closure. Otherwise a forged canonical inventory can pass
    // through the successful contribution-replay branch without this check.
    if (!requestTypeDerivationInventoryAstVerification.matchesInput(inference.preparedInput)) {
      throw new RequestTypeDerivationSemanticProducerGapError(
        'verification',
        'prepared inventory identity does not match raw AST occurrences and provenance',
      );
    }

    if (judgment.kind === 'invalid_input') {
      throw new RequestTypeDerivationSemanticProducerGapError(
        'verification',
        'independent verification of typed invalid-input counterexamples',
      );
    }

    const proof = judgment.proof;
    if (requestTypeDerivationGroupReceiptsReplayVerification.replay(proof.groupReceipts, judgment.groups)
      && requestTypeDerivationIncomingSourceVerification.matchesInput(proof.groupReceipts, inference.preparedInput)
      && requestTypeDerivationIncomingContributionAstVerification.matchesAst(proof.groupReceipts, inference.preparedInput)
      && requestTypeDerivationGroupIdentityVerification.matchesInput(proof.groupReceipts, inference.preparedInput)) {
      return Object.freeze({
        contract: requestTypeDerivationContract,
        inference,
        result: Object.freeze({
          kind: 'verification_incomplete' as const,
          reason: 'group_contribution_replay_confirmed' as const,
          checkedEvidence: 'group_fold_receipt_replay' as const,
          missingLaws: REQUEST_TYPE_DERIVATION_LAW_IDS,
        }),
      });
    }

    if (judgment.kind === 'conflict'
      && requestTypeDerivationIdentityConflictLedgerVerification.matchesInput(inference)
      && requestTypeDerivationConflictLedgerClosureVerification.matchesInput(inference)
      && requestTypeDerivationConflictGroupVerification.matchesInput(inference)) {
      return Object.freeze({
        contract: requestTypeDerivationContract,
        inference,
        result: Object.freeze({
          kind: 'verification_incomplete' as const,
          reason: 'identity_conflict_ledger_confirmed' as const,
          checkedEvidence: 'duplicate_identity_occurrence_correlation' as const,
          missingLaws: REQUEST_TYPE_DERIVATION_LAW_IDS,
        }),
      });
    }

    throw new RequestTypeDerivationSemanticProducerGapError(
      'verification',
      'proof receipt replay failed or no independently checked law slice applies; inspect contribution before/incoming/after, final group output, and judgment output correlation',
    );
  },
});
