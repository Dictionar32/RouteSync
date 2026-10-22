import { createControllerName, createSourceFile } from '../../../types/upstream/names';
import type { ClassName } from '../../../types/upstream/names';
import { legacyLaravelControllerExecutionDependencies } from './laravelControllerExecutionDependencies';
import path from 'path';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import type { ControllerDeclarationEvidence, ControllerMethodEvidence } from '../../../types/upstream/controllerEvidence';
import type { QueryAst } from '../../../types/upstream/query';
import { createAstIdentifier } from '../lexer/phpAstTypes';
import type { LaravelControllerInvocationSemanticJudgmentInterface } from '../../../types/upstream/laravelControllerInvocationSemanticJudgmentInterface';
import { controllerActionProjectionMigration } from '../../../types/upstream/laravelControllerActionSemanticJudgmentInterface';
import type { ControllerResourceBindingEvidence, LaravelControllerScannerInterface, LaravelControllerScanInput, LaravelControllerScanJudgment, LaravelControllerScanArtifact } from '../../../types/upstream/laravelControllerScannerInterface';
import type { LaravelControllerResponseSemanticPipelineInterface } from '../../../types/upstream/laravelControllerResponseSemanticJudgmentInterface';
import { laravelControllerResponseSemanticPipeline } from '../../../types/upstream/laravelControllerResponseSemanticPipeline';
import { controllerPolicyInventoryFromDeclaration } from '../subscanners/controller/controllerAstCanonical';

import { controllerDeclarationSemanticJudgmentAuthority } from '../../../types/upstream/controllerDeclarationSemanticJudgmentAuthority';
import { controllerDeclarationSelectionInventoryClosureAuthority } from '../../../types/upstream/controllerDeclarationSelectionInventoryClosureAuthority';
import type { ControllerDeclarationSelectionInventoryClosureAuthorityInterface } from '../../../types/upstream/controllerDeclarationSelectionInventoryClosureInterface';
import type { ControllerDeclarationSemanticJudgment } from '../../../types/upstream/controllerDeclarationSemanticJudgmentInterface';
import { createActionName, createClassName, createMethodName, createResponseTypeName } from '../../../types/upstream/names';
import { ResponseShape } from '../../../types/domain/responseShapes';
import { numberValue } from '../../../types/upstream/valueObjects';
import { phpClassConstructorSelectionAuthority } from '../../../types/upstream/phpClassConstructorSelectionAuthority';
import type { PhpClassConstructorSelectionAuthorityInterface, PhpClassMethodDeclarationInventory } from '../../../types/upstream/phpClassConstructorSelectionInterface';

const contextualAttributeNames = (items: import('../../../types/upstream/laravelAttributeScannerInterface').LaravelContextualAttributeDeclarationSequence): readonly ClassName[] => {
    if (items.kind === 'laravel_contextual_attribute_declaration_sequence_empty') return Object.freeze([]);
    return Object.freeze([items.declaration.identity, ...contextualAttributeNames(items.rest)]);
};

class LaravelControllerScannerExecutor implements LaravelControllerScannerInterface {
    readonly kind = 'laravel_controller_scanner' as const;
    readonly closed = true as const;
    readonly contractVersion = 44 as const;
    readonly actionSemanticProjectionMigration = controllerActionProjectionMigration;

    constructor(
        readonly declarationSemanticJudgmentAuthority: ControllerDeclarationSemanticJudgment,
        readonly responseSemanticPipeline: LaravelControllerResponseSemanticPipelineInterface = laravelControllerResponseSemanticPipeline,
        readonly executionDependencies = legacyLaravelControllerExecutionDependencies,
        readonly selectionInventoryClosureAuthority: ControllerDeclarationSelectionInventoryClosureAuthorityInterface = controllerDeclarationSelectionInventoryClosureAuthority,
        readonly constructorSelectionAuthority: PhpClassConstructorSelectionAuthorityInterface = phpClassConstructorSelectionAuthority,
    ) {}

    /** The integrated response pipeline owns the AST projection dependency and its semantic judgment. */

    scan(input: LaravelControllerScanInput): Promise<LaravelControllerScanJudgment> {
        return this.scanControllers(input);
    }

