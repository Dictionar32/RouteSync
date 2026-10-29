import { describe, expect, it } from 'vitest';
import { controllerActionContractOperations } from './controllerActionContract';
import { controllerDependencyEvidenceProjection } from '../../../wiring/controllerDependencyEvidenceProjection';
import { controllerPhpAstExpressionSemanticAuthority } from '../../../wiring/controllerVariableSemanticRuntimeBinding';
import type { ControllerDependencySemanticJudgment } from '../../../../../types/upstream/controllerDependencySemanticJudgmentInterface';
import type { ControllerMethodAst } from '../../../../frontend/php/controllerAstTypes';
import { createClassName, createControllerName, createModelName, createRequestName, sourceFileIdentityFactory, stringValue } from '../../../../../types/upstream/names';
import { controllerParameterClassNameJudgmentAuthority } from '../../../wiring/controllerParameterClassNameJudgmentExecutor';
import { controllerDependencySemanticJudgmentAuthority } from '../../../../../types/upstream/controllerDependencySemanticJudgmentAuthority';
import { controllerActionSchemaSemanticJudgmentAuthority } from '../../../../../types/upstream/controllerActionSchemaSemanticJudgmentAuthority';
import { controllerActionResponseReferenceJudgmentAuthority } from '../../../../../types/upstream/controllerActionResponseReferenceJudgmentAuthority';
import { controllerRuntimeReturnProjection } from '../../../../frontend/php/routeAst/controllerRuntimeReturnProjection';
import { controllerBodySemanticJudgmentAuthority, controllerAstCanonicalOperations } from '../../controller/controllerAstCanonical';

const bodyJudgmentFor = (method: ControllerMethodAst) => controllerBodySemanticJudgmentAuthority.judge({
  body: method.body,
  method,
  sourceIdentity: sourceFileIdentityFactory.create(stringValue.create('<test>')),
});

const closedResolverContextFor = (method: ControllerMethodAst, constructorParameters: ControllerMethodAst['parameters'] = []) => {
  const sourceFile = sourceFileIdentityFactory.create(stringValue.create('<test>'));
  const requestBindingJudgment = controllerActionContractOperations.controllerRequestBindingJudgmentFromMethod(method, []);
  const bodyJudgment = bodyJudgmentFor(method);
  const responseReferenceJudgment = controllerActionResponseReferenceJudgmentAuthority.judge(method.responseAttribute.kind === 'absent'
    ? Object.freeze({ kind: 'absent' })
    : Object.freeze({ kind: 'declared', className: createClassName(method.responseAttribute.className) }));
  return Object.freeze({
    requestBindingJudgment,
    dataflowJudgment: method.body.dataflow,
    bodyJudgment,
    responseReferenceJudgment,
    semanticReturn: controllerAstCanonicalOperations.controllerReturnSemanticFromMethod(method, sourceFile.value.value, responseReferenceJudgment),
    resourceBindings: Object.freeze([]),
    schemaSemanticJudgment: controllerActionSchemaSemanticJudgmentAuthority.judge(Object.freeze({
      requestEvidence: controllerActionContractOperations.schemaRequestEvidence(requestBindingJudgment),
      inlineSchema: bodyJudgment.schema,
      inlineSchemaEvidence: bodyJudgment.inlineSchemaEvidence,
      inlineValidationEntries: bodyJudgment.validationEntries,
      sourceIdentity: sourceFile,
    })),
    dependencies: Object.freeze(controllerDependencyEvidenceProjection.project(Object.freeze({
      constructorParameters: Object.freeze(constructorParameters.map(parameter => Object.freeze({
        parameter, classNameJudgment: controllerParameterClassNameJudgmentAuthority.judge(parameter.semantic),
      }))),
      methodParameters: Object.freeze(method.parameters.map(parameter => Object.freeze({
        parameter, classNameJudgment: controllerParameterClassNameJudgmentAuthority.judge(parameter.semantic),
      }))),
      customContextualAttributeNames: [], sourceFile,
      expressionAuthority: controllerPhpAstExpressionSemanticAuthority,
    })).flatMap(evidence => {
      const judgment: ControllerDependencySemanticJudgment = controllerDependencySemanticJudgmentAuthority.judge(evidence);
      switch (judgment.kind) {
        case 'controller_dependency_resolved': return [judgment.dependency];
        case 'controller_dependency_excluded': return [];
      }
    })),
    runtimeReturn: controllerRuntimeReturnProjection.project(Object.freeze({
      kind: 'controller_runtime_return_projection_input', method, sourceFile,
    })),
  });
};

