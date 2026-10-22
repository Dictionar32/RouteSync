import type { ActionName } from './names';

export interface RouteActionIdentityCandidate {
  readonly kind: 'route_action_identity_candidate';
  readonly routeKey: string;
  readonly sourceGroupName: string;
  readonly actionName: ActionName;
  readonly closed: true;
}

export interface RouteActionIdentityResolution {
  readonly kind: 'route_action_identity_resolution';
  readonly routeKey: string;
  readonly groupName: string;
  readonly actionName: ActionName;
  readonly closed: true;
}

export interface RouteActionIdentityCapabilityContract {
  readonly kind: 'route_action_identity_capability_contract';
  readonly closed: true;
  readonly resolutions: readonly RouteActionIdentityResolution[];
}

export interface RouteActionIdentityCapabilityInterface {
  readonly kind: 'route_action_identity_capability_interface';
  readonly closed: true;
  resolve(
    candidates: readonly RouteActionIdentityCandidate[],
    groupAliases?: Readonly<Record<string, string>>,
  ): RouteActionIdentityCapabilityContract;
}
