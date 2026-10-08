# Phase 36 — Controller contextual attributes elevated upstream

Laravel 13 documents contextual attributes such as `Storage`, `Auth`, `Cache`, `Config`, `Context`, `DB`, `Give`, `Log`, `RequestAttribute`, `RouteParameter`, `Tag`, and `CurrentUser` for container resolution.

## Boundary

PHP syntax remains at the lexer boundary:

`#[Storage('local')] Filesystem $filesystem`

becomes `ControllerParameterAst.attributes` and its attribute arguments remain syntax AST values there.

The controller dependency resolver then maps known Laravel contextual attributes into:

`ControllerDependency.resolution = { kind: 'contextual_attribute', attribute: ... }`

The semantic attribute is an interface and its alternatives are ADTs:

- `ControllerContextualAttributeName` identifies the Laravel contextual attribute.
- `ControllerContextualAttribute.arguments` uses the canonical semantic `ExpressionArguments` contract.
- Positional, named, and unpacked PHP attribute arguments are represented at the AST boundary before being lowered to semantic expressions.

Unknown parameter attributes do not become contextual dependency resolution; they remain ordinary container dependencies. This avoids inventing Laravel semantics for application-defined attributes.

## Route separation

`RouteParameter` is represented as a Laravel contextual container attribute when it appears on a controller dependency parameter. It is not converted into `RouteParameterBinding` here. Route URI binding remains owned by the route semantic contract, preserving the distinction between container contextual resolution and implicit/scoped route model binding.

## Flow

`PHP attribute AST -> controller attribute resolver -> ControllerDependencyResolution ADT -> ControllerDependency interface -> ControllerActionFlowContract -> semantic catalog/manifest -> dumb consumer`

The downstream flow never needs to inspect `#[...]`, parameter positions, attribute names, or raw PHP argument tokens.
