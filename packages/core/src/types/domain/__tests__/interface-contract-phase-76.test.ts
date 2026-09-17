import type { DomainName, MapperName, ModelName, ResourceName, ResponseTypeName, RouteName, ValidatorName } from "../semanticValues";
import type { ResponseArtifactIdentity, RouteResponseAnalysis } from "../responseDescriptors";

describe("interface contract phase 76", () => {
  it("uses semantic names at response-domain boundaries", () => {
    const route: RouteName = { kind: "route_name", value: "register.post" };
    const resource: ResourceName = { kind: "resource_name", value: "User" };
    const model: ModelName = { kind: "model_name", value: "User" };
    const domain: DomainName = { kind: "domain_name", value: "auth" };
    const response: ResponseTypeName = { kind: "response_type_name", value: "RegisterResponse" };
    const mapper: MapperName = { kind: "mapper_name", value: "toUserRead" };
    const validator: ValidatorName = { kind: "validator_name", value: "validateUserSchema" };

    const identity: ResponseArtifactIdentity = {
      typeName: response,
      mapperName: mapper,
      validatorName: validator,
    };

    const analysis: RouteResponseAnalysis = {
      routeName: route,
      kind: "inline",
      shape: "single",
      typeName: response,
    };

    expect(identity.typeName.kind).toBe("response_type_name");
    expect(analysis.routeName.kind).toBe("route_name");
    expect(resource.kind).toBe("resource_name");
    expect(model.kind).toBe("model_name");
    expect(domain.kind).toBe("domain_name");
  });
});
