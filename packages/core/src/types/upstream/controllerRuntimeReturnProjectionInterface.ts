import type { ControllerRuntimeReturn } from '../domain/controllerExpression';
import type { SourceFile } from './names';

/** Consumer projection of parsed return expressions; it does not make a semantic return judgment. */
export interface ControllerRuntimeReturnProjectionInput<TMethod> {
  readonly kind: 'controller_runtime_return_projection_input';
  readonly method: TMethod;
  readonly sourceFile: SourceFile;
}

/** Converts the exact method return AST into the existing runtime-return ADT. */
export interface ControllerRuntimeReturnProjectionInterface<TMethod> {
  readonly kind: 'controller_runtime_return_projection';
  readonly contractVersion: 1;
  readonly provenance: 'expressions-are-projected-with-the-exact-source-file-from-the-invocation';
  readonly project: (input: ControllerRuntimeReturnProjectionInput<TMethod>) => ControllerRuntimeReturn;
}
