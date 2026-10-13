# Gestión core - Gestión de Usuarios

- Nombre del módulo (Vista):
- Gestión de Usuarios

## 1. Objetivo y alcance
El módulo permite gestionar los usuarios del sistema, incluyendo la consulta, creación, edición, eliminación (soft delete) y asignación de roles. Permite visualizar todos los usuarios con su información personal, roles y módulos asociados. Incluye funcionalidad de búsqueda por username, email, área, task o catEmpleadoId.

En la vista:
- Se observa la qna activa (viene de un endpoint del backend) como referencia
- Se muestra un campo de búsqueda con autocomplete para buscar usuarios
- Se muestra una tabla paginada con todos los usuarios
- Cada fila muestra: nombre completo, empleado, área, roles, módulos padre, módulos hijo y acciones
- Se muestra un botón para crear un nuevo usuario
- Cada fila tiene botones para editar y eliminar el usuario correspondiente
- Se muestra un botón para limpiar filtros

- Flujo funcional:
1. Al cargar la vista, se obtiene la qna activa del calendario
2. Se carga la lista completa de roles mediante `GET /roles`
3. Se carga la lista completa de usuarios mediante `GET /users`
4. Los registros se muestran en una tabla paginada (10 registros por página por defecto)
5. El usuario puede buscar usuarios por texto (mínimo 3 caracteres) en cliente
6. El usuario puede navegar entre páginas usando el paginador
7. El usuario puede crear un nuevo usuario mediante un diálogo
8. El usuario puede editar un usuario existente mediante un diálogo
9. El usuario puede eliminar un usuario (soft delete) mediante un diálogo de confirmación
10. El usuario puede asignar roles a un usuario
11. Al crear, editar o eliminar exitosamente, se recarga la lista de usuarios

## 2. Mapa de código
- Ruta del módulo:
src/app/features/gestion-core/gestion-usuarios/

- Clases involucradas:
```text
    src/app/features/gestion-core/gestion-usuarios/
        gestion-usuarios.ts
        gestion-usuarios.html
        gestion-usuarios.css

    src/app/core/services/
        user.service.ts
        calendario.service.ts
        toast.service.ts

    src/app/core/model/
        user.model.ts
        rol.model.ts
        emplado.model.ts
        assignrole-request.model.ts
        calendario.model.ts

    src/app/shared/dialogs/
        alta-usuario-dialog/
        editar-usuario-dialog/
        confirm-dialog/

    src/app/shared/directives/
        upperCase.directivas.ts
```

## 3. API (Service)
| Metodo   |          Ruta                              | Uso                                                         |
|----------|--------------------------------------------|-------------------------------------------------------------|
| GET      | `/calendario/activa`                       | Muestra la qna activa                                       |
| GET      | `/users`                                   | Obtiene todos los usuarios                                  |
| GET      | `/users/user`                              | Obtiene un usuario específico por ID (header: userId)       |
| GET      | `/roles`                                   | Obtiene todos los roles                                     |
| GET      | `/users/rolesByUser`                       | Obtiene los roles de un usuario (header: userId)            |
| POST     | `/users`                                   | Crea un nuevo usuario                                       |
| POST     | `/roles/roleByUser`                        | Asigna roles a un usuario (header: userId)                  |
| PATCH    | `/users`                                   | Actualiza un usuario existente (header: userId)             |
| PATCH    | `/users/softdeleted`                       | Elimina un usuario (soft delete) (header: userId)           |

## 4. Reglas de validación de negocio
1. **qna activa requerida**: La qna activa debe estar disponible para referencia.
2. **Paginación cliente**: La paginación se maneja en el frontend (slice del array).
3. **Tamaño por defecto**: 10 registros por página.
4. **Búsqueda en cliente**: La búsqueda se realiza en cliente filtrando por username, email, área, task o catEmpleadoId.
5. **Mínimo de caracteres**: La búsqueda requiere al menos 3 caracteres para ejecutarse.
6. **Creación de usuario**: Solo se permite crear usuarios mediante el diálogo de alta.
7. **Edición de usuario**: Solo se permite editar usuarios existentes mediante el diálogo de edición.
8. **Eliminación de usuario**: Solo se permite eliminar usuarios mediante soft delete con confirmación.
9. **Recarga automática**: Al crear, editar o eliminar exitosamente, se recarga la lista de usuarios.
10. **Manejo de errores**: Si falla la carga, se muestra un toast de error y se limpia la tabla.
11. **Diálogo de confirmación**: La eliminación requiere confirmación explícita del usuario.
12. **Asignación de roles**: Los roles se asignan mediante un endpoint específico con el userId en header.

## 5. Diagrama de clases
| Componente principal      | Servicios               | Modelos                 | Modelos de request       | Modelos de response       |
|---------------------------|-------------------------|-------------------------|--------------------------|---------------------------| 
| `GestionUsuarios`         | `UserService`           | `User`                  | `CreateUserRequest`      | `ApiResponse<User[]>`     |
|                           | `CalendarioService`     | `Role`                  | `AssignRoleRequest`      | `ApiResponse<User>`       |
|                           | `ToastService`          | `EmpleadoItem`          |                          | `ApiResponse<Role[]>`     |
|                           |                         |                         |                          | `ApiResponse<number[]>`   |
|                           |                         |                         |                          | `ApiResponse<any>`        |

