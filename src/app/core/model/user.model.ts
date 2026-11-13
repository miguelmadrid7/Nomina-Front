export interface User  {
    id: number;
    username: string;
    email: string
    area: string;
    task: string;
    catEmpleadoId: number;
    rolesname?: string;
    modulesname?: string;
    parentmodulesname: string;
    childmodulesname: string;
    modulesName?: string;
}