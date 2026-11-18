import { ModuleRolePermissionRequest } from "./module-role-permission-request.model";

export interface ModuleRequest {
  name: string;
  path: string | null;
  description: string;
  visible: boolean;
  iconId: number;
  parentId: number | null;
  roles: ModuleRolePermissionRequest[];
}
