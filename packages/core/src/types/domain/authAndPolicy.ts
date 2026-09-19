import type { CrudRole } from "./lifecycle";

/**
 * Canonical Domain Vocabulary for Route Authentication Schemes.
 */
export const SecuritySchemeKind = Object.freeze({
  Sanctum: 'sanctum',
  Bearer: 'bearer',
  Cookie: 'cookie',
  Public: 'public'
} as const);

export type SecuritySchemeKind = typeof SecuritySchemeKind[keyof typeof SecuritySchemeKind];

/**
 * First-Class Route Security & Authentication Descriptor (Guaranteed Complete Model).
 * Eliminates downstream middleware.some(m => m.startsWith('auth')).
 */
export interface RouteSecurityDescriptor {
  readonly isProtected: boolean;
  readonly scheme: SecuritySchemeKind;
  readonly guards: readonly string[];
  readonly abilities: readonly string[]; // ✅ Dedicated Sanctum/Passport Abilities SSOT
}

export interface ScannedRouteSecurityParams {
  readonly isProtected: boolean;
  readonly scheme: SecuritySchemeKind;
  readonly guards: readonly string[];
  readonly abilities: readonly string[];
}

/**
 * Reusable Constructor: Scanned Route Security Descriptor.
 */
export class ScannedRouteSecurityDescriptor implements RouteSecurityDescriptor {
  public readonly isProtected: boolean;
  public readonly scheme: SecuritySchemeKind;
  public readonly guards: readonly string[];
  public readonly abilities: readonly string[];

  constructor(params: ScannedRouteSecurityParams) {
    this.isProtected = params.isProtected;
    this.scheme = params.scheme;
    this.guards = Object.freeze([...params.guards]);
    this.abilities = Object.freeze([...params.abilities]);
    Object.freeze(this);
  }

  public static create({
    isProtected = false,
    scheme = SecuritySchemeKind.Public,
    guards = [],
    abilities = []
  }: {
    readonly isProtected?: boolean;
    readonly scheme?: SecuritySchemeKind;
    readonly guards?: readonly string[];
    readonly abilities?: readonly string[];
  } = {}): ScannedRouteSecurityDescriptor {
    return new ScannedRouteSecurityDescriptor({
      isProtected,
      scheme,
      guards,
      abilities
    });
  }

  public static public(): ScannedRouteSecurityDescriptor {
    return new ScannedRouteSecurityDescriptor({
      isProtected: false,
      scheme: SecuritySchemeKind.Public,
      guards: [],
      abilities: []
    });
  }

  public static protected(
    scheme: SecuritySchemeKind = SecuritySchemeKind.Bearer,
    guards: readonly string[] = [],
    abilities: readonly string[] = []
  ): ScannedRouteSecurityDescriptor {
    return new ScannedRouteSecurityDescriptor({
      isProtected: true,
      scheme,
      guards,
      abilities
    });
  }
}

export class RouteSecurityClassifier {
  public static classify(middleware: readonly string[]): RouteSecurityDescriptor {
    const guards: string[] = [];
    const abilities: string[] = [];
    let isProtected = false;
    let scheme: SecuritySchemeKind = SecuritySchemeKind.Public;

    for (const m of middleware) {
      const trimmed = m.trim();
      const lower = trimmed.toLowerCase();
      if (lower === 'auth:sanctum') {
        isProtected = true;
        scheme = SecuritySchemeKind.Sanctum;
        guards.push('sanctum');
      } else if (lower === 'auth:api' || lower === 'auth:bearer') {
        isProtected = true;
        scheme = SecuritySchemeKind.Bearer;
        guards.push('api');
      } else if (lower === 'auth' || lower.startsWith('auth:')) {
        isProtected = true;
        scheme = SecuritySchemeKind.Cookie;
        guards.push('web');
      } else if (lower.startsWith('ability:') || lower.startsWith('abilities:')) {
        const colonIdx = trimmed.indexOf(':');
        const items = trimmed.slice(colonIdx + 1).split(',').map(s => s.trim()).filter(Boolean);
        abilities.push(...items);
      } else if (lower.startsWith('role:') || lower.startsWith('roles:')) {
        const colonIdx = trimmed.indexOf(':');
        const items = trimmed.slice(colonIdx + 1).split(',').map(s => s.trim()).filter(Boolean);
        abilities.push(...items.map(r => `role:${r}`));
      } else if (lower === 'admin' || lower === 'superadmin') {
        abilities.push(`role:${lower}`);
      }
    }

    return new ScannedRouteSecurityDescriptor({
      isProtected,
      scheme,
      guards,
      abilities
    });
  }
}

export type AuthorizationHeaderName =
  | { readonly kind: 'authorization'; readonly value: 'Authorization' }
  | { readonly kind: 'none' };

