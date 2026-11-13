# Gestión core - Gestión de Roles

- Nombre del módulo (Vista):
- Gestión de Roles

## 1. Objetivo y alcance
El módulo permite gestionar los roles del sistema, incluyendo la consulta, creación, edición y eliminación (soft delete) de registros de roles. Permite visualizar todos los roles con su nombre, rol padre y módulos asociados.

En la vista:
- Se observa la qna activa (viene de un endpoint del backend) como referencia
- Se muestra una tabla paginada con todos los roles
- Cada fila muestra: rol, padre y acciones
- Se muestra un botón para crear un nuevo rol
- Cada fila tiene botones para editar y eliminar el rol correspondiente

- Flujo funcional:
1. Al cargar la vista, se obtiene la qna activa del calendario
2. Se carga la lista completa de roles mediante `GET /roles`
3. Los registros se muestran en una tabla paginada (10 registros por página por defecto)
4. El usuario puede navegar entre páginas usando el paginador
5. El usuario puede crear un nuevo rol mediante un diálogo
6. El usuario puede editar un rol existente mediante un diálogo
7. El usuario puede eliminar un rol (soft delete) mediante un diálogo de confirmación
8. Al crear, editar o eliminar exitosamente, se recarga la lista de roles

## 2. Mapa de código
- Ruta del módulo:
src/app/features/gestion-core/gestion-role/

- Clases involucradas:
```text
    src/app/features/gestion-core/gestion-role/
        gestion-role.ts
        gestion-role.html
        gestion-role.css

    src/app/core/services/
        rol.service.ts
        calendario.service.ts
        toast.service.ts

    src/app/core/model/
        rol.model.ts
        createrole-request.model.ts
        permission.model.ts
        calendario.model.ts

    src/app/shared/dialogs/
        alta-rol-dialog/
        confirm-dialog/
```

## 3. API (Service)
| Metodo   |          Ruta                              | Uso                                                         |
|----------|--------------------------------------------|-------------------------------------------------------------|
| GET      | `/calendario/activa`                       | Muestra la qna activa                                       |
| GET      | `/roles`                                   | Obtiene todos los roles                                     |
| GET      | `/roles/role`                              | Obtiene un rol específico por ID (header: roleId)           |
| GET      | `/roles/permisos`                          | Obtiene todos los permisos                                  |
| POST     | `/roles`                                   | Crea un nuevo rol                                           |
| PATCH    | `/roles`                                   | Actualiza un rol existente (header: roleId)                 |
| PATCH    | `/roles/softdeleted`                       | Elimina un rol (soft delete) (header: roleId)               |

## 4. Reglas de validación de negocio
1. **qna activa requerida**: La qna activa debe estar disponible para referencia.
2. **Paginación cliente**: La paginación se maneja en el frontend (slice del array).
3. **Tamaño por defecto**: 10 registros por página.
4. **Creación de rol**: Solo se permite crear roles mediante el diálogo de alta.
5. **Edición de rol**: Solo se permite editar roles existentes mediante el diálogo de edición.
6. **Eliminación de rol**: Solo se permite eliminar roles mediante soft delete con confirmación.
7. **Recarga automática**: Al crear, editar o eliminar exitosamente, se recarga la lista de roles.
8. **Manejo de errores**: Si falla la carga, se muestra un toast de error y se limpia la tabla.
9. **Diálogo de confirmación**: La eliminación requiere confirmación explícita del usuario.
10. **Módulos asociados**: Los roles tienen módulos asociados que se muestran en formato de lista separada por comas.

## 5. Diagrama de clases
| Componente principal      | Servicios               | Modelos                 | Modelos de request       | Modelos de response        |
|---------------------------|-------------------------|-------------------------|--------------------------|----------------------------| 
| `GestionRole`             | `RolService`            | `Role`                  | `CreateRoleRequest`      | `ApiResponse<Role[]>`      |
|                           | `CalendarioService`     | `Permission`            |                          | `ApiResponse<Role>`        |
|                           | `ToastService`          | `Calendario`            |                          | `ApiResponse<Permission[]>`|
|                           |                         |                         |                          | `ApiResponse<any>`         |

