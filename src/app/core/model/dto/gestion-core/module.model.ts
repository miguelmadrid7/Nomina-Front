import { ModuleRole } from "../../../../models/gestion-core/modulerole.model";

export interface Module {
  id?: number;
  name: string;
  description?: string | null;
  vista?: boolean;
  visible?: boolean;
  parent?: string | null;
  parentId?: number | null;
  icon?: string | null;
  iconId?: number | null;
  path?: string | null;
  roles?: ModuleRole[];
  rolesId?: number[];
}
