/**
 * Annotate Template Sub-Domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module cli/commands/annotate/template
 */

import { routePreambleTemplateOperations } from './routePreamble';
import { resourceDiscoveryTemplateOperations } from './resourceDiscovery';
import { modelResolutionTemplateOperations } from './modelResolution';

function buildPhpDiscoveryScript(forceFlag: boolean): string {
    const forceStr = forceFlag ? 'true' : 'false';
    return routePreambleTemplateOperations.build(forceStr) +
        resourceDiscoveryTemplateOperations.build() +
        modelResolutionTemplateOperations.build();
}

export interface PhpDiscoveryTemplateOperationsInterface {
  readonly build: (forceFlag: boolean) => string;
}

export const phpDiscoveryTemplateOperations: PhpDiscoveryTemplateOperationsInterface = Object.freeze({
  build: buildPhpDiscoveryScript,
});
