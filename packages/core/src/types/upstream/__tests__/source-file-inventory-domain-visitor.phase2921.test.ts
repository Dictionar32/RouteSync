import { describe, expect, it } from 'vitest';
import { sourceFileInventoryFactory, stringValue, sourceFileIdentityFactory } from '../names';

describe('SourceFileInventory ordered domain projection', () => {
  it('projects source files in insertion order without a generic continuation', () => {
    const inventory = sourceFileInventoryFactory.empty()
      .include(sourceFileIdentityFactory.create(stringValue.create('/project/first.php')))
      .include(sourceFileIdentityFactory.create(stringValue.create('/project/second.php')))
      .include(sourceFileIdentityFactory.create(stringValue.create('/project/third.php')));
    expect(inventory.toSourceFiles().map(sourceFile => sourceFile.value.value)).toEqual([
      '/project/first.php',
      '/project/second.php',
      '/project/third.php',
    ]);
  });

  it('projects no source for an empty inventory', () => {
    expect(sourceFileInventoryFactory.empty().toSourceFiles()).toEqual([]);
  });

  it('projects ordered source-file evidence through a domain operation', () => {
    const inventory = sourceFileInventoryFactory.empty()
      .include(sourceFileIdentityFactory.create(stringValue.create('/project/first.php')))
      .include(sourceFileIdentityFactory.create(stringValue.create('/project/second.php')));

    expect(inventory.toSourceFiles().map(sourceFile => sourceFile.value.value)).toEqual([
      '/project/first.php',
      '/project/second.php',
    ]);
    expect(sourceFileInventoryFactory.empty().toSourceFiles()).toEqual([]);
  });

  it('formats the inventory through its ordered projection', () => {
    const inventory = sourceFileInventoryFactory.empty()
      .include(sourceFileIdentityFactory.create(stringValue.create('/project/first.php')))
      .include(sourceFileIdentityFactory.create(stringValue.create('/project/second.php')));

    expect(inventory.format(stringValue.create(', ')).value).toBe('/project/first.php, /project/second.php');
  });
});



  it('continues through empty and populated inventories without discriminator checks', () => {
    const empty = sourceFileInventoryFactory.empty();
    const populated = empty.include(sourceFileIdentityFactory.create(stringValue.create('/project/routes.php')));

    expect(empty.continueWith({
      onEmpty: () => 'empty',
      onSource: () => 'source',
    })).toBe('empty');
    expect(populated.continueWith({
      onEmpty: () => 'empty',
      onSource: sourceFile => sourceFile.value.value,
    })).toBe('/project/routes.php');
  });

describe('SourceFileInventory source identity operations', () => {
  it('returns an explicit identity-cardinality judgment for absent, unique and duplicate identities', () => {
    const first = sourceFileIdentityFactory.create(stringValue.create('/project/routes.php'));
    const samePath = sourceFileIdentityFactory.create(stringValue.create('/project/routes.php'));
    const other = sourceFileIdentityFactory.create(stringValue.create('/project/api.php'));
    const missing = sourceFileIdentityFactory.create(stringValue.create('/project/missing.php'));
    const inventory = sourceFileInventoryFactory.empty().include(first).include(samePath).include(other);

    expect(inventory.identityCardinalityAs(missing).continueWith({
      onNoMatch: () => 'no-match', onOneMatch: () => 'one-match', onMultipleMatches: () => 'multiple-matches',
    })).toBe('no-match');
    expect(inventory.identityCardinalityAs(other).continueWith({
      onNoMatch: () => 'no-match', onOneMatch: () => 'one-match', onMultipleMatches: () => 'multiple-matches',
    })).toBe('one-match');
    expect(inventory.identityCardinalityAs(first).continueWith({
      onNoMatch: () => 'no-match', onOneMatch: () => 'one-match', onMultipleMatches: () => 'multiple-matches',
    })).toBe('multiple-matches');
  });

  it('projects duplicate identity entries through a domain operation', () => {
    const first = sourceFileIdentityFactory.create(stringValue.create('/project/routes.php'));
    const samePath = sourceFileIdentityFactory.create(stringValue.create('/project/routes.php'));
    const other = sourceFileIdentityFactory.create(stringValue.create('/project/api.php'));
    const duplicates = sourceFileInventoryFactory.empty().include(first).include(samePath).include(other).duplicateIdentities();
    expect(duplicates.toSourceFiles().map(sourceFile => sourceFile.value.value)).toEqual(['/project/routes.php', '/project/routes.php']);
  });
});
