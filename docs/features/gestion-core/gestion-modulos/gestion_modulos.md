# Gestión core - Gestión de Módulos

- Nombre del módulo (Vista):
- Gestión de Módulos

## 1. Objetivo y alcance
El módulo permite gestionar los módulos del sistema, incluyendo la consulta, creación, edición y eliminación (soft delete) de registros de módulos. Permite visualizar todos los módulos en una estructura jerárquica (árbol) basada en relaciones padre-hijo.

En la vista:
- Se observa la qna activa (viene de un endpoint del backend) como referencia
- Se muestra una tabla paginada con todos los módulos en estructura jerárquica
- Cada fila muestra: nombre, descripción, vista, padre, ícono y acciones
- Se muestra un botón para crear un nuevo módulo
- Cada fila tiene botones para editar y eliminar el módulo correspondiente
- Los módulos hijos se muestran indentados según su nivel en la jerarquía

- Flujo funcional:
1. Al cargar la vista, se obtiene la qna activa del calendario
2. Se carga la lista completa de módulos mediante `GET /modules`
3. Los módulos se organizan en una estructura jerárquica (árbol) basada en parentId y parent
4. Los registros se muestran en una tabla paginada (10 registros por página por defecto)
5. El usuario puede navegar entre páginas usando el paginador
6. El usuario puede crear un nuevo módulo mediante un diálogo
7. El usuario puede editar un módulo existente mediante un diálogo
8. El usuario puede eliminar un módulo (soft delete) mediante un diálogo de confirmación
9. Al crear, editar o eliminar exitosamente, se recarga la lista de módulos

## 2. Mapa de código
- Ruta del módulo:
src/app/features/gestion-core/gestion-modulos/

- Clases involucradas: 
```text
    src/app/features/gestion-core/gestion-modulos/
        gestion-modulos.ts
        gestion-modulos.html
        gestion-modulos.css

    src/app/core/services/
        module.service.ts
        calendario.service.ts
        toast.service.ts

    src/app/core/model/
        module.model.ts
        module-row.model.ts
        module-request.model.ts
        calendario.model.ts

    src/app/shared/dialogs/
        alta-module-dialog/
        confirm-dialog/
```

## 3. API (Service)
| Metodo   |          Ruta                              | Uso                                                         |
|----------|--------------------------------------------|-------------------------------------------------------------|
| GET      | `/calendario/activa`                       | Muestra la qna activa                                       |
| GET      | `/modules`                                 | Obtiene todos los módulos                                   |
| GET      | `/modules/module`                          | Obtiene un módulo específico por ID (header: moduleId)      |
| POST     | `/modules`                                 | Crea un nuevo módulo                                        |
| PATCH    | `/modules`                                 | Actualiza un módulo existente (header: moduleId)            |
| PATCH    | `/modules/softdeleted`                     | Elimina un módulo (soft delete) (header: moduleId)          |

## 4. Reglas de validación de negocio
1. **qna activa requerida**: La qna activa debe estar disponible para referencia.
2. **Paginación cliente**: La paginación se maneja en el frontend (slice del array).
3. **Tamaño por defecto**: 10 registros por página.
4. **Estructura jerárquica**: Los módulos se organizan en árbol basado en parentId y parent (nombre del padre).
5. **Resolución de padre**: Si parentId es nulo, se intenta resolver por nombre del padre (normalizado).
6. **Creación de módulo**: Solo se permite crear módulos mediante el diálogo de alta.
7. **Edición de módulo**: Solo se permite editar módulos existentes mediante el diálogo de edición.
8. **Eliminación de módulo**: Solo se permite eliminar módulos mediante soft delete con confirmación.
9. **Recarga automática**: Al crear, editar o eliminar exitosamente, se recarga la lista de módulos.
10. **Manejo de errores**: Si falla la carga, se muestra un toast de error y se limpia la tabla.
11. **Diálogo de confirmación**: La eliminación requiere confirmación explícita del usuario.

