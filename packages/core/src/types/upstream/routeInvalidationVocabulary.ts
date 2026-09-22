import type { ResourceName } from './names';
import type { StringValue } from './valueObjects';
export const InvalidationTargetKind = Object.freeze({ SelfList:'self_list', ParentList:'parent_list', ParentDetail:'parent_detail', AuthResource:'auth_resource' } as const);
export type InvalidationTargetKind = typeof InvalidationTargetKind[keyof typeof InvalidationTargetKind];
export interface InvalidationTarget { readonly groupName: ResourceName; readonly kind: InvalidationTargetKind; readonly queryKeyExpression: StringValue; }
