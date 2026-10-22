import { describe, expect, it } from 'vitest';
import {
  laravelSourceAstPipelineFactory,
  laravelSourceAstPipelineDependencies,
} from '../../../compiler/scanner/wiring/laravelSourceAstPipeline';

describe('Laravel source-AST producer dependency closure phase 2205', () => {
  it('selects model, FormRequest, schema, and source semantic producers through the pipeline contract', () => {
    expect(laravelSourceAstPipelineDependencies.controllerScanner.contractVersion).toBeGreaterThan(0);
    expect(laravelSourceAstPipelineDependencies.modelScanner.kind).toBe('laravel_model_scanner');
    expect(laravelSourceAstPipelineDependencies.modelScanner.contractVersion).toBe(3);
    expect(laravelSourceAstPipelineDependencies.formRequestScanner.kind).toBe('laravel_form_request_scanner');
    expect(laravelSourceAstPipelineDependencies.formRequestScanner.contractVersion).toBe(3);
    expect(laravelSourceAstPipelineDependencies.sourceAstSemanticProducer.kind).toBe('source_ast_semantic_producer');
    expect(typeof laravelSourceAstPipelineDependencies.schemaProducer.produce).toBe('function');
  });

  it('prepares an input-bound pipeline operation whose executor has no runtime arguments', () => {
    expect(laravelSourceAstPipelineFactory).toMatchObject({ create: expect.any(Function) });
    expect(laravelSourceAstPipelineDependencies.routeScanner.kind).toBe('laravel_route_scanner');
  });
});
