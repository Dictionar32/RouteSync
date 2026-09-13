/**
 * Annotate Template Sub-Domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module cli/commands/annotate/template
 */

import { buildRoutePreamble } from './routePreamble';
import { buildResourceDiscoverySnippet } from './resourceDiscovery';
import { buildModelResolutionSnippet } from './modelResolution';

export function buildPhpDiscoveryScript(forceFlag: boolean): string {
    const forceStr = forceFlag ? 'true' : 'false';
    return buildRoutePreamble(forceStr) +
        buildResourceDiscoverySnippet() +
        buildModelResolutionSnippet();
}
