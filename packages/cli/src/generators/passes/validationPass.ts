/**
 * Validation Pass.
 * Validates route symbols, actions, and model bindings.
 *
 * @module cli/generators/passes
 */

import type { CompilerPass, CompilerContext } from '../pipeline';
import type { NormalizedManifest } from '../normalizer';

export class ValidationPass implements CompilerPass<NormalizedManifest, NormalizedManifest> {
    readonly id = "validator";
    readonly name = "Validation";
    readonly inputKind = "NormalizedManifest";
    readonly outputKind = "NormalizedManifest";

    run(manifest: NormalizedManifest, context: CompilerContext): NormalizedManifest {
        // 1. Validate route symbols and actions
        manifest.routes.forEach(route => {
            if (!route.controllerName) {
                context.reportDiagnostic({
                    severity: "warning",
                    message: `Route "${route.uri}" does not specify a controller name.`,
                    loc: route.loc
                });
            }
        });

        // 2. Validate resource models exist
        const modelNames = new Set(manifest.models.map(m => m.name));
        manifest.resources.forEach(res => {
            const modelName = res.name.replace(/Resource$/, '');
            if (modelName && !modelNames.has(modelName)) {
                context.reportDiagnostic({
                    severity: "info",
                    message: `Resource "${res.name}" does not have a matching Eloquent model "${modelName}".`,
                    loc: res.loc
                });
            }
        });

        return manifest;
    }
}
