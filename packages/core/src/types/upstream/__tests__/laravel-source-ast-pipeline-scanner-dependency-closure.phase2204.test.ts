import { describe, expect, it } from 'vitest';
import {
  laravelSourceAstPipelineDependencies,
} from '../../../compiler/scanner/wiring/laravelSourceAstPipeline';
import { laravelControllerScanner } from '../../../compiler/scanner/wiring/laravelControllerScanner';
import { laravelResourceScanner } from '../../../compiler/scanner/wiring/laravelResourceScanner';
import { laravelResponseScanner } from '../../../compiler/scanner/subscanners/responseScanner';
import { laravelRouteScanner } from '../../../compiler/scanner/wiring/laravelRouteScanner';
import { routeControllerBindingAuthority } from '../../../compiler/semantic/routeControllerBindingAuthority';

describe('Laravel source-AST scanner dependency closure phase 2204', () => {
  it('composes existing scanner interfaces at the source-AST pipeline boundary', () => {
    expect(laravelSourceAstPipelineDependencies.controllerScanner).toBe(laravelControllerScanner);
    expect(laravelSourceAstPipelineDependencies.resourceScanner).toBe(laravelResourceScanner);
    expect(laravelSourceAstPipelineDependencies.responseScanner).toBe(laravelResponseScanner);
    expect(laravelSourceAstPipelineDependencies.routeScanner).toBe(laravelRouteScanner);
    expect(laravelSourceAstPipelineDependencies.routeScanner.bindingAuthority).toBe(routeControllerBindingAuthority);
  });

  it('passes the controller scanner’s bound response pipeline to response acquisition', () => {
    expect(laravelSourceAstPipelineDependencies.controllerScanner.responseSemanticPipeline)
      .toBe(laravelControllerScanner.responseSemanticPipeline);
  });
});
