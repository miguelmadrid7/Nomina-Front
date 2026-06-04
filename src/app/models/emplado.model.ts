export interface EmpleadoItem {
  id?: number;
  rfc?: string; RFC?: string;
  curp?: string; CURP?: string;
  primer_apellido?: string; primerApellido?: string;
  segundo_apellido?: string; segundoApellido?: string;
  nombre?: string;
  empleado?: string;
  nombreCompleto?: string;
  rolesName?: string;
  rolesname?: string;
  modulesName?: string;
  modulesname?: string;
  parentModulesName?: string;
  parentmodulesname?: string;
  childModulesName?: string;
  childmodulesname?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  modulesName?: string;
  modulesname?: string;
  modules?: { id: number; name: string }[];
  parentName?: string;
  parentId?: number | null;
  permissionId?: number | null;
}