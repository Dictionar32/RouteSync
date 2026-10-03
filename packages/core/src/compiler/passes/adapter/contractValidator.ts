/**
 * Declarative compiler-pass contract validation.
 *
 * Artifact consistency is expressed as relation predicates and folded
 * constraints; no sentinel values or imperative branch constructs are used.
 */
import type { ArtifactKey } from '../../artifacts/types';
import type { CompilerPass } from '../CompilerPass';
import { relationResolve, relationFold, relationProject } from '../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../semantic/kernel/semanticRelations';
import { relationContains } from '../../../semantic/kernel/relationMembership';

function sameKeys(left: readonly ArtifactKey[], right: readonly ArtifactKey[]): boolean {
  return relationFold(
    left,
    relationEqual(left.length, right.length),
    (same, key, index) => relationResolve(same, () => relationEqual(key, right[index]), () => false),
  );
}

export function validatePassContract<I extends readonly ArtifactKey[], O extends readonly ArtifactKey[]>(pass: CompilerPass<I, O>): void {
  const inputKeys = relationProject(pass.inputWitnesses, witness => witness.key);
  const declaredInputs = pass.descriptor.consumes;
  const declaredOutputs = pass.descriptor.produces;

  relationResolve(
    sameKeys(inputKeys, declaredInputs),
    () => { return; },
    () => {
      throw Error(`Compiler pass ${pass.name} has an inconsistent input contract: input witnesses do not match descriptor.consumes`);
    },
  );

  relationResolve(
    sameKeys(pass.outputKeys, declaredOutputs),
    () => { return; },
    () => {
      throw Error(`Compiler pass ${pass.name} has an inconsistent output contract: outputKeys do not match descriptor.produces`);
    },
  );

  relationFold(pass.requires, true, (valid, dependency) => relationResolve(
    valid,
    () => relationResolve(
      relationContains(declaredInputs, dependency.artifact),
      () => true,
      () => {
        throw Error(`Compiler pass ${pass.name} declares dependency on ${dependency.artifact} but does not consume that artifact`);
      },
    ),
    () => false,
  ));
}
