# Visualizar nómina ordinaria

- Nombre del módulo (Vista):
- Consulta nómina ordinaria

## 1. Objetivo y alcance
Consultar la nómina ordinaria ya calculada de una quincena, localizar trabajadores y revisar el detalle de conceptos (percepciones y deducciones) de cada comprobante.

En la vista:
- Se observa la qna proceso o qna activa (viene de un endpoint del backend)
- Se muestran dos selects para seleccionar año y quincena
- Se muestra un searchBar para buscar por CURP, RFC o nombre del trabajador
- Se muestra una tabla paginada con los registros de nómina
- Cada fila muestra: CURP, RFC, nombre del empleado, qna proceso, clave de plaza, base de cálculo ISR y concepto detalle
- Cada fila tiene un botón para ver el detalle de conceptos
- Se muestra un botón para limpiar filtros

- Flujo funcional:
1. Al cargar la vista, se obtiene la qna activa del calendario
2. Se generan dinámicamente los años disponibles (año actual ± 1)
3. Se cargan las quincenas disponibles (1-24)
4. El usuario selecciona año y quincena
5. Se carga la nómina de esa quincena mediante `GET /calculation/nomina-cheque`
6. Los registros se agrupan por empleado y se muestran en la tabla
7. El usuario puede filtrar por CURP, RFC o nombre (en cliente)
8. El usuario puede ver el detalle de conceptos de un empleado en un diálogo
9. El usuario puede limpiar los filtros para volver al estado inicial

## 2. Mapa de código
- Ruta del módulo:
src/app/features/nomina/visualizar-nomina-ordinaria/

```text
    src/app/features/nomina/visualizar-nomina-ordinaria/
        nomina-ordinaria.ts
        nomina-ordinaria.html
        nomina-ordinaria.css

    src/app/core/services/
        nomina-ordinaria.service.ts
        calendario.service.ts
        toast.service.ts
        loader.service.ts

    src/app/core/model/
        nomina-Row.model.ts
        calendario.model.ts

    src/app/shared/helpers/
        nomina.helper.ts
        date-years.helper.ts

    src/app/shared/dialogs/
        nominaord-concepto-dialog/
```

## 3. API (Service)
| Metodo   |          Ruta                              | Uso                                                         |
|----------|--------------------------------------------|-------------------------------------------------------------|
| GET      | `/calendario/activa`                       | Muestra la qna activa                                       |
| GET      | `/calculation/nomina-cheque`               | Obtiene la nómina calculada de una quincena específica      |

## 4. Reglas de validación de negocio
1. **qnaProceso obligatorio**: Si no se selecciona año y quincena, no se carga la nómina.
2. **Formato YYYYQQ**: La quincena se construye con `padStart(2,'0')` (ej. 2026 + 01 → `202601`).
3. **Filtro en cliente**: La búsqueda se realiza en cliente filtrando por CURP, RFC o nombre (case insensitive).
4. **Agrupación por empleado**: Los registros se agrupan por empleado (RFC, CURP, noComprobante) para mostrar un resumen.
5. **Detalle de conceptos**: Al hacer clic en una fila, se abre un diálogo con el detalle de conceptos de ese empleado.
6. **Paginación cliente**: La paginación se maneja en el frontend (slice del array).
7. **Debounce en cambio de qna**: Se usa un debounce de 0ms para evitar múltiples llamadas al cambiar la quincena.

## 5. Diagrama de clases
| Componente principal      | Servicios               | Modelos                 | Modelos de request       | Modelos de response        |
|---------------------------|-------------------------|-------------------------|--------------------------|----------------------------| 
| `NominaOrdinaria`         | `CalendarioService`     | `Calendario`            | -                        | -                          |
|                           | `NominaService`         | `NominaRow`             |                          | `ApiResponse<NominaRow[]>` |
|                           | `ToastService`          |                         |                          |                            |
|                           | `LoaderService`         |                         |                          |                            |

## 6. Métodos del componente NominaOrdinaria
### 6.1 Métodos de ciclo de vida
| Método              | Descripción                                                                                                                                             |
|---------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ngOnInit()`        | Inicializa el componente: genera años y quincenas, configura filtro de búsqueda, carga qna activa y carga nómina.                                       |
| `ngOnDestroy()`     | Cierra todos los diálogos abiertos al destruir el componente.                                                                                           |
| `ngAfterViewInit()` | Configura el paginador de la tabla después de que la vista se inicializa.                                                                               |

### 6.2 Métodos de carga de datos
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `loadQnaActivated()`  | Obtiene la quincena activa desde `GET /calendario/activa`. Actualiza `calendarioActual` y maneja errores.                             |
| `loadNomina()`        | Construye qnaProceso y llama a `getNomina()` para cargar la nómina.                                                                   |
| `getNomina()`         | Obtiene la nómina desde `GET /calculation/nomina-cheque`. Agrupa registros por empleado y actualiza la tabla.                         |


### 6.7 Métodos de búsqueda y filtros
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `applySearchFilter()` | Aplica el filtro de búsqueda por CURP, RFC o nombre. Valida que se hayan seleccionado año y quincena.                                 |
| `onQnaChange()`       | Maneja el cambio de año/quincena con debounce. Carga la nómina si ambos están seleccionados.                                          |
| `clearFilters()`      | Limpia todos los filtros (año, quincena, búsqueda) y resetea la tabla.                                                                |

### 6.8 Métodos auxiliares
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `openConceptosDialog(row)` | Abre el diálogo de detalle de conceptos para un empleado específico.                                                             |

## 7. Prueba operativa mínima
1. Arrancar el perfil local y confirmar el puerto en el log.
2. Abrir `/src/environments/environment.ts`, cambiar la ruta a localhost, o descomentar esa ruta y comentar la de prod.
3. Hacer login
4. Obtener JWT con `POST /users/getToken` y usar `Authorize`.
5. Entrar al módulo y verificar:
- Que se cargue la qna activa correctamente
- Que los selects de año y quincena funcionen
- Que al seleccionar año y quincena se cargue la nómina
- Que el filtro de búsqueda funcione correctamente
- Que el diálogo de conceptos se abra correctamente
- Que el botón de limpiar filtros funcione
* NOTA IMPORTANTE:
- Si no se puede ingresar al swagger, puedes hacer primero pruebas en el postman.

## 8. Criterios al modificar el módulo
- Conservar `ApiResponse` en todos los services.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentación o logs compartidos.
- En caso de que se integren nuevas variables, revisar primero los modelos para ver si coincidan con lo que es el nuevo requerimiento.
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por qué el cambio y si no afecta en el demás flujo.
- Mantener la consistencia en el formato de qna (YYYYQQ) en todas las operaciones.
- Si se agregan columnas a la tabla, actualizar `displayedColumns` y el HTML correspondiente.
- Preservar el comportamiento de debounce en el cambio de qna para evitar llamadas excesivas al backend.  