## 5. Diagrama de clases
| Componente principal      | Servicios               | Modelos                 | Modelos de request       | Modelos de response       |
|---------------------------|-------------------------|-------------------------|--------------------------|---------------------------| 
| `GestionModulos`          | `ModuleService`         | `Module`                | `ModuleRequest`         | `ApiResponse<Module[]>`    |
|                           | `CalendarioService`     | `ModuleRow`             |                         | `ApiResponse<Module>`      |
|                           | `ToastService`          | `Calendario`            |                         | `ApiResponse<any>`         |

## 6. Métodos del componente GestionModulos
### 6.1 Métodos de ciclo de vida
| Método          | Descripción                                                                                                                                             |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ngOnInit()`    | Inicializa el componente: carga todos los módulos y la qna activa.                                                                                      |
| `ngOnDestroy()` | Cierra todos los diálogos abiertos al destruir el componente.                                                                                           |

### 6.2 Métodos de carga de datos
| Method                    | Description                                                                                                                           |
|---------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `loadQnaActivated()`      | Obtiene la quincena activa desde `GET /calendario/activa`. Actualiza `calendarioActual` y maneja errores.                             |
| `getAllModules()`         | Obtiene todos los módulos desde `GET /modules`. Construye el árbol jerárquico y aplica paginación local.                              |
| `getModuleById(moduleId)` | Obtiene un módulo específico por ID desde `GET /modules/module`. Resuelve el parentId y abre el diálogo de edición.                   |

### 6.3 Métodos de manipulación de archivos
No aplica - Este módulo no tiene funcionalidad de descarga de archivos.

### 6.4 Métodos de validación
No aplica - Este módulo gestiona módulos, las validaciones se realizan en los diálogos y en el backend.

### 6.5 Métodos de edición de registros
| Method                        | Description                                                                                                                           |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `openCreateDialog()`          | Abre el diálogo de alta de módulo en modo 'create'. Al cerrar con refresh true, recarga la lista de módulos.                          |
| `softDeleteModule(moduleId)`  | Abre diálogo de confirmación para eliminar. Si se confirma, llama al servicio para soft delete y recarga la lista.                    |

### 6.6 Métodos de procesamiento
No aplica - Este módulo gestiona módulos, no procesa datos adicionales.

### 6.7 Métodos de búsqueda
No aplica - Este módulo no tiene funcionalidad de búsqueda.

### 6.8 Métodos auxiliares
| Method                   | Description                                                                                                                           |
|--------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `onPageChange(event)`    | Maneja el cambio de página en el paginador. Actualiza `pageSize` y `pageIndex`, y aplica el estado de la tabla.                       |
| `applyTableState()`      | Aplica el estado de paginación a la tabla, haciendo slice del array `groupedModules` según `pageIndex` y `pageSize`.                  |
| `buildTree(modules)`     | Construye la estructura jerárquica de módulos basada en parentId y parent. Retorna un array de ModuleRow con nivel y flag isParent.   |
| `normalizeText(value)`   | Normaliza texto para comparación (trim, lowercase).                                                                                   |
| `isParentModule(module)` | Verifica si un módulo tiene hijos (por ID o por nombre).                                                                              |

## 7. Prueba operativa mínima
1. Arrancar el perfil local y confirmar el puerto en el log.
2. Abrir `/src/environments/environment.ts`, cambiar la ruta a localhost, o descomentar esa ruta y comentar la de prod.
3. Hacer login
4. Obtener JWT con `POST /users/getToken` y usar `Authorize`.
5. Entrar al módulo y verificar:
- Que se cargue la qna activa correctamente
- Que se cargue la lista de módulos correctamente
- Que la estructura jerárquica se muestre correctamente (indentación)
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
- Mantener la consistencia en el uso del diálogo `ALtaModuleDialog` para creación y edición.
- Preservar el comportamiento de recarga automática después de crear, editar o eliminar.
- La estructura jerárquica (buildTree) es crítica para la visualización; cualquier cambio debe mantener la lógica de resolución de parentId.
- El soft delete debe mantenerse como método de eliminación para no perder datos históricos.
