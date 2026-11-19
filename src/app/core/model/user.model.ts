export interface User {
    id: number;
    username: string;
    email: string;
    area: string;
    task: string;
    catempleadoid: number;
    catNivelRhId?: number | null;
    principal?: string | null;
    tsCreated?: string | null;
    rolesname?: string;
    modulesname?: string;
    parentmodulesname?: string;
    childmodulesname?: string;
}