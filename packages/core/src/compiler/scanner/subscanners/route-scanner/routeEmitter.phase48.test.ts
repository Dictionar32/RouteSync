import { describe, expect, it } from "vitest";
import { emitRouteInterfaceDirect } from "./routeEmitter";
import { createActionName, createClassName, createControllerName, createResourceName, createRouteParameterName, createRoutePath } from "../../../../types/upstream/names";
import { defaultApiResourceRegistration, resolveApiResourceFlow } from "../../../../types/upstream/routeResourceFlow";
import { VoidResponseDescriptor } from "../../../../types/route";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";

describe("direct route interface emission phase 48", () => {
  it("consumes upstream parameters instead of parsing path syntax", () => {
    const resource = createResourceName("photos");
    const plan = resolveApiResourceFlow({
      declarationPath: createRoutePath("photos"),
      prefix: [],
      resource,
      registration: defaultApiResourceRegistration(resource, { kind: "conventional_controller", className: createClassName("PhotoController") }),
    });
    const action = plan.actions.find(item => item.action.value.value === "show")!;
    const directPlan = { ...plan, actions: Object.freeze([{ ...action, path: createRoutePath("/photos/{id}"), parameters: Object.freeze([createRouteParameterName("photo")]) }]) };
    const routes = emitRouteInterfaceDirect(directPlan, {
      resolve: () => ({ kind: "controller_reference", controllerName: createControllerName("PhotoController"), response: new VoidResponseDescriptor() }),
    }, false, [], SemanticValueFactory.sourceFilePath("routes/api.php"), 1);

    expect(routes[0].path.value.value).toBe("/photos/{id}");
    expect(routes[0].parameters[0]?.name.value.value).toBe("photo");
  });
});
