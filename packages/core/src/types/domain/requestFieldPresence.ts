export interface RequestFieldPresenceVisitor<T> {
  readonly required: (presence: RequiredRequestFieldPresence) => T;
  readonly optional: (presence: OptionalRequestFieldPresence) => T;
  readonly unspecified: (presence: UnspecifiedRequestFieldPresence) => T;
}

export interface RequiredRequestFieldPresence {
  readonly kind: 'required';
  readonly nullable: boolean;
  readonly source: 'declared' | 'inferred';
  readonly accept: <T>(visitor: RequestFieldPresenceVisitor<T>) => T;
}

export interface OptionalRequestFieldPresence {
  readonly kind: 'optional';
  readonly nullable: boolean;
  readonly source: 'declared' | 'inferred';
  readonly accept: <T>(visitor: RequestFieldPresenceVisitor<T>) => T;
}

/**
 * Presence is not specified by the source rules.
 * This is an explicit semantic state, never a signal to invent optional/required.
 */
export interface UnspecifiedRequestFieldPresence {
  readonly kind: 'unspecified';
  readonly accept: <T>(visitor: RequestFieldPresenceVisitor<T>) => T;
}

export type RequestFieldPresence =
  | RequiredRequestFieldPresence
  | OptionalRequestFieldPresence
  | UnspecifiedRequestFieldPresence;

class RequiredPresence implements RequiredRequestFieldPresence {
  readonly kind = 'required' as const;
  constructor(readonly nullable: boolean, readonly source: 'declared' | 'inferred') { Object.freeze(this); }
  readonly accept = <T>(visitor: RequestFieldPresenceVisitor<T>): T => visitor.required(this);
}

class OptionalPresence implements OptionalRequestFieldPresence {
  readonly kind = 'optional' as const;
  constructor(readonly nullable: boolean, readonly source: 'declared' | 'inferred') { Object.freeze(this); }
  readonly accept = <T>(visitor: RequestFieldPresenceVisitor<T>): T => visitor.optional(this);
}

class UnspecifiedPresence implements UnspecifiedRequestFieldPresence {
  readonly kind = 'unspecified' as const;
  readonly accept = <T>(visitor: RequestFieldPresenceVisitor<T>): T => visitor.unspecified(this);
}

const unspecified = new UnspecifiedPresence();

export const RequestFieldPresenceFactory = Object.freeze({
  required: (nullable: boolean, source: 'declared' | 'inferred' = 'declared'): RequestFieldPresence => new RequiredPresence(nullable, source),
  optional: (nullable: boolean, source: 'declared' | 'inferred' = 'declared'): RequestFieldPresence => new OptionalPresence(nullable, source),
  unspecified: (): RequestFieldPresence => unspecified
});
