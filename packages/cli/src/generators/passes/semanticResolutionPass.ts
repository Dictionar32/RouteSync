/**
 * Semantic Resolution Pass.
 * Resolves resource and route assignments via SemanticResolutionKernel.
 *
 * @module cli/generators/passes
 */

import type { RouteManifest, SemanticResolutionKernel } from '@routesync/core';
import { PhpCodeParser } from '../../parsers/PhpCodeParser';
import type { CompilerPass, CompilerContext } from '../pipeline';
import type {
    SemanticNode,
    RuntimeAugmented,
    ResolutionContext
} from '../normalizer';

export class SemanticResolutionPass implements CompilerPass<{ manifest: RouteManifest; kernel: SemanticResolutionKernel }, RouteManifest> {
    readonly id = "semantic-resolver";
    readonly name = "SemanticResolution";
    readonly inputKind = "ResolvedManifest";
    readonly outputKind = "ResolvedManifest";

    run(input: { manifest: RouteManifest; kernel: SemanticResolutionKernel }, context: CompilerContext): RouteManifest {
        const { manifest, kernel } = input;

        // 1. Resolve resources assignments
        if (manifest.resources) {
            manifest.resources.forEach(res => {
                const parsedAssignments: Record<string, unknown> = {};
                const resolvedAssignments: Record<string, SemanticNode> = {};
                const resolutionContext: ResolutionContext = {
                    layer: 'resource',
                    fileName: res.name,
                    modelMap: {},
                    relationMap: {},
                    assignments: parsedAssignments,
                    resolvedAssignments: resolvedAssignments
                };

                if (res.assignments) {
                    for (const varName in res.assignments) {
                        const code = res.assignments[varName];
                        const ast = PhpCodeParser.parseExpression(code, {});
                        parsedAssignments[varName] = ast;
                        const resolved = kernel.resolve(ast, resolutionContext);
                        if (resolved && resolved.status !== 'unknown') {
                            resolvedAssignments[varName] = resolved as SemanticNode;
                        }
                    }
                }

                const patchField = (field: RuntimeAugmented) => {
                    if (!field) return;
                    if (field.kind === 'object' && field.fields) {
                        Object.values(field.fields).forEach(f => patchField(f as RuntimeAugmented));
                    } else {
                        const meta = field.resolved || field.semantic;
                        const ast = field.parsed_ast || (field.node && (field.node as RuntimeAugmented).parsed_ast)
                            || (field.kind && field.kind !== 'object' && field.kind !== 'raw_code' ? field : null);
                        if ((!meta || meta.status === 'unknown' || meta.type === 'unknown') && ast) {
                            const resolved = kernel.resolve(ast, resolutionContext);
                            if (resolved && resolved.status !== 'unknown') {
                                field.resolved = resolved;
                            }
                        }
                    }
                };

                Object.values(res.fields).forEach((field: unknown) => {
                    patchField(field as RuntimeAugmented);
                });
            });
        }

        // 2. Resolve routes assignments
        if (manifest.routes) {
            manifest.routes.forEach(route => {
                const parsedAssignments: Record<string, unknown> = {};
                const resolvedAssignments: Record<string, SemanticNode> = {};
                const resolutionContext: ResolutionContext = {
                    layer: 'route',
                    fileName: route.name,
                    modelMap: {},
                    relationMap: {},
                    assignments: parsedAssignments,
                    resolvedAssignments: resolvedAssignments
                };

                if (route.assignments) {
                    for (const varName in route.assignments) {
                        const code = route.assignments[varName];
                        const ast = PhpCodeParser.parseExpression(code, {});
                        parsedAssignments[varName] = ast;
                        const resolved = kernel.resolve(ast, resolutionContext);
                        if (resolved && resolved.status !== 'unknown') {
                            resolvedAssignments[varName] = resolved as SemanticNode;
                        }
                    }
                }

                const resolveResponse = (meta: unknown) => {
                    if (!meta) return;
                    const augmentedMeta = meta as RuntimeAugmented;
                    if (augmentedMeta.kind === 'object' && augmentedMeta.fields) {
                        Object.values(augmentedMeta.fields).forEach((field: unknown) => {
                            const augmentedField = field as RuntimeAugmented;
                            const ast = augmentedField.parsed_ast || (augmentedField.node && (augmentedField.node as RuntimeAugmented).parsed_ast)
                                || (augmentedField.kind && augmentedField.kind !== 'object' && augmentedField.kind !== 'raw_code' ? augmentedField : null);
                            if (ast) {
                                const resolved = kernel.resolve(ast, resolutionContext);
                                if (resolved && resolved.status !== 'unknown') {
                                    augmentedField.resolved = resolved;
                                }
                            }
                            resolveResponse(field);
                        });
                    }
                };
                resolveResponse(route.response);
            });
        }

        return manifest;
    }
}