## 6. Métodos del componente GestionRole

### 6.1 Métodos de ciclo de vida
| Método          | Descripción                                                                                                                                             |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ngOnInit()`    | Inicializa el componente: carga todos los roles y la qna activa.                                                                                        |
| `ngOnDestroy()` | Cierra todos los diálogos abiertos al destruir el componente.                                                                                           |

### 6.2 Métodos de carga de datos
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `loadQnaActivated()`  | Obtiene la quincena activa desde `GET /calendario/activa`. Actualiza `calendarioActual` y maneja errores.                             |
| `loadRoles()`         | Obtiene todos los roles desde `GET /roles`. Actualiza `roles`, `totalRoles` y aplica paginación local.                                |

### 6.3 Métodos de manipulación de archivos
No aplica - Este módulo no tiene funcionalidad de descarga de archivos.

### 6.4 Métodos de validación
No aplica - Este módulo gestiona roles, las validaciones se realizan en los diálogos y en el backend.

### 6.5 Métodos de edición de registros
| Method                        | Description                                                                                                                           |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `openAltaRoleDialog()`        | Abre el diálogo de alta de rol. Al cerrar con payload, llama al servicio para crear el rol y recarga la lista.                        |
| `openEditRoleDialog(role)`    | Carga el detalle del rol por ID y abre el diálogo de edición. Al cerrar con payload, actualiza el rol y recarga la lista.             |
| `softDeleteRole(role)`        | Abre diálogo de confirmación para eliminar. Si se confirma, llama al servicio para soft delete y recarga la lista.                    |

### 6.6 Métodos de procesamiento
No aplica - Este módulo gestiona roles, no procesa datos adicionales.

### 6.7 Métodos de búsqueda
No aplica - Este módulo no tiene funcionalidad de búsqueda.

### 6.8 Métodos auxiliares
| Method                    | Description                                                                                                                           |
|---------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `onPageChange(event)`     | Maneja el cambio de página en el paginador. Actualiza `pageSize` y `pageIndex`, y aplica el estado de la tabla.                       |
| `applyTableState()`       | Aplica el estado de paginación a la tabla, haciendo slice del array `roles` según `pageIndex` y `pageSize`.                           |
| `getRoleModules(row)`     | Extrae y retorna los módulos asociados a un rol como array de strings, procesando el campo modulesName o modulesname.                 |

## 7. Prueba operativa mínima
1. Arrancar el perfil local y confirmar el puerto en el log.
2. Abrir `/src/environments/environment.ts`, cambiar la ruta a localhost, o descomentar esa ruta y comentar la de prod.
3. Hacer login
4. Obtener JWT con `POST /users/getToken` y usar `Authorize`.
5. Entrar al módulo y verificar:
- Que se cargue la qna activa correctamente
- Que se cargue la lista de roles correctamente
- Que la paginación funcione
- Que el diálogo de creación funcione
- Que el diálogo de edición funcione
- Que el diálogo de confirmación de eliminación funcione
- Que al crear, editar o eliminar se recargue la lista
* NOTA IMPORTANTE:
- Si no se puede ingresar al swagger, puedes hacer primero pruebas en el postman.

## 8. Criterios al modificar el módulo
- Conservar `ApiResponse` en todos los services.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentación o logs compartidos.
- En caso de que se integren nuevas variables, revisar primero los modelos para ver si coincidan con lo que es el nuevo requerimiento.
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por qué el cambio y si no afecta en el demás flujo.
- Si se agregan columnas a la tabla, actualizar `displayedColumns` y el HTML correspondiente.
- Mantener la consistencia en el uso del diálogo `AltaRolDialog` para creación y edición.
- Preservar el comportamiento de recarga automática después de crear, editar o eliminar.
- El soft delete debe mantenerse como método de eliminación para no perder datos históricos.
- El método `getRoleModules` maneja dos campos posibles (modulesName y modulesname) por compatibilidad; mantener esta lógica si se modifican los modelos.
