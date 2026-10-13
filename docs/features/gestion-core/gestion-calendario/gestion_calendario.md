# Gestión core - Gestión de Calendario

- Nombre del módulo (Vista):
- Gestión de Calendario

## 1. Objetivo y alcance
El módulo permite gestionar el calendario quincenal de nómina, incluyendo la consulta, creación y edición de registros de calendario. Permite visualizar todas las quincenas con sus fechas de cierre, pago y banderas de activación para diferentes procesos (movimientos, pensiones, juicios, terceros).

En la vista:
- Se observa la qna activa (viene de un endpoint del backend) como referencia.
- Se muestra una tabla paginada con todos los registros de calendario.
- Cada fila muestra: ejercicio, quincena, tipo, fecha de cierre, fecha de pago, banderas (movimientos, pensiones, juicios, terceros), estado activa y acciones.
- Se muestra un botón para crear un nuevo calendario.
- Cada fila tiene un botón para editar el calendario correspondiente.

- Flujo funcional:
1. Al cargar la vista, se obtiene la qna activa del calendario.
2. Se carga la lista completa de calendarios mediante `GET /calendario`.
3. Los registros se muestran en una tabla paginada (10 registros por página por defecto).
4. El usuario puede navegar entre páginas usando el paginador.
5. El usuario puede crear un nuevo calendario mediante un diálogo.
6. El usuario puede editar un calendario existente mediante un diálogo.
7. Al crear o editar, se recarga la lista de calendarios.

## 2. Mapa de código
- Ruta del módulo:
src/app/features/gestion-core/gestion-calendario/

- Clases involucradas: 
```text
    src/app/features/gestion-core/gestion-calendario/
        gestion-calendario.ts
        gestion-calendario.html
        gestion-calendario.css

    src/app/core/services/
        calendario.service.ts
        toast.service.ts

    src/app/core/model/
        calendario.model.ts

    src/app/shared/dialogs/
        alta-calendario-dialog/
```

## 3. API (Service)
| Metodo   |          Ruta                              | Uso                                                               |
|----------|--------------------------------------------|-------------------------------------------------------------------|
| GET      | `/calendario`                              | Obtiene todos los calendarios (con filtro opcional por ejercicio) |
| GET      | `/calendario/activa`                       | Muestra la qna activa                                             |
| GET      | `/calendario/${id}`                        | Obtiene un calendario específico por ID                           |
| POST     | `/calendario`                              | Crea un nuevo calendario                                          |
| PUT      | `/calendario/${id}`                        | Actualiza un calendario existente                                 |

## 4. Reglas de validación de negocio
1. **qna activa requerida**: La qna activa debe estar disponible para referencia.
2. **Paginación cliente**: La paginación se maneja en el frontend (slice del array).
3. **Tamaño por defecto**: 10 registros por página.
4. **Creación de calendario**: Solo se permite crear calendarios mediante el diálogo de alta.
5. **Edición de calendario**: Solo se permite editar calendarios existentes mediante el diálogo de edición.
6. **Recarga automática**: Al crear o editar exitosamente, se recarga la lista de calendarios.
7. **Manejo de errores**: Si falla la carga, se muestra un toast de error y se limpia la tabla.

## 5. Diagrama de clases
| Componente principal      | Servicios               | Modelos                 | Modelos de request       | Modelos de response         |
|---------------------------|-------------------------|-------------------------|--------------------------|-----------------------------| 
| `GestionCalendario`       | `CalendarioService`     | `Calendario`            | `Omit<Calendario, 'id'>` | `ApiResponse<Calendario[]>` |
|                           | `ToastService`          |                         |                          | `ApiResponse<boolean>`      |

## 6. Métodos del componente GestionCalendario
### 6.1 Métodos de ciclo de vida
| Método        | Descripción                                                                                                                                             |
|---------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ngOnInit()`  | Inicializa el componente: carga el calendario y la qna activa.                                                                                          |

### 6.2 Métodos de carga de datos
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `loadQnaActivated()`  | Obtiene la quincena activa desde `GET /calendario/activa`. Actualiza `calendarioActual` y maneja errores.                             |
| `cargarCalendario()`  | Obtiene todos los calendarios desde `GET /calendario`. Actualiza `allCalendarios`, `totalRecords` y aplica paginación local.          |

### 6.3 Métodos de manipulación de archivos
No aplica - Este módulo no tiene funcionalidad de descarga de archivos.

### 6.4 Métodos de validación
No aplica - Este módulo gestiona calendarios, las validaciones se realizan en el diálogo y en el backend.

### 6.5 Métodos de edición de registros
| Method                       | Description                                                                                                                           |
|------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `openDialog()`               | Abre el diálogo de alta de calendario en modo 'create'. Al cerrar, llama al servicio para crear el calendario.                        |
| `openEditDialog(calendario)` | Abre el diálogo de edición de calendario en modo 'update'. Primero carga el calendario por ID, luego permite editar.                  |

### 6.8 Métodos auxiliares
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `onPageChange(event)` | Maneja el cambio de página en el paginador. Actualiza `pageSize` y `pageIndex`, y aplica el estado de la tabla.                       |
| `applyTableState()`   | Aplica el estado de paginación a la tabla, haciendo slice del array `allCalendarios` según `pageIndex` y `pageSize`.                  |

## 7. Prueba operativa mínima
1. Arrancar el perfil local y confirmar el puerto en el log.
2. Abrir `/src/environments/environment.ts`, cambiar la ruta a localhost, o descomentar esa ruta y comentar la de prod.
3. Hacer login.
4. Obtener JWT con `POST /users/getToken` y usar `Authorize`.
5. Entrar al módulo y verificar:
- Que se cargue la qna activa correctamente.
- Que se cargue la lista de calendarios correctamente.
- Que la paginación funcione.
- Que el diálogo de creación funcione.
- Que el diálogo de edición funcione.
- Que al crear o editar se recargue la lista.
* NOTA IMPORTANTE:
- Si no se puede ingresar al swagger, puedes hacer primero pruebas en el postman.

## 8. Criterios al modificar el módulo
- Conservar `ApiResponse` en todos los services.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentación o logs compartidos.
- En caso de que se integren nuevas variables, revisar primero los modelos para ver si coincidan con lo que es el nuevo requerimiento.
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por qué el cambio y si no afecta en el demás flujo.
- Si se agregan columnas a la tabla, actualizar `displayedColumns` y el HTML correspondiente.
- Mantener la consistencia en el uso del diálogo `AltaCalendarioDialog` para creación y edición.
- Preservar el comportamiento de recarga automática después de crear o editar.
