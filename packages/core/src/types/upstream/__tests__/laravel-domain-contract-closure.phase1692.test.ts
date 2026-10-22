import { describe, expectTypeOf, test } from 'vitest';
import type { LaravelDomainContract, LaravelSemanticContractCatalog } from '../highLevelContracts';
import type { SchemaInterface } from '../schema';
import type { MigrationInterface } from '../migrationInterface';
import type { DtoDefinition, MiddlewareDefinition, AttributeDefinition } from '../application';
import type { ChannelDefinition } from '../channel';
import type { Sequence } from '../collections';

type DomainKind = LaravelDomainContract['kind'];
type Includes<Kind extends DomainKind, Contract> = [Extract<LaravelDomainContract, { readonly kind: Kind }>] extends [never] ? false : Extract<LaravelDomainContract, { readonly kind: Kind }> extends Contract ? true : false;

describe('Phase 1692 Laravel domain contract closure', () => {
  test('catalog exposes closed schema and migration interfaces rather than raw definitions', () => {
    expectTypeOf<LaravelSemanticContractCatalog['schemas']>().toEqualTypeOf<Sequence<SchemaInterface>>();
    expectTypeOf<LaravelSemanticContractCatalog['migrations']>().toEqualTypeOf<Sequence<MigrationInterface>>();
  });

  test('the canonical Laravel domain union includes all scanned first-class domains', () => {
    expectTypeOf<Includes<'schema_interface', SchemaInterface>>().toEqualTypeOf<true>();
    expectTypeOf<Includes<'migration_interface', MigrationInterface>>().toEqualTypeOf<true>();
    expectTypeOf<Includes<'dto', DtoDefinition>>().toEqualTypeOf<true>();
    expectTypeOf<Includes<'middleware', MiddlewareDefinition>>().toEqualTypeOf<true>();
    expectTypeOf<Includes<'attribute', AttributeDefinition>>().toEqualTypeOf<true>();
    expectTypeOf<Includes<'channel', ChannelDefinition>>().toEqualTypeOf<true>();
  });

});
