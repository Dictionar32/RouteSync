import type { TokenDescriptor } from './phpAstCoreTypes';
import { relationFold, relationNone, relationSome, relationOptionFold, relationGate, type RelationOption } from '../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../semantic/kernel/semanticRelations';

export type TokenIndex = number;

/** Closed lexical evidence interface. Token absence is an explicit relation result. */
export type TokenEvidence = Readonly<{
  readonly index: number;
  readonly token: TokenDescriptor;
}>;

export type TokenEvidenceJudgment =
  | Readonly<{ readonly kind: 'token_present'; readonly evidence: TokenEvidence }>
  | Readonly<{ readonly kind: 'token_absent'; readonly index: number }>
  | Readonly<{ readonly kind: 'token_value'; readonly index: number; readonly value: string }>
  | Readonly<{ readonly kind: 'token_kind'; readonly index: number; readonly tokenKind: TokenDescriptor['type'] }>;

export type TokenEvidenceInterface = Readonly<{
  readonly kind: 'token_evidence_interface';
  readonly tokens: readonly TokenDescriptor[];
  readonly judgment: TokenEvidenceJudgment;
  readonly closed: true;
}>;

export const tokenAt = (tokens: readonly TokenDescriptor[], index: TokenIndex): RelationOption<TokenEvidence> =>
  relationFold(tokens, relationNone<TokenEvidence>(), (state, token, cursor) =>
    relationGate(relationEqual(cursor, index), () => relationSome({ index: cursor, token }), () => state),
  );

export const tokenValueAt = (tokens: readonly TokenDescriptor[], index: TokenIndex): RelationOption<string> =>
  relationOptionFold(tokenAt(tokens, index), () => relationNone<string>(), evidence => relationSome(evidence.token.value));

export const tokenKindAt = (tokens: readonly TokenDescriptor[], index: TokenIndex): RelationOption<TokenDescriptor['type']> =>
  relationOptionFold(tokenAt(tokens, index), () => relationNone<TokenDescriptor['type']>(), evidence => relationSome(evidence.token.type));

export const tokenValueEquals = (tokens: readonly TokenDescriptor[], index: TokenIndex, value: string): boolean =>
  relationOptionFold(tokenValueAt(tokens, index), () => false, current => relationEqual(current, value));

export const tokenKindEquals = (tokens: readonly TokenDescriptor[], index: TokenIndex, kind: TokenDescriptor['type']): boolean =>
  relationOptionFold(tokenKindAt(tokens, index), () => false, current => relationEqual(current, kind));

export const tokenValueOr = (tokens: readonly TokenDescriptor[], index: TokenIndex, fallback = ''): string =>
  relationOptionFold(tokenValueAt(tokens, index), () => fallback, value => value);

export const tokenKindOr = (tokens: readonly TokenDescriptor[], index: TokenIndex, fallback: TokenDescriptor['type']): TokenDescriptor['type'] =>
  relationOptionFold(tokenKindAt(tokens, index), () => fallback, value => value);

export const tokenEvidenceInterfaceAt = (tokens: readonly TokenDescriptor[], index: TokenIndex): TokenEvidenceInterface =>
  relationOptionFold(
    tokenAt(tokens, index),
    () => ({ kind: 'token_evidence_interface', tokens, judgment: { kind: 'token_absent', index }, closed: true }),
    evidence => ({ kind: 'token_evidence_interface', tokens, judgment: { kind: 'token_present', evidence }, closed: true }),
  );
