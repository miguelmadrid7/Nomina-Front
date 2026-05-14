export interface ModuleItem {
  id?: number;
  name: string;
  description?: string | null;
  vista?: boolean;
  visible?: boolean;
  parent?: string | null;
  icon?: string | null;
  path?: string | null;
  iconId?: number | null;
  parentId?: number | null;
  rolesId?: number[];
}

export interface ModuleRequest {
  name: string;
  path: string;
  description?: string | null;
  visible: boolean;
  iconId?: number | null;
  parentId?: number | null;
  rolesId: number[];
}

export interface ModuleDialogData {
  mode: 'create' | 'edit';
  module?: ModuleItem;
}
