import type { ClassName, EnumName, ModelName, RouteParameterName } from './names';
import type { RouteBindingWithTrashed, RouteBindingKey } from './routeBinding';
import type { Presence } from './presence';

export interface RouteActionParameterContract {
  readonly parameter: RouteParameterName;
  readonly type: Presence<ClassName>;
}

export type ResolvedRouteBindingKind = 'parameter' | 'implicit_model' | 'implicit_enum';

export type RouteBindingScoping =
  | { readonly kind: 'none' }
  | { readonly kind: 'scoped'; readonly reason: 'custom_key' | 'scope_bindings' }
  | { readonly kind: 'disabled' };

export type ResolvedRouteBindingContract =
  | {
      readonly parameter: RouteParameterName;
      readonly parent: Presence<RouteParameterName>;
      readonly key: RouteBindingKey;
      readonly withTrashed: RouteBindingWithTrashed;
      readonly kind: 'parameter';
      readonly model: { readonly kind: 'absent' };
      readonly enum: { readonly kind: 'absent' };
      readonly scoping: RouteBindingScoping;
    }
  | {
      readonly parameter: RouteParameterName;
      readonly parent: Presence<RouteParameterName>;
      readonly key: RouteBindingKey;
      readonly withTrashed: RouteBindingWithTrashed;
      readonly kind: 'implicit_model';
      readonly model: { readonly kind: 'present'; readonly value: ModelName };
      readonly enum: { readonly kind: 'absent' };
      readonly scoping: RouteBindingScoping;
    }
  | {
      readonly parameter: RouteParameterName;
      readonly parent: Presence<RouteParameterName>;
      readonly key: RouteBindingKey;
      readonly withTrashed: RouteBindingWithTrashed;
      readonly kind: 'implicit_enum';
      readonly model: { readonly kind: 'absent' };
      readonly enum: { readonly kind: 'present'; readonly value: EnumName };
      readonly scoping: RouteBindingScoping;
    };