describe('phase 10 controller request semantic resolution', () => {
  it('does not confuse the first dependency with the request', () => {
    const method = {
      name: 'store',
      parameters: [
        { attributes: [], name: 'service', type: { kind: 'named', name: 'PaymentService' }, semantic: { kind: 'external' } },
        { attributes: [], name: 'request', type: { kind: 'named', name: 'Request' }, semantic: { kind: 'request_origin', name: createRequestName('Request') } },
      ],
      body: { statements: [], validations: [], errors: [] },
      returns: [],
      responseAttribute: { kind: 'absent' },
      source: { file: '<test>', line: 1, column: 1 },
    } as unknown as ControllerMethodAst;

    const contract = controllerActionContractOperations.resolveControllerActionContract(method, createControllerName('PaymentController'), sourceFileIdentityFactory.create(stringValue.create('<test>')), closedResolverContextFor(method, []));

    expect(contract.request.kind).toBe('framework_request');
  });
});


describe('controller constructor dependency elevation', () => {
  it('elevates constructor class parameters into semantic constructor dependencies', () => {
    const method = {
      name: 'show',
      parameters: [],
      body: { statements: [], validations: [], errors: [] },
      returns: [],
      responseAttribute: { kind: 'absent' },
      source: { file: '<test>', line: 1, column: 1 },
    } as unknown as ControllerMethodAst;

    const constructorParameters = [
      { attributes: [], name: 'users', type: { kind: 'named', name: 'App\\Repositories\\UserRepository' }, semantic: { kind: 'model_origin', origin: { kind: 'model_class', name: createModelName('App\\Repositories\\UserRepository') } } },
    ] as unknown as ControllerMethodAst['parameters'];

    const contract = controllerActionContractOperations.resolveControllerActionContract(method, createControllerName('UserController'), sourceFileIdentityFactory.create(stringValue.create('<test>')), closedResolverContextFor(method, constructorParameters));

    expect(contract.dependencies).toEqual([
      {
        kind: 'controller_dependency',
        injection: { kind: 'constructor' },
        resolution: { kind: 'container' },
        parameter: { kind: 'variable_name', value: { kind: 'string_value', value: 'users' } },
        type: { kind: 'class_name', value: { kind: 'string_value', value: 'App\\Repositories\\UserRepository' } },
      },
    ]);
  });
});


describe('controller contextual attribute precedence', () => {
  it('keeps contextual model parameters as dependencies instead of treating them as route binding', () => {
    const method = {
      name: 'show',
      parameters: [
        {
          attributes: [{ name: 'RouteParameter', arguments: [], source: { file: '<test>', line: 1, column: 1 } }],
          name: 'photo',
          type: { kind: 'named', name: 'App\\Models\\Photo' },
          semantic: { kind: 'model_origin', origin: { kind: 'model_class', name: createModelName('App\\Models\\Photo') } },
        },
      ],
      body: { statements: [], validations: [], errors: [] },
      returns: [],
      responseAttribute: { kind: 'absent' },
      source: { file: '<test>', line: 1, column: 1 },
    } as unknown as ControllerMethodAst;

    const contract = controllerActionContractOperations.resolveControllerActionContract(method, createControllerName('PhotoController'), sourceFileIdentityFactory.create(stringValue.create('<test>')), closedResolverContextFor(method, []));

    expect(contract.dependencies).toHaveLength(1);
    expect(contract.dependencies[0]?.resolution).toMatchObject({
      kind: 'contextual_attribute',
      attribute: { kind: 'laravel_contextual_attribute', name: 'route_parameter' },
    });
  });

  it('recognizes Laravel Storage as a contextual attribute', () => {
    const method = {
      name: 'store',
      parameters: [
        {
          attributes: [{ name: 'Illuminate\\Container\\Attributes\\Storage', arguments: [], source: { file: '<test>', line: 1, column: 1 } }],
          name: 'filesystem',
          type: { kind: 'named', name: 'Illuminate\\Contracts\\Filesystem\\Filesystem' },
          semantic: { kind: 'external' },
        },
      ],
      body: { statements: [], validations: [], errors: [] },
      returns: [],
      responseAttribute: { kind: 'absent' },
      source: { file: '<test>', line: 1, column: 1 },
    } as unknown as ControllerMethodAst;

    const contract = controllerActionContractOperations.resolveControllerActionContract(method, createControllerName('PhotoController'), sourceFileIdentityFactory.create(stringValue.create('<test>')), closedResolverContextFor(method, []));

    expect(contract.dependencies[0]?.resolution).toMatchObject({
      kind: 'contextual_attribute',
      attribute: { kind: 'laravel_contextual_attribute', name: 'storage' },
    });
  });
});