    private async scanControllers(input: LaravelControllerScanInput): Promise<LaravelControllerScanJudgment> {
        const invocationInventoryReceipt = input.invocationInventory;
        const sourceProject = invocationInventoryReceipt.sourceInventory.sourceProject;
        const formRequestIndex = input.formRequests.map(request => [request.identity.requestClass.value.value, request] as const);
        const customContextualAttributeNames: readonly ClassName[] = contextualAttributeNames(input.contextualAttributeInventory.declarations);
        const queries: readonly QueryAst[] = input.queries;
        const sourceInputs: readonly Readonly<{ invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface }>[] = invocationInventoryReceipt.correspondences.map(invocationJudgment => Object.freeze({
            invocationJudgment,
        }));
        const parsed = await Promise.all(sourceInputs.map(async (sourceInput) => {
            const { invocationJudgment } = sourceInput;
            const fullPath = invocationJudgment.sourceFile.value.value;
            const controllerName = path.basename(fullPath, '.php');
            const source = await this.executionDependencies.readSourceText(fullPath);
            const tokens = LaravelSourceLexer.tokenize(source);
            const declaration = LaravelSourceLexer.parseControllerDeclarationFromInvocationJudgment(source, tokens, createAstIdentifier(controllerName), invocationJudgment, this.responseSemanticPipeline.astProjection, this.responseSemanticPipeline.dtoTypeReferenceBindingAuthority.dependencies.classNameResolutionAuthority);
            return Object.freeze({ fullPath, controllerName, source, declaration, invocationJudgment: sourceInput.invocationJudgment });
        }));
        const declarations = Object.freeze(parsed);
        const declarationCorrespondences = this.declarationSemanticJudgmentAuthority.correspondences(declarations.map(item => Object.freeze({
            source: item,
            sourceIdentity: item.invocationJudgment.sourceFile,
            candidate: Object.freeze({
            sourceFile: item.invocationJudgment.sourceFile,
            classIdentity: item.declaration.classIdentity,
            controller: createControllerName(item.controllerName),
            parent: item.declaration.inheritance.kind === 'none'
                ? Object.freeze({ kind: 'no_parent' as const })
                : item.declaration.inheritance.identity.kind === 'php_class_name_resolved'
                    ? Object.freeze({ kind: 'parent_declared' as const, parent: createControllerName(item.declaration.inheritance.name), identity: item.declaration.inheritance.identity })
                    : Object.freeze({ kind: 'parent_name_resolution_blocked' as const, parent: createControllerName(item.declaration.inheritance.name), identity: item.declaration.inheritance.identity }),
            interfaces: Object.freeze(item.declaration.interfaces.map(name => createClassName(name))),
            methods: Object.freeze(item.declaration.methods.map(method => Object.freeze({
                name: createActionName(method.name),
                visibility: method.visibility,
                storage: method.storage,
                value: method,
            }))),
            attributes: Object.freeze(item.declaration.attributes.map(attribute => Object.freeze({
                name: createClassName(attribute.name),
                value: attribute,
            }))),
            }),
        })));
        // The upstream closure authority owns the aggregate ADT: runtime receives either
        // a complete inventory of executable selections or a non-empty blocker ledger.
        const selectionInventory = this.selectionInventoryClosureAuthority.close(declarationCorrespondences);
        if (selectionInventory.kind === 'controller_declaration_selection_inventory_blocked') {
            return Object.freeze({
                kind: 'laravel_controller_scan_blocked' as const,
                contractVersion: 44 as const,
                sourceProject,
                declarationSelection: Object.freeze({
                    kind: 'controller_declaration_selection_inventory_blocked' as const,
                    blockers: selectionInventory.blockers,
                }),
                controllers: Object.freeze([]),
            });
        }
        const declarationsWithSelections = Object.freeze(selectionInventory.correspondences.map(correspondence => {
            const item = correspondence.source;
            const classSource = Object.freeze({
                kind: 'source_span' as const,
                file: item.invocationJudgment.sourceFile,
                start: numberValue(item.declaration.source.startOffset),
                end: numberValue(item.declaration.source.endOffset),
            });
            const constructorInventory: PhpClassMethodDeclarationInventory<typeof item.declaration.methods[number]> = item.declaration.methodDeclarationInventory.kind === 'controller_method_declaration_inventory_complete'
                ? Object.freeze({
                    kind: 'php_class_method_declaration_inventory_complete',
                    classSource,
                    declarations: Object.freeze(item.declaration.methodDeclarationInventory.declarations.map(method => Object.freeze({
                        name: createMethodName(method.name),
                        source: Object.freeze({
                            kind: 'source_span' as const,
                            file: item.invocationJudgment.sourceFile,
                            start: numberValue(method.source.startOffset),
                            end: numberValue(method.source.endOffset),
                        }),
                        value: method,
                    }))),
                })
                : Object.freeze({
                    kind: 'php_class_method_declaration_inventory_blocked',
                    classSource,
                    blockers: Object.freeze(item.declaration.methodDeclarationInventory.candidates.map(candidate => Object.freeze({
                        kind: 'php_class_method_declaration_enumeration_incomplete' as const,
                        source: Object.freeze({
                            kind: 'source_span' as const,
                            file: item.invocationJudgment.sourceFile,
                            start: numberValue(candidate.startOffset),
                            end: numberValue(candidate.endOffset),
                        }),
                    }))),
                });
            const constructorSelection = this.constructorSelectionAuthority.select(constructorInventory);
            return Object.freeze({ ...item, semanticSelection: correspondence.selection, constructorSelection });
        }));
        const constructorBlockers = Object.freeze(declarationsWithSelections.flatMap(item =>
            item.constructorSelection.kind === 'php_class_constructor_ambiguous'
                ? [Object.freeze({
                    kind: 'controller_constructor_selection_ambiguous' as const,
                    controller: createControllerName(item.controllerName),
                    candidates: item.constructorSelection.candidates,
                })]
                : item.constructorSelection.kind === 'php_class_constructor_selection_blocked'
                    ? [Object.freeze({
                        kind: 'controller_constructor_selection_inventory_blocked' as const,
                        controller: createControllerName(item.controllerName),
                        blockers: Object.freeze(item.constructorSelection.blockers.map(blocker => blocker.source)),
                    })]
                    : [],
        ));
        if (constructorBlockers.length > 0) {
            return Object.freeze({
                kind: 'laravel_controller_scan_blocked' as const,
                contractVersion: 44 as const,
                sourceProject,
                declarationSelection: Object.freeze({
                    kind: 'controller_declaration_selection_inventory_blocked' as const,
                    blockers: constructorBlockers,
                }),
                controllers: Object.freeze([]),
            });
        }

        // No action/response/AST work starts until declaration and constructor inventories are closed.
        const result: { controllers: LaravelControllerScanArtifact[] } = { controllers: [] };
        for (const item of declarationsWithSelections) {
            const { fullPath, controllerName, declaration, invocationJudgment, semanticSelection, constructorSelection } = item;
            const actionMethods = semanticSelection.actionSelections.filter(selection => selection.kind === 'controller_action_selected').map(selection => selection.method);
            const constructorParameters = constructorSelection.kind === 'php_class_constructor_selected' ? constructorSelection.method.value.parameters : [];
            const controllerMethods = actionMethods.map(method => {
                const actionPublication = this.executionDependencies.actionJudgment.judge({
                    invocationJudgment,
                    methodSource: Object.freeze({
                        kind: 'source_span' as const,
                        file: invocationJudgment.sourceFile,
                        start: numberValue(method.source.startOffset),
                        end: numberValue(method.source.endOffset),
                    }),
                    method,
                    controller: createControllerName(controllerName),
                    formRequestIndex,
                    modelClasses: input.modelClasses,
                    constructorParameters,
                    contextualAttributeNames: customContextualAttributeNames,
                });
                const semanticJudgment = actionPublication.judgment;
                return Object.freeze({ method, responseReferenceJudgment: semanticJudgment.semantic.responseReferenceJudgment, dependencies: semanticJudgment.semantic.dependencies, semantic: semanticJudgment.semantic, contract: actionPublication.projection, semanticJudgment });
            });
            const sourceSpan = { kind: 'source_span' as const, file: createSourceFile(fullPath), start: { kind: 'number_value' as const, value: declaration.source.startOffset }, end: { kind: 'number_value' as const, value: declaration.source.endOffset } };
            const inheritedAttributeAst = semanticSelection.inheritedMiddlewareAttributes;
            const declarationAttributeEvidence = this.executionDependencies.controllerAstProjection.methodAttributesFromAttributes(declaration.attributes, [], fullPath);
            const inheritedAttributeEvidence = this.executionDependencies.controllerAstProjection.methodAttributesFromAttributes(inheritedAttributeAst, [], fullPath);
            const inheritedControllerNames = semanticSelection.inheritedDeclarations.map(ancestor => ancestor.controller);
            const methodEvidence: readonly ControllerMethodEvidence[] = controllerMethods.map(({ method, responseReferenceJudgment, dependencies }) => {
                const semanticProjection = this.executionDependencies.controllerAstProjection.methodSemanticProjectionFromMethod(method, controllerName, fullPath, responseReferenceJudgment, queries);
                const contract = this.executionDependencies.controllerAstProjection.methodContractFromMethod(method, controllerName, fullPath, responseReferenceJudgment, dependencies, declaration.attributes, queries, declaration.interfaces, declaration.methods, inheritedAttributeAst, semanticProjection);
                const action = this.executionDependencies.controllerAstProjection.actionFromMethod(method, controllerName, fullPath, responseReferenceJudgment, dependencies, contract.policy, inheritedControllerNames, queries, semanticProjection);
                return this.executionDependencies.controllerProducer.projectMethodEvidence({
                    controller: createControllerName(controllerName),
                    sourceFile: createSourceFile(fullPath),
                    method: Object.freeze({
                        source: method.source,
                        responseAttribute: (() => {
                            switch (method.responseAttribute.kind) {
                                case 'absent':
                                    return Object.freeze({ kind: 'response_attribute_not_declared' as const });
                                case 'declared':
                                    return Object.freeze({
                                        kind: 'response_attribute_declared' as const,
                                        responseName: createResponseTypeName(method.responseAttribute.className.value),
                                        shape: (() => {
                                            switch (method.responseAttribute.collection) {
                                                case true: return ResponseShape.Collection;
                                                case false: return ResponseShape.Single;
                                            }
                                        })(),
                                        classNameResolutionContext: (() => {
                                            switch (method.classNameResolutionContext) {
                                                case undefined:
                                                    return Object.freeze({ kind: 'unavailable' as const, reason: 'controller_method_lexical_context_missing' as const });
                                                default:
                                                    return Object.freeze({ kind: 'available' as const, context: method.classNameResolutionContext });
                                            }
                                        })(),
                                        source: method.responseAttribute.source,
                                    });
                            }
                        })(),
                        returns: method.returns,
                    }),
                    action,
                    contract,
                });
            });
            const declarationEvidence: ControllerDeclarationEvidence = {
                kind: 'controller_declaration_evidence',
                controller: createControllerName(controllerName),
                attributes: declarationAttributeEvidence,
                inheritedAttributes: inheritedAttributeEvidence,
                inheritance: declaration.inheritance.kind === 'class' ? {
                    kind: 'controller_inheritance_relation' as const,
                    child: createControllerName(controllerName),
                    parent: { kind: 'controller_name' as const, value: { kind: 'string_value' as const, value: declaration.inheritance.name } },
                    source: { kind: 'source_span' as const, file: createSourceFile(fullPath), start: { kind: 'number_value' as const, value: declaration.inheritance.source.startOffset }, end: { kind: 'number_value' as const, value: declaration.inheritance.source.endOffset }, },
                } : null,
                interfaces: declaration.interfaces.map(name => ({ kind: 'class_name' as const, value: { kind: 'string_value' as const, value: name } })),
                methods: methodEvidence,
                source: sourceSpan,
            };
            const produced = this.executionDependencies.controllerProducer.produce({ declaration: declarationEvidence, invocationJudgment });
            const actionJudgments = Object.freeze(controllerMethods.map(({ semantic, semanticJudgment }) => Object.freeze({
                kind: 'controller_action_judgment_publication' as const,
                controller: semanticJudgment.semantic.controllerName,
                action: semanticJudgment.semantic.actionName,
                sourceFile: semanticJudgment.semantic.source.file,
                source: semanticJudgment.semantic.source,
                judgment: semanticJudgment,
            })));
            const resourceBindings: readonly ControllerResourceBindingEvidence[] = Object.freeze(controllerMethods.flatMap(
                ({ semantic }) => semantic.resourceBindings.map(binding => Object.freeze({
                    kind: 'controller_resource_binding_evidence' as const,
                    controller: createControllerName(controllerName),
                    action: semantic.actionName,
                    resource: binding.resource,
                    modelOrigin: binding.model,
                    response: binding.response,
                    source: binding.source,
                })),
            ));
            const artifactBase = Object.freeze({
                kind: 'laravel_controller_scan_artifact' as const,
                identity: createControllerName(controllerName),
                ast: produced.ast,
                actions: produced.actions,
                policyInventory: controllerPolicyInventoryFromDeclaration(
                    declarationEvidence.attributes,
                    declaration.methods,
                    declaration.interfaces,
                    fullPath,
                ),
                actionJudgments,
                resourceBindings,
            });
            const responseJudgment = this.responseSemanticPipeline.judgeIntegratedResponse(Object.freeze({
                kind: 'laravel_controller_response_integrated_judgment_input',
                invocationJudgment,
                declarationEvidence,
                sourceProject,
                dtoDeclarationInventory: input.dtoDeclarationInventory,
            }));
            const projectionJudgment = this.responseSemanticPipeline.astProjection.judge({
                kind: 'integrated_invocation_response_judgment',
                judgment: invocationJudgment,
                responseJudgment,
            });
            const artifact: LaravelControllerScanArtifact = Object.freeze({
                ...artifactBase,
                invocationJudgment,
                responseJudgment,
                projectionJudgment,
            });
            result.controllers.push(artifact);
        }
        return Object.freeze({
            kind: 'laravel_controller_scan_complete' as const,
            contractVersion: 44 as const,
            sourceProject,
            declarationSelection: Object.freeze({ kind: 'controller_declaration_selection_inventory_complete' as const }),
            controllers: Object.freeze([...result.controllers]),
        });
    }
}

/** The singleton is wiring only; semantic rules remain owned by upstream contracts. */
export const laravelControllerScanner: LaravelControllerScannerInterface = Object.freeze(
    new LaravelControllerScannerExecutor(controllerDeclarationSemanticJudgmentAuthority),
);
