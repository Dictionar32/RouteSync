import { describe, expect, it } from 'vitest';
import {
  laravelSourceAstPipelineDependencies,
} from '../../../compiler/scanner/wiring/laravelSourceAstPipeline';

describe('Laravel source-AST evidence producer contract closure phase 2206', () => {
  it('publishes migration, attribute, DTO inventory, and query producers through upstream contracts', () => {
    expect(laravelSourceAstPipelineDependencies.migrationScanner).toMatchObject({
      kind: 'laravel_migration_scanner', closed: true, contractVersion: 1,
    });
    expect(laravelSourceAstPipelineDependencies.attributeScanner).toMatchObject({
      kind: 'laravel_attribute_scanner', closed: true, contractVersion: 18,
    });
    expect(laravelSourceAstPipelineDependencies.dtoDeclarationInventoryScanner).toMatchObject({
      kind: 'laravel_dto_declaration_inventory_scanner', closed: true, contractVersion: 1,
    });
    expect(laravelSourceAstPipelineDependencies.queryProducer).toMatchObject({
      kind: 'laravel_query_producer', closed: true, contractVersion: 1,
    });
  });

  it('keeps the existing complete-or-incomplete DTO inventory as the producer result', () => {
    expect(laravelSourceAstPipelineDependencies.dtoDeclarationInventoryScanner.scan)
      .toBeTypeOf('function');
  });
});
