import type { ResourceName } from './names';
import type { StringValue } from './valueObjects';
export interface InvalidationTargetKindInterface {
  readonly SelfList: 'self_list';
  readonly ParentList: 'parent_list';
  readonly ParentDetail: 'parent_detail';
  readonly AuthResource: 'auth_resource';
}

export const InvalidationTargetKind: InvalidationTargetKindInterface = Object.freeze({ SelfList:'self_list', ParentList:'parent_list', ParentDetail:'parent_detail', AuthResource:'auth_resource' });
export type InvalidationTargetKind = typeof InvalidationTargetKind[keyof typeof InvalidationTargetKind];
export interface InvalidationTarget { readonly groupName: ResourceName; readonly kind: InvalidationTargetKind; readonly queryKeyExpression: StringValue; }
