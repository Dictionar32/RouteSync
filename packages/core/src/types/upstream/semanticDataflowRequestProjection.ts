/**
 * Projects Laravel request/FormRequest evidence into canonical semantic
 * dataflow seed facts.
 *
 * Request semantics remain owned by `request.ts`: this projection only turns
 * proven request-field/validation evidence into dataflow facts. It does not
 * solve, close, or classify sources/sinks. Raw input and validated input are
 * represented as distinct semantic identities so a downstream state policy
 * can distinguish them without widening DataFlowInterface.
 */
import type { CompleteLaravelSourceModel } from './highLevelSourceModel';
import type { RouteHighLevelContract } from './highLevelContracts';
import { routeBindingInterfaceFrom } from './routeBinding';
import type { ControllerActionFlowContract, RequestHighLevelContract } from './highLevelContracts';
import type { RequestField, RequestValidationCapability } from './request';
import type { SemanticDataflowIdentity, SemanticDataflowInputFact } from './semanticDataflow';
import { semanticDataflowFactWithLineage } from './semanticDataflow';
import { stringValue } from './valueObjects';
import type { Sequence } from './collections';
import type { Expression, RequestArgument } from './expression';

const sequenceItems = <T>(items: Sequence<T>, output: readonly T[] = []): readonly T[] =>
  items.kind === 'empty' ? output : sequenceItems(items.tail, [...output, items.head]);

const propertyPathValue = (field: RequestField['name']): string =>
  sequenceItems(field.segments).map(segment => segment.value.value).join('.');

const requestName = (controller: ControllerActionFlowContract): string | undefined =>
  controller.request.kind === 'bound_request' ? controller.request.name.value.value : undefined;

const requestNameValue = (request: RequestHighLevelContract): string => request.identity.request.value.value;

const requestIdentity = (request: RequestHighLevelContract, field: RequestField): SemanticDataflowIdentity => Object.freeze({
  kind: 'semantic_dataflow_identity',
  source: field.source,
  role: 'access',
  slot: stringValue(`request:${requestNameValue(request)}:raw:${propertyPathValue(field.name)}`),
});

const dynamicRequestIdentity = (
  controller: ControllerActionFlowContract,
  requestName: string,
  access: { readonly field: string | undefined; readonly source: import('./provenance').SourceSpan },
): SemanticDataflowIdentity => Object.freeze({
  kind: 'semantic_dataflow_identity',
  source: access.source,
  role: 'access',
  slot: stringValue(`request:${requestName}:raw:${access.field ?? '*'}`),
});

const validatedIdentity = (request: RequestHighLevelContract, field: RequestField): SemanticDataflowIdentity => Object.freeze({
  kind: 'semantic_dataflow_identity',
  source: field.source,
  role: 'access',
  slot: stringValue(`request:${requestNameValue(request)}:validated:${propertyPathValue(field.name)}`),
});

const controllerRequestIdentity = (
  controller: ControllerActionFlowContract,
  requestNameValue: string,
  field: RequestField,
): SemanticDataflowIdentity => Object.freeze({
  kind: 'semantic_dataflow_identity',
  source: controller.source,
  role: 'binding',
  slot: stringValue(`controller:${controller.controller.value.value}.${controller.action.value.value}:request:${requestNameValue}:field:${propertyPathValue(field.name)}`),
});


const expressionItems = (items: Sequence<import('./expression').ExpressionArgument>): readonly Expression[] => {
  const output: Expression[] = [];
  let current = items;
  while (current.kind !== 'empty') {
    output.push(current.head.value);
    current = current.tail;
  }
  return output;
};

const requestArgumentFields = (argument: RequestArgument): readonly string[] => {
  if (argument.kind === 'field') return [propertyPathValue(argument.path)];
  if (argument.kind === 'fields') {
    const output: string[] = [];
    let current = argument.paths.items;
    while (current.kind !== 'empty') {
      output.push(propertyPathValue(current.head));
      current = current.tail;
    }
    return output;
  }
  return [];
};

