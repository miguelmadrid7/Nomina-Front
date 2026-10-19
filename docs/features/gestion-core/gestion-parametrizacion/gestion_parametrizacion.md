# Gestión core - Gestión de Parametrización

- Nombre del módulo (Vista):
- Gestión de Parametrización

## 1. Objetivo y alcance
El módulo permite gestionar la parametrización del salario mínimo, incluyendo la consulta, creación, edición y eliminación (soft delete) de registros de parametrización. Permite visualizar todos los parámetros con su año, importe diario, importe mensual y quincenas de vigencia.

En la vista:
- Se observa la qna activa (viene de un endpoint del backend) como referencia.
- Se muestra una tabla paginada con todos los parámetros de salario mínimo.
- Cada fila muestra: año, importe diario, importe mensual, qna inicio, qna fin y acciones.
- Se muestra un botón para crear un nuevo parámetro.
- Cada fila tiene botones para editar y eliminar el parámetro correspondiente.

- Flujo funcional:
1. Al cargar la vista, se obtiene la qna activa del calendario.
2. Se carga la lista completa de parámetros mediante `GET /salario-minimo`.
3. Los registros se muestran en una tabla paginada (10 registros por página por defecto).
4. El usuario puede navegar entre páginas usando el paginador.
5. El usuario puede crear un nuevo parámetro mediante un diálogo.
6. El usuario puede editar un parámetro existente mediante un diálogo.
7. El usuario puede eliminar un parámetro (soft delete) mediante un diálogo de confirmación.
8. Al crear, editar o eliminar exitosamente, se recarga la lista de parámetros.

## 2. Mapa de código
- Ruta del módulo:
src/app/features/gestion-core/gestion-parametrizacion/

- Clases involucradas: 
```text
    src/app/features/gestion-core/gestion-parametrizacion/
        gestion-parametrizacion.ts
        gestion-parametrizacion.html
        gestion-parametrizacion.css

    src/app/core/services/
        core-salario-minimo.service.ts
        calendario.service.ts
        toast.service.ts

    src/app/core/model/
        parametrizacion-response.model.ts
        parametrizacion-request.model.ts
        calendario.model.ts

    src/app/shared/dialogs/
        alta-parametrizacion-dialog/
        confirm-dialog/
```

## 3. API (Service)
| Metodo   |          Ruta                              | Uso                                                         |
|----------|--------------------------------------------|-------------------------------------------------------------|
| GET      | `/calendario/activa`                       | Muestra la qna activa                                       |
| GET      | `/salario-minimo`                          | Obtiene todos los parámetros de salario mínimo              |
| POST     | `/salario-minimo`                          | Crea un nuevo parámetro                                     |
| PATCH    | `/salario-minimo/${paramId}`               | Actualiza un parámetro existente                            |
| DELETE   | `/salario-minimo/${paramId}`               | Elimina un parámetro (soft delete)                          |

## 4. Reglas de validación de negocio
1. **qna activa requerida**: La qna activa debe estar disponible para referencia.
2. **Paginación cliente**: La paginación se maneja en el frontend (MatPaginator).
3. **Tamaño por defecto**: 10 registros por página.
4. **Creación de parámetro**: Solo se permite crear parámetros mediante el diálogo de alta.
5. **Edición de parámetro**: Solo se permite editar parámetros existentes mediante el diálogo de edición.
6. **Eliminación de parámetro**: Solo se permite eliminar parámetros mediante soft delete con confirmación.
7. **Recarga automática**: Al crear, editar o eliminar exitosamente, se recarga la lista de parámetros.
8. **Manejo de errores**: Si falla la carga, se muestra un toast de error y se limpia la tabla.
9. **Diálogo de confirmación**: La eliminación requiere confirmación explícita del usuario.
10. **Inicialización asíncrona**: La carga de parámetros se hace con Promise.resolve() para asegurar que el componente esté inicializado.