## 6. Métodos del componente GestionUsuarios
### 6.1 Métodos de ciclo de vida
| Método          | Descripción                                                                                                                                             |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ngOnInit()`    | Inicializa el componente: crea el formulario, carga roles, usuarios y la qna activa.                                                                    |
| `ngOnDestroy()` | Cierra todos los diálogos abiertos al destruir el componente.                                                                                           |

### 6.2 Métodos de carga de datos
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `loadQnaActivated()`  | Obtiene la quincena activa desde `GET /calendario/activa`. Actualiza `calendarioActual` y maneja errores.                             |
| `loadRoles()`         | Obtiene todos los roles desde `GET /roles`. Actualiza `roles`.                                                                        |
| `loadEmpleados()`     | Obtiene todos los usuarios desde `GET /users`. Actualiza `empleados`, `allUsers` y aplica paginación local.                           |

### 6.3 Métodos de manipulación de archivos
No aplica - Este módulo no tiene funcionalidad de descarga de archivos.

### 6.4 Métodos de validación
No aplica - Este módulo gestiona usuarios, las validaciones se realizan en los diálogos y en el backend.

### 6.5 Métodos de edición de registros
| Method                         | Description                                                                                                                           |
|--------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `openAltaUsuarioDialog()`      | Abre el diálogo de alta de usuario con los roles disponibles. Al cerrar con payload, crea el usuario y recarga la lista.              |
| `openUsuarioDialog(row)`       | Carga los roles del usuario por ID y abre el diálogo de edición. Al cerrar con resultado, actualiza el usuario y recarga la lista.    |
| `deleteUser(row)`              | Abre diálogo de confirmación para eliminar. Si se confirma, llama al servicio para soft delete y recarga la lista.                    |
| `asignarRoles(userId, roleIds)`| Asigna roles a un usuario mediante el endpoint específico.                                                                            |

### 6.6 Métodos de procesamiento
No aplica - Este módulo gestiona usuarios, no procesa datos adicionales.

### 6.7 Métodos de búsqueda
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `buscarUsuario()`     | Filtra usuarios en cliente por username, email, área, task o catEmpleadoId (mínimo 3 caracteres). Actualiza la tabla con resultados.  |
| `clearFilters()`      | Limpia todos los filtros, resetea el formulario y recarga la lista completa de usuarios.                                              |

### 6.8 Métodos auxiliares
| Method                        | Description                                                                                                                           |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `onPageChange(event)`         | Maneja el cambio de página en el paginador. Actualiza `pageSize` y `pageIndex`, y aplica el estado de la tabla.                       |
| `applyTableState()`           | Aplica el estado de paginación a la tabla, haciendo slice del array `allUsers` según `pageIndex` y `pageSize`.                        |
| `displayUsuario(user)`        | Retorna el texto a mostrar en el autocomplete (username, email o string).                                                             |
| `usuarioSeleccionado(user)`   | Maneja la selección de un usuario del autocomplete. Actualiza `empleadoActual` y limpia resultados.                                   |
| `getUserRoles(row)`           | Extrae y retorna los roles de un usuario como array de strings.                                                                       |
| `getUserModules(row)`         | Extrae y retorna los módulos de un usuario como array de strings.                                                                     |
| `getUserParentModules(row)`   | Extrae y retorna los módulos padre de un usuario como array de strings.                                                               |
| `getUserChildModules(row)`    | Extrae y retorna los módulos hijo de un usuario como array de strings.                                                                |
| `splitList(value)`            | Método privado que divide una string separada por comas en array de strings.                                                          |

## 7. Prueba operativa mínima
1. Arrancar el perfil local y confirmar el puerto en el log.
2. Abrir `/src/environments/environment.ts`, cambiar la ruta a localhost, o descomentar esa ruta y comentar la de prod.
3. Hacer login
4. Obtener JWT con `POST /users/getToken` y usar `Authorize`.
5. Entrar al módulo y verificar:
- Que se cargue la qna activa correctamente
- Que se cargue la lista de usuarios correctamente
- Que la búsqueda funcione (mínimo 3 caracteres)
- Que la paginación funcione
- Que el diálogo de creación funcione
- Que el diálogo de edición funcione
- Que el diálogo de confirmación de eliminación funcione
- Que al crear, editar o eliminar se recargue la lista
- Que la asignación de roles funcione
* NOTA IMPORTANTE:
- Si no se puede ingresar al swagger, puedes hacer primero pruebas en el postman.

## 8. Criterios al modificar el módulo
- Conservar `ApiResponse` en todos los services.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentación o logs compartidos.
- En caso de que se integren nuevas variables, revisar primero los modelos para ver si coincidan con lo que es el nuevo requerimiento.
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por qué el cambio y si no afecta en el demás flujo.
- Si se agregan columnas a la tabla, actualizar `displayedColumns` y el HTML correspondiente.
- Mantener la consistencia en el uso de los diálogos `AltaUsuarioDialog` y `UsuarioDialog` para creación y edición.
- Preservar el comportamiento de recarga automática después de crear, editar o eliminar.
- El soft delete debe mantenerse como método de eliminación para no perder datos históricos.
- La búsqueda en cliente es crítica para el rendimiento; mantener la lógica de filtrado por múltiples campos.
- La asignación de roles usa un endpoint separado; mantener esta separación si se modifican los roles.