const requestAccessFields = (expression: Expression, boundName: string): readonly { readonly field: string | undefined; readonly validated: boolean; readonly source: import('./provenance').SourceSpan }[] => {
  const output: { readonly field: string | undefined; readonly validated: boolean; readonly source: import('./provenance').SourceSpan }[] = [];
  const visit = (value: Expression): void => {
    if (value.kind === 'method') {
      const operation = value.operation;
      if (operation.kind === 'request') {
        const request = operation.operation;
        const validated = request.kind === 'validated' || request.kind === 'safe';
        if (request.kind === 'all') {
          output.push({ field: undefined, validated: false, source: value.source });
        } else if (request.kind === 'safe') {
          if (request.argument.kind === 'absent') output.push({ field: undefined, validated: true, source: value.source });
          else if (request.argument.kind === 'present') {
            const fields = requestArgumentFields(request.argument.value);
            if (fields.length === 0) output.push({ field: undefined, validated: true, source: value.source });
            else fields.forEach(field => output.push({ field, validated: true, source: value.source }));
          }
        } else if (request.kind === 'validated') {
          output.push({ field: undefined, validated: true, source: value.source });
        } else if ('argument' in request) {
          const fields = requestArgumentFields(request.argument);
          if (fields.length === 0) output.push({ field: undefined, validated, source: value.source });
          else fields.forEach(field => output.push({ field, validated, source: value.source }));
        }
      }
      visit(value.receiver);
      expressionItems(value.arguments.items).forEach(visit);
      return;
    }
    if (value.kind === 'property') {
      // Laravel Request supports dynamic properties for incoming input. A
      // plain `$request->field` is therefore request evidence, not merely an
      // object-property read. Only recognize the bound request variable;
      // arbitrary model/service properties must remain ordinary expressions.
      if (value.receiver.kind === 'variable' && value.receiver.name.value.value === boundName) {
        output.push({ field: value.property.value.value, validated: false, source: value.source });
      }
      visit(value.receiver);
      return;
    }
    if (value.kind === 'relation' || value.kind === 'nullsafe_property') visit(value.receiver);
    if (value.kind === 'binary') { visit(value.left); visit(value.right); }
    if (value.kind === 'unary') visit(value.operand);
    if (value.kind === 'conditional') { visit(value.condition); visit(value.branches.whenTrue); if (value.branches.kind === 'then_else') visit(value.branches.whenFalse); }
    if (value.kind === 'short_conditional') { visit(value.condition); visit(value.whenFalse); }
    if (value.kind === 'coalesce') { visit(value.left); visit(value.right); }
    if (value.kind === 'cast') visit(value.expression);
    if (value.kind === 'index') { visit(value.receiver); visit(value.key); }
    if (value.kind === 'static_method') expressionItems(value.arguments.items).forEach(visit);
    if (value.kind === 'call') expressionItems(value.arguments.items).forEach(visit);
    if (value.kind === 'callable_call') { visit(value.callable); expressionItems(value.arguments.items).forEach(visit); }
    if (value.kind === 'construct' || value.kind === 'dynamic_construct') expressionItems(value.arguments.items).forEach(visit);
    if (value.kind === 'array') { let current = value.entries; while (current.kind !== 'empty') { if (current.head.kind === 'keyed') visit(current.head.key); visit(current.head.value); current = current.tail; } }
    if (value.kind === 'object') { let current = value.properties.items; while (current.kind !== 'empty') { visit(current.head.value); current = current.tail; } }
  };
  visit(expression);
  return output;
};

const fieldsFromValidation = (validation: RequestValidationCapability): readonly RequestField[] =>
  validation.kind === 'form_request_validation'
    ? sequenceItems(validation.schema.fields.items)
    : [];

const routeParameterNames = (route: RouteHighLevelContract): readonly string[] => {
  const parameters = routeBindingInterfaceFrom(route.bindings.parameters).parameters.items;
  const output: string[] = [];
  let current = parameters;
  while (current.kind !== 'empty') {
    output.push(current.head.name.value.value);
    current = current.tail;
  }
  return output;
};

const controllerRoutes = (sourceModel: CompleteLaravelSourceModel, controller: ControllerActionFlowContract): readonly RouteHighLevelContract[] =>
  sequenceItems(sourceModel.contracts.routes).filter(route => {
    const target = route.bindings.target;
    if (target.kind !== 'controller_action' && target.kind !== 'controller_invokable') return false;
    return target.controller.name.value.value === controller.controller.value.value
      && target.controller.action.value.value === controller.action.value.value;
  });

