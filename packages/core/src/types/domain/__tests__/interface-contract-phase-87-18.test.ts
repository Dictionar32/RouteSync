import { describe, expect, it } from "vitest";
import { PrimitiveKind } from "../../../compiler/types/SemanticType";
import { ResourceFieldExpressionFactory, ResourceExpressionKind, type ResourceFieldExpression } from "../expressions";

describe("Phase 87.18 semantic expression contract", () => {
  it("requires semantic ADTs for model/resource/property/method identities", () => {
    const model = ResourceFieldExpressionFactory.model({ kind: "model_name", value: "Product" });
    const resource = ResourceFieldExpressionFactory.resource({ kind: "resource_name", value: "ProductResource" });
    const property = ResourceFieldExpressionFactory.propertyAccess(
      ResourceFieldExpressionFactory.variable({ kind: "variable_name", value: "product" }),
      { kind: "property_name", value: "price" }
    );
    const method = ResourceFieldExpressionFactory.nullsafeMethodCall(
      resource,
      { kind: "method_name", value: "whenLoaded" }
    );

    expect(model.model.kind).toBe("model_name");
    expect(resource.resource.kind).toBe("resource_name");
    expect(property.property.kind).toBe("property_name");
    expect(method.kind).toBe(ResourceExpressionKind.NullsafeMethodCall);
    expect(PrimitiveKind.UNKNOWN).toBe("unknown");
  });

  it("does not require a primitive guess for a variable expression", () => {
    const expression: ResourceFieldExpression = ResourceFieldExpressionFactory.variable({
      kind: "variable_name",
      value: "review"
    });

    expect(expression).toEqual({ kind: "variable", name: { kind: "variable_name", value: "review" } });
  });
});
