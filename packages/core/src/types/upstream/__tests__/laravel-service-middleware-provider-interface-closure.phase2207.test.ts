import { describe, expect, it } from 'vitest';
import { laravelSourceAstPipelineDependencies } from '../../../compiler/scanner/wiring/laravelSourceAstPipeline';

describe('Laravel service, middleware, and provider interface closure phase 2207', () => {
  it('publishes all three producers through explicit upstream interfaces', () => {
    expect(laravelSourceAstPipelineDependencies.serviceScanner).toMatchObject({
      kind: 'laravel_service_scanner', closed: true, contractVersion: 1,
    });
    expect(laravelSourceAstPipelineDependencies.middlewareScanner).toMatchObject({
      kind: 'laravel_middleware_scanner', closed: true, contractVersion: 1,
    });
    expect(laravelSourceAstPipelineDependencies.providerScanner).toMatchObject({
      kind: 'laravel_provider_scanner', closed: true, contractVersion: 1,
    });
  });

  it('exposes executable scanner contracts without moving orchestration back into the pipeline', () => {
    expect(laravelSourceAstPipelineDependencies.serviceScanner.scan).toBeTypeOf('function');
    expect(laravelSourceAstPipelineDependencies.middlewareScanner.scan).toBeTypeOf('function');
    expect(laravelSourceAstPipelineDependencies.providerScanner.scan).toBeTypeOf('function');
  });
});