const routeIdentity = (route: RouteHighLevelContract, field: string, source: import('./provenance').SourceSpan): SemanticDataflowIdentity => Object.freeze({
  kind: 'semantic_dataflow_identity',
  source,
  role: 'binding',
  slot: stringValue(`route:${route.identity.key.value.value}:parameter:${field}`),
});

/**
 * Request/FormRequest facts for the controller action's bound request.
 *
 * Each declared validation field yields two facts:
 *   raw request field -> validated request field
 *   validated request field -> controller request field binding
 *
 * This intentionally does not mark either endpoint as a global source/sink.
 */
export const semanticDataflowRequestFacts = (
  sourceModel: CompleteLaravelSourceModel,
  controller: ControllerActionFlowContract,
): readonly SemanticDataflowInputFact[] => {
  const boundName = requestName(controller);
  if (!boundName) return Object.freeze([]);

  const request = sequenceItems(sourceModel.contracts.requests).find(candidate =>
    candidate.identity.request.value.value === boundName,
  );

  // FormRequest declarations provide canonical validated fields. Plain
  // Illuminate\Http\Request parameters do not have a request contract in
  // the source-model catalog, but their controller expressions are still
  // authoritative request-input evidence. Keep those reads as raw request
  // identities instead of silently dropping them.
  const fields = request ? fieldsFromValidation(request.validation) : [];
  const facts: SemanticDataflowInputFact[] = [];
  for (const field of fields) {
    const raw = requestIdentity(request!, field);
    const validated = validatedIdentity(request!, field);
    const bound = controllerRequestIdentity(controller, boundName, field);
    facts.push(
      semanticDataflowFactWithLineage(
        Object.freeze({ kind: 'value_flow' as const, source: raw, target: validated, role: 'value' as const }),
        'request',
        raw,
      ),
      semanticDataflowFactWithLineage(
        Object.freeze({ kind: 'value_flow' as const, source: validated, target: bound, role: 'binding' as const }),
        'request',
        validated,
      ),
    );
  }

  const validatedFields = new Set(fields.map(field => propertyPathValue(field.name)));
  const rawRequestIdentity = (access: { readonly field: string | undefined; readonly source: import('./provenance').SourceSpan }): SemanticDataflowIdentity => {
    const field = access.field ? fields.find(candidate => propertyPathValue(candidate.name) === access.field) : undefined;
    return field && request ? requestIdentity(request, field) : dynamicRequestIdentity(controller, boundName, access);
  };

  const accessFieldValue = (field: RequestField | undefined, access: { readonly field: string | undefined }): string =>
    field ? propertyPathValue(field.name) : (access.field ?? '*');
  const validatedRequestIdentity = (access: { readonly field: string | undefined; readonly source: import('./provenance').SourceSpan }): SemanticDataflowIdentity | undefined => {
    if (!request || !access.field || !validatedFields.has(access.field)) return undefined;
    const field = fields.find(candidate => propertyPathValue(candidate.name) === access.field);
    return field ? validatedIdentity(request, field) : undefined;
  };

  const definitions = sequenceItems(controller.semantic.variables).flatMap(binding => sequenceItems(binding.definitions));
  for (const definition of definitions) {
    for (const access of requestAccessFields(definition.expression, boundName)) {
      const candidates = access.field
        ? fields.filter(field => propertyPathValue(field.name) === access.field)
        : fields;
      const sourceIdentity = access.validated
        ? validatedRequestIdentity(access)
        : undefined;
      const fallbackSourceIdentity = sourceIdentity ?? rawRequestIdentity(access);
      const effectiveCandidates = candidates.length > 0 ? candidates : [undefined];
      for (const field of effectiveCandidates) {
        const effectiveSourceIdentity = field && access.validated
          ? validatedIdentity(request!, field)
          : fallbackSourceIdentity;
        const accessIdentity: SemanticDataflowIdentity = Object.freeze({
          kind: 'semantic_dataflow_identity',
          source: access.source,
          role: 'access',
          slot: stringValue(`controller:${controller.controller.value.value}.${controller.action.value.value}:request-access:${access.validated ? 'validated' : 'raw'}:${accessFieldValue(field, access)}`),
        });
        facts.push(semanticDataflowFactWithLineage(
          Object.freeze({ kind: 'value_flow' as const, source: effectiveSourceIdentity, target: accessIdentity, role: 'value' as const }),
          'request',
          effectiveSourceIdentity,
        ));

        // Laravel dynamic Request properties are payload-first, then matched-route fallback.
        // Preserve both possible provenances when a route parameter has the same name.
        if (!access.validated && access.field) {
          for (const route of controllerRoutes(sourceModel, controller)) {
            if (routeParameterNames(route).includes(access.field)) {
              const routeSource = routeIdentity(route, access.field, access.source);
              facts.push(semanticDataflowFactWithLineage(
                Object.freeze({ kind: 'value_flow' as const, source: routeSource, target: accessIdentity, role: 'value' as const }),
                'route',
                routeSource,
              ));
            }
          }
        }

        // The scanner already interns assignment targets as canonical variable
        // identities (`root:<name>`). Bridge request evidence to that identity
        // so the existing assignment/value-flow relation can carry the request
        // value into later variable uses and query inputs.
        const variableIdentity: SemanticDataflowIdentity = Object.freeze({
          kind: 'semantic_dataflow_identity',
          source: definition.source,
          role: 'variable',
          slot: stringValue(`root:${definition.variable.value.value}`),
        });
        facts.push(semanticDataflowFactWithLineage(
          Object.freeze({ kind: 'value_flow' as const, source: accessIdentity, target: variableIdentity, role: 'binding' as const }),
          'request',
          effectiveSourceIdentity,
        ));
      }
    }
  }

  // Direct request expressions used as query arguments must meet the same
  // canonical query invocation identity emitted by the controller-query
  // projection. This avoids a parallel request/query solver while preserving
  // the existing controller query authority.
  const queries = sequenceItems(controller.semantic.queries);
  for (const query of queries) {
    const queryIdentity: SemanticDataflowIdentity = Object.freeze({
      kind: 'semantic_dataflow_identity',
      source: query.source,
      role: 'invocation',
      slot: stringValue(`controller:${controller.controller.value.value}.${controller.action.value.value}:query:${query.source.start.value}:${query.source.end.value}`),
    });
    for (const input of sequenceItems(query.inputs)) {
      for (const access of requestAccessFields(input.expression, boundName)) {
        const candidates = access.field
          ? fields.filter(field => propertyPathValue(field.name) === access.field)
          : fields;
        const sourceIdentity = access.validated ? validatedRequestIdentity(access) : undefined;
        const fallbackSourceIdentity = sourceIdentity ?? rawRequestIdentity(access);
        const effectiveCandidates = candidates.length > 0 ? candidates : [undefined];
        for (const field of effectiveCandidates) {
          const effectiveSourceIdentity = field && access.validated
            ? validatedIdentity(request!, field)
            : fallbackSourceIdentity;
          const accessIdentity: SemanticDataflowIdentity = Object.freeze({
            kind: 'semantic_dataflow_identity',
            source: access.source,
            role: 'access',
            slot: stringValue(`controller:${controller.controller.value.value}.${controller.action.value.value}:request-query-access:${access.validated ? 'validated' : 'raw'}:${accessFieldValue(field, access)}`),
          });
          facts.push(semanticDataflowFactWithLineage(
            Object.freeze({ kind: 'value_flow' as const, source: effectiveSourceIdentity, target: accessIdentity, role: 'value' as const }),
            'request',
            effectiveSourceIdentity,
          ));
          if (!access.validated && access.field) {
            for (const route of controllerRoutes(sourceModel, controller)) {
              if (routeParameterNames(route).includes(access.field)) {
                const routeSource = routeIdentity(route, access.field, access.source);
                facts.push(semanticDataflowFactWithLineage(
                  Object.freeze({ kind: 'value_flow' as const, source: routeSource, target: accessIdentity, role: 'value' as const }),
                  'route',
                  routeSource,
                ));
              }
            }
          }
          facts.push(semanticDataflowFactWithLineage(
            Object.freeze({ kind: 'value_flow' as const, source: accessIdentity, target: queryIdentity, role: input.role === 'key' ? 'argument' as const : input.role === 'mutation' ? 'value' as const : 'predicate' as const }),
            'request',
            effectiveSourceIdentity,
          ));
        }
      }
    }
  }
  return Object.freeze(facts);
};