export interface SecuritySchemeSpecification<K extends SecuritySchemeKind = SecuritySchemeKind> {
  readonly scheme: K;
  readonly isProtected: boolean;
  readonly requiresAuthorizationHeader: boolean;
  readonly defaultHeaderName: AuthorizationHeaderName;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key SecuritySchemeKind.
 */
export type SecuritySchemeRegistry = {
  readonly [K in SecuritySchemeKind]: SecuritySchemeSpecification<K>;
};

export const SECURITY_SCHEME_REGISTRY: SecuritySchemeRegistry = Object.freeze({
  [SecuritySchemeKind.Sanctum]: {
    scheme: SecuritySchemeKind.Sanctum,
    isProtected: true,
    requiresAuthorizationHeader: true,
    defaultHeaderName: { kind: 'authorization', value: 'Authorization' },
  },
  [SecuritySchemeKind.Bearer]: {
    scheme: SecuritySchemeKind.Bearer,
    isProtected: true,
    requiresAuthorizationHeader: true,
    defaultHeaderName: { kind: 'authorization', value: 'Authorization' },
  },
  [SecuritySchemeKind.Cookie]: {
    scheme: SecuritySchemeKind.Cookie,
    isProtected: true,
    requiresAuthorizationHeader: false,
    defaultHeaderName: { kind: 'none' },
  },
  [SecuritySchemeKind.Public]: {
    scheme: SecuritySchemeKind.Public,
    isProtected: false,
    requiresAuthorizationHeader: false,
    defaultHeaderName: { kind: 'none' },
  },
});

export interface RouteSecurityVisitor<R> {
  readonly sanctum: (security: RouteSecurityDescriptor) => R;
  readonly bearer: (security: RouteSecurityDescriptor) => R;
  readonly cookie: (security: RouteSecurityDescriptor) => R;
  readonly public: (security: RouteSecurityDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik skema keamanan RouteSecurityDescriptor dengan exhaustive type safety
 */
export function matchRouteSecurity<R>(
  security: RouteSecurityDescriptor,
  visitor: RouteSecurityVisitor<R>
): R {
  return visitor[security.scheme](security);
}


/**
 * RateLimitDescriptor
 *
 * Explicit Domain Model for Laravel Route Rate Limiting (throttle middleware).
 */
export interface RateLimitDescriptor {
  readonly maxAttempts: number;
  readonly decayMinutes: number;
}


/**
 * RoutePolicyKind
 *
 * Canonical ADT discriminator for Laravel route authorization policies.
 */
export const RoutePolicyKind = Object.freeze({
  AbilityModel: 'ability_model',
  Gate: 'gate',
  Custom: 'custom'
} as const);

export type RoutePolicyKind = typeof RoutePolicyKind[keyof typeof RoutePolicyKind];

export interface RoutePolicyKindSpecification<K extends RoutePolicyKind = RoutePolicyKind> {
  readonly kind: K;
  readonly requiresModel: boolean;
  readonly description: string;
}

export type RoutePolicyKindRegistry = {
  readonly [K in RoutePolicyKind]: RoutePolicyKindSpecification<K>;
};

export const ROUTE_POLICY_REGISTRY: RoutePolicyKindRegistry = Object.freeze({
  [RoutePolicyKind.AbilityModel]: {
    kind: RoutePolicyKind.AbilityModel,
    requiresModel: true,
    description: 'Laravel Model Policy checking ability against a model parameter'
  },
  [RoutePolicyKind.Gate]: {
    kind: RoutePolicyKind.Gate,
    requiresModel: false,
    description: 'Laravel Gate authorization checking ability without model parameter'
  },
  [RoutePolicyKind.Custom]: {
    kind: RoutePolicyKind.Custom,
    requiresModel: false,
    description: 'Custom authorization policy or middleware rule'
  }
});

export type RoutePolicyDescriptor =
  | {
      readonly kind: typeof RoutePolicyKind.AbilityModel;
      readonly ability: import('./semanticValues').AbilityName;
      readonly modelParameter: import('./semanticValues').PropertyName;
    }
  | {
      readonly kind: typeof RoutePolicyKind.Gate;
      readonly ability: import('./semanticValues').AbilityName;
      readonly modelParameter: { readonly kind: 'none' };
    }
  | {
      readonly kind: typeof RoutePolicyKind.Custom;
      readonly ability: import('./semanticValues').AbilityName;
      readonly modelParameter: { readonly kind: 'none' } | { readonly kind: 'parameter'; readonly name: import('./semanticValues').PropertyName };
    };

export interface RoutePolicyVisitor<R> {
  readonly ability_model: (desc: Extract<RoutePolicyDescriptor, { readonly kind: typeof RoutePolicyKind.AbilityModel }>) => R;
  readonly gate: (desc: Extract<RoutePolicyDescriptor, { readonly kind: typeof RoutePolicyKind.Gate }>) => R;
  readonly custom: (desc: Extract<RoutePolicyDescriptor, { readonly kind: typeof RoutePolicyKind.Custom }>) => R;
}

export function matchRoutePolicy<R>(
  policy: RoutePolicyDescriptor,
  visitor: RoutePolicyVisitor<R>
): R {
  switch (policy.kind) {
    case RoutePolicyKind.AbilityModel:
      return visitor.ability_model(policy);
    case RoutePolicyKind.Gate:
      return visitor.gate(policy);
    case RoutePolicyKind.Custom:
      return visitor.custom(policy);
  }
}
