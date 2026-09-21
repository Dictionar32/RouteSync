import { createBaseCrudService } from "@/lib/generic/generic-services";
import { ProfileIndex, ProfileShow } from "../types/profile-read";
import { ProfileFormValues } from "../contracts/api-schema";
import { ProfileApiResponse, ProfileApiUpdate, ValidateSchema, ValidateUpdate, validateIndex } from "../contracts/api-contract";
import { toApiReadList, toApiRead, toApiUpdate } from "../mappers/profile-mapper";

export const ProfileService = createBaseCrudService<
  ProfileApiResponse,
  ProfileIndex,
  ProfileShow,
  never, // ❌ no create
  ProfileFormValues['Update'],
  never, // ❌ no create payload
  ProfileApiUpdate
>({
  basePath: "/profile",

  validateIndex: validateIndex,
  validateShow: ValidateSchema,
  validateUpdate: ValidateUpdate,

  mapIndex: toApiReadList,
  mapShow: toApiRead,
  mapUpdate: toApiUpdate,
});
