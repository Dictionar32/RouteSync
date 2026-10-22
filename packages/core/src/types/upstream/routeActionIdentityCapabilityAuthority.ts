import { createActionName } from './names';
import type {
  RouteActionIdentityCandidate,
  RouteActionIdentityCapabilityContract,
  RouteActionIdentityCapabilityInterface,
  RouteActionIdentityResolution,
} from './routeActionIdentityCapability';

export const routeActionIdentityCapabilityAuthority: RouteActionIdentityCapabilityInterface = Object.freeze({
  kind: 'route_action_identity_capability_interface',
  closed: true,
  resolve(candidates: readonly RouteActionIdentityCandidate[], groupAliases?: Readonly<Record<string, string>>): RouteActionIdentityCapabilityContract {
    const routeKeys = new Set<string>();
    for (const candidate of candidates) {
      if (routeKeys.has(candidate.routeKey)) {
        throw new Error(`Duplicate route identity key in upstream capability: ${candidate.routeKey}`);
      }
      routeKeys.add(candidate.routeKey);
    }
    const orderedCandidates = [...candidates].sort((left, right) =>
      left.routeKey < right.routeKey ? -1 : left.routeKey > right.routeKey ? 1 : 0,
    );
    const usedByGroup = new Map<string, Set<string>>();
    const resolutions: RouteActionIdentityResolution[] = [];

    for (const candidate of orderedCandidates) {

      const groupName = groupAliases?.[candidate.sourceGroupName] ?? candidate.sourceGroupName;
      const used = usedByGroup.get(groupName) ?? new Set<string>();
      usedByGroup.set(groupName, used);

      const baseName = candidate.actionName.value.value;
      let resolvedName = baseName;
      let suffix = 2;
      while (used.has(resolvedName)) {
        resolvedName = `${baseName}${suffix}`;
        suffix += 1;
      }
      used.add(resolvedName);
      resolutions.push(Object.freeze({
        kind: 'route_action_identity_resolution',
        routeKey: candidate.routeKey,
        groupName,
        actionName: createActionName(resolvedName),
        closed: true,
      }));
    }

    return Object.freeze({
      kind: 'route_action_identity_capability_contract',
      closed: true,
      resolutions: Object.freeze(resolutions),
    });
  },
});
