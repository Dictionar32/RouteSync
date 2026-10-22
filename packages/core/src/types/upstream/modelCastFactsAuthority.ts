import type { CastType } from './expression';
import type { ModelCast } from './model';
import type { ModelCastFactsAuthorityInterface, ModelCastSourceEvidence, ModelCastTargetSourceEvidence } from './modelCastFactsAuthorityInterface';

const castTargets: Readonly<{
  integer: CastType;
  float: CastType;
  boolean: CastType;
  string: CastType;
  datetime: CastType;
  date: CastType;
  timestamp: CastType;
  decimal: CastType;
  array: CastType;
  json: CastType;
  object: CastType;
  collection: CastType;
  encrypted: CastType;
  custom: CastType;
}> = Object.freeze({
  integer: { kind: 'integer' },
  float: { kind: 'float' },
  boolean: { kind: 'boolean' },
  string: { kind: 'string' },
  datetime: { kind: 'date_time' },
  date: { kind: 'date_time' },
  timestamp: { kind: 'date_time' },
  decimal: { kind: 'float' },
  array: { kind: 'json' },
  json: { kind: 'json' },
  object: { kind: 'json' },
  collection: { kind: 'json' },
  encrypted: { kind: 'string' },
  custom: { kind: 'string' },
});

const castKindFor = (rawTarget: string): keyof typeof castTargets => {
  const normalized = rawTarget.split(':')[0].replace(/^\\+|\\+$/g, '').trim().toLowerCase();
  const aliases: Readonly<Record<string, keyof typeof castTargets>> = Object.freeze({
    int: 'integer', integer: 'integer', real: 'float', float: 'float', double: 'float',
    bool: 'boolean', boolean: 'boolean', string: 'string',
    datetime: 'datetime', custom_datetime: 'datetime', date: 'date', immutable_date: 'date',
    timestamp: 'timestamp', decimal: 'decimal', array: 'array', asarrayobject: 'object',
    json: 'json', object: 'object', collection: 'collection', ascollection: 'collection',
    asenumcollection: 'collection', immutable_datetime: 'datetime', encrypted: 'encrypted', hashed: 'string',
  });
  return aliases[normalized] ?? 'custom';
};

const rawTargetValue = (target: ModelCastTargetSourceEvidence): string =>
  target.kind === 'literal_cast_target' ? target.value.value : target.className.value.value;

const castFrom = (evidence: ModelCastSourceEvidence): ModelCast => ({
  kind: 'model_cast',
  property: evidence.property,
  target: castTargets[castKindFor(rawTargetValue(evidence.target))],
  source: evidence.source,
});

export const modelCastFactsAuthority: ModelCastFactsAuthorityInterface = Object.freeze({
  kind: 'model_cast_facts_authority',
  contractVersion: 1,
  judge: input => Object.freeze(input.evidence.map(castFrom)),
});