## 5. Diagrama de clases
| Componente principal            | Servicios                       | Modelos                   | Modelos de request       | Modelos de response                      |
|---------------------------------|---------------------------------|---------------------------|--------------------------|------------------------------------------| 
| `GestionParametrizacion`        | `CoreSalarioMinimiService`      | `ParametrizacionResponse` | `ParametrizacionRequest` | `ApiResponse<ParametrizacionResponse[]>` |
|                                 | `CalendarioService`             | `Calendario`              |                          | `ApiResponse<ParametrizacionResponse>`   |
|                                 | `ToastService`                  |                           |                          | `ApiResponse<void>`                      |

## 6. Métodos del componente GestionParametrizacion
### 6.1 Métodos de ciclo de vida
| Método              | Descripción                                                                                                                                             |
|---------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ngOnInit()`        | Inicializa el componente: carga todos los parámetros y la qna activa. Usa Promise.resolve() para carga asíncrona.                                       |
| `ngOnDestroy()`     | Cierra todos los diálogos abiertos al destruir el componente.                                                                                           |
| `ngAfterViewInit()` | Configura el paginador de la tabla después de que la vista se inicializa.                                                                               |

### 6.2 Métodos de carga de datos
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `loadQnaActivated()`  | Obtiene la quincena activa desde `GET /calendario/activa`. Actualiza `calendarioActual` y maneja errores.                             |
| `getAllParam()`       | Obtiene todos los parámetros desde `GET /salario-minimo`. Actualiza `dataSource.data` y `totalElements`.                              |

### 6.3 Métodos de manipulación de archivos
No aplica - Este módulo no tiene funcionalidad de descarga de archivos.

### 6.4 Métodos de validación
No aplica - Este módulo gestiona parámetros, las validaciones se realizan en los diálogos y en el backend.

### 6.5 Métodos de edición de registros
| Method                        | Description                                                                                                                           |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `openCreateDialog()`          | Abre el diálogo de alta de parámetro en modo 'create'. Al cerrar con refresh true, recarga la lista de parámetros.                    |
| `openUpdateDialog(param)`     | Abre el diálogo de edición de parámetro en modo 'update' con el parámetro seleccionado. Al cerrar con refresh true, recarga la lista. |
| `softDeleteParam(paramId)`    | Abre diálogo de confirmación para eliminar. Si se confirma, llama al servicio para soft delete y recarga la lista.                    |

### 6.6 Métodos de procesamiento
No aplica - Este módulo gestiona parámetros, no procesa datos adicionales.

### 6.7 Métodos de búsqueda
No aplica - Este módulo no tiene funcionalidad de búsqueda.

### 6.8 Métodos auxiliares
No aplica - Este módulo no tiene métodos auxiliares adicionales.

## 7. Prueba operativa mínima
1. Arrancar el perfil local y confirmar el puerto en el log.
2. Abrir `/src/environments/environment.ts`, cambiar la ruta a localhost, o descomentar esa ruta y comentar la de prod.
3. Hacer login
4. Obtener JWT con `POST /users/getToken` y usar `Authorize`.
5. Entrar al módulo y verificar:
- Que se cargue la qna activa correctamente.
- Que se cargue la lista de parámetros correctamente.
- Que la paginación funcione.
- Que el diálogo de creación funcione.
- Que el diálogo de edición funcione.
- Que el diálogo de confirmación de eliminación funcione.
- Que al crear, editar o eliminar se recargue la lista.
* NOTA IMPORTANTE:
- Si no se puede ingresar al swagger, puedes hacer primero pruebas en el postman.

## 8. Criterios al modificar el módulo
- Conservar `ApiResponse` en todos los services.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentación o logs compartidos.
- En caso de que se integren nuevas variables, revisar primero los modelos para ver si coincidan con lo que es el nuevo requerimiento.
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por qué el cambio y si no afecta en el demás flujo.
- Si se agregan columnas a la tabla, actualizar `displayedColumns` y el HTML correspondiente.
- Mantener la consistencia en el uso del diálogo `AltaParametrizacionDialog` para creación y edición.
- Preservar el comportamiento de recarga automática después de crear, editar o eliminar.
- El soft delete debe mantenerse como método de eliminación para no perder datos históricos.
- La inicialización con Promise.resolve() en ngOnInit es crítica para asegurar la carga correcta de datos.
