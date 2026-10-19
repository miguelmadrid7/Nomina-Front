# Cálculo de Nómina  
  
- Nombre del módulo (Vista): 
- Cálculo de nómina 
  
## 1. Objetivo y alcance  
* En este módulo se hace  el cálculo de nómina quincenal por año y quincena, visualizar los registros por empleado (CURP, RFC, nombre, nivel de sueldo, concepto e importe), filtrar en cliente, inspeccionar el desglose de conceptos por empleado y exportar el resultado a Excel.  
En la vista:

- Flujo funcional:  
- Se observa la qna proceso o qna activa(es lo mismo), viene de un endpoint del lado del backend
- Se observa un searhBar la funcionalidad hace buscar un trabajador activo
- Se observan dos select que hace la seleccion de un la qna y año
- El usuario selecciona **Año** y **Quincena** en el encabezado de la tabla.  
- `showRecordsTable()` activa la vista y llama a `refresh()`.  
- `refresh()` concatena año + quincena → `qnaProceso` (YYYYQQ).  
- `fetchNomina()` llama a `NominaService.getCalculation()`.  
- `adaptResponse()` elige el concepto aplicable por empleado y carga `MatTableDataSource`.  
- El usuario filtra por CURP/RFC/Nombre (en cliente), abre el diálogo de conceptos (`NominaordConceptoDialog`) o descarga Excel.  
  
## 2. Mapa de código  
- Ruta del módulo: 
src/app/features/nomina/calculo-nomina-ordinaria/

- Clases involucradas:
```text
    src/app/features/nomina/calculo-nomina-ordinaria/
        calculo-nomina-ordinaria/
            calculo-nomina.ts
            calculo-nomina.html
            calculo-nomina.css
    
    src/app/core/services/
        calendario.service.ts
        toast.service.ts
        PayrollJobService.service.ts

    src/app/core/model/
        calendario.model.ts
        conceptoExtra.model.ts
        stepExecution.model.ts

    src/app/shared/helpers/
        date-years.helper.ts
        nomina.helper.ts

    src/app/shared/validators/
        validaciones.validators.ts
```

## 3. API (Service)  
| Metodo |          Ruta                 | Uso 
|--------|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| GET    | `/calendario/activa`          | Muestra la qna activa, esto se controla en el backend por medio de un endpoint de true/false                                                                                                                                    |
| GET    | `/calendario/conceptos-extra` | Muestra los conceptos extra qu se deben de aplicar para la qna activa(qna proceso)                                                                                                                                              |
| POST   | `/calculation/execute`        | Es el boton de calculo de nomina, manda la peticion al back para que se emepiecen a ejeuctar todo el proceso del calculo de la nomina                                                                                           |
| POST   | `/topic/payroll/${jobId}`     | Es la puerta abierta entre el back y la bd es la ejecucion del websocke en tiempo real de la sincronizacion de la ejecuicon de los SP                                                                                           |
| GET    | `/calculation/status/${id}`   | Muestra la sincronizacion entre front y back y manda el estatus de ejecucion de cada peticion que se hace durante la ejecucion del proceso de nomina, manda "RUNING" y si fallo "ERROR" y si se completo manda un "COMPLETE"    |
| GET    | `/calculation/nomina-cheque`  | Muestra el resultado del proceso de la qna ya calculada, se muestra en un dialogo                                                                                                                                               |

  
## 4. Reglas de validación de negocio  
1. **`qnaProceso` obligatorio**: si año/quincena son inválidos, `refresh()` limpia la tabla y no llama al backend.  
2. **Formato YYYYQQ**: quincena con `padStart(2,'0')` (ej. 2026 + 01 → `202601`).  
3. **Concepto aplicable** (`isApplicableConcept`): un concepto es válido si `qnaProceso === target` o si `qnaIni <= target <= qnaFin`.  
4. **Selección de concepto** (`pickConcept`): prioriza coincidencia exacta de `qnaProceso`, luego rango aplicable, luego el primero.  Si ninguno aplica, el empleado se descarta del resultado  (`adaptResponse` filtra `null`).  
5. **Filtros en cliente**: `filterPredicate` exige que las tres condiciones (CURP, RFC, nombre) se cumplan simultáneamente  (`AND`), con `includes` en minúsculas.  
6. **Autenticación**: `AuthGuard` bloquea la ruta si `LoginService.isAuthenticated()` falla y redirige a `/login` con `returnUrl`.  
7. **SSR-safe**: el token solo se lee de `localStorage` cuando `isPlatformBrowser` es verdadero.  
  
## 5. Diagrama de clases
| Componente principal      | Servicios               | Modelos                 | Modelos de request       | Modelos de response       |
|---------------------------|-------------------------|-------------------------|--------------------------|---------------------------| 
| `CalculoNominaComponent`  | `CalendarioService`     | `Calendario`            | -                        | -                         |
|                           | `ToastService`          | `ConceptoExtra`         |                          |                           |
|                           | `PayrollJobService`     | `StepExecution`         |                          |                           |

## 6. Métodos del componente CalculoNominaComponent

### 6.1 Métodos de ciclo de vida
| Método        | Descripción                                                                                                                                             |
|---------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ngOnInit()`  | Inicializa el componente: carga calendario actual, carga conceptos extra y se suscribe al estado del job de nómina.                                     |

### 6.2 Métodos de carga de datos
| Método                                  | Descripción                                                                                                                                                    |
|-----------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `cargarCalendarioActual()`              | Obtiene la quincena activa desde `GET /calendario/activa`. Actualiza `calendarioActual` y patchea el formulario con año y quincena.                            |
| `cargarConceptosExtra()`                | Obtiene conceptos extra desde `GET /calendario/conceptos-extra`. Inicializa `conceptoSeleccionado` con todos los conceptos disponibles.                        |

### 6.3 Métodos de ejecución
| Método                    | Descripción                                                                                                                              |
|---------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| `executePayrollProcess()` | Inicia el proceso de cálculo de nómina mediante `POST /calculation/execute`. Construye qnaProceso y llama al servicio PayrollJobService. |

### 6.8 Métodos auxiliares
| Method                            | Description                                                                                                        |
|-----------------------------------|--------------------------------------------------------------------------------------------------------------------|
| `toggleConcepto(key)`             | Activa/desactiva un concepto extra en el Set `conceptoSeleccionado`.                                               |
| `isConceptoSeleccionado(key)`     | Verifica si un concepto está seleccionado.                                                                         |
| `getExecution(stepIndex)`         | Obtiene el historial de ejecución de un paso específico.                                                           |
| `recomputeStepIndex()`            | Recalcula el índice del paso actual basado en el progreso.                                                         |
| `subscribeToJobState()`           | Se suscribe al estado del job de nómina para actualizar progreso, errores y pasos en tiempo real.                  |
| `qnaDisplay` (getter)             | Construye la quincena en formato QQ / AAAA para visualización.                                                     |
| `totalDurationFormatted` (getter) | Formata la duración total del proceso en formato legible.                                                          |
| `currentStepIndex` (getter)       | Retorna el índice del paso actual.                                                                                 |

## 7. Prueba operativa mínima  
1. Login válido → navegar a `/home/nomina/ordinaria`.  
2. Clic en **"Ver Registros"** con año=2026, quincena=01.  
3. Verificar que la tabla muestra filas con `qnaProceso = 202601`.  
4. Filtrar por un CURP/RFC/nombre existente → reduce filas;  **"Limpiar filtros"** restaura año=2026, qna=01.  `empleadoId`, `nombreEmpleado`, `conceptos`, `curp`, `rfc`.  
6. Clic en **"Descarga CSV"** → descarga `Calculo_Nomina.xlsx`.  
7. Cerrar sesión y reintentar la ruta → redirige a `/login`.  
  
## 8. Criterios al modificar el módulo  
- **No cambiar el contrato de headers** en `getCalculation()` sin coordinar con el backend: usa `@RequestHeader`, no query params.  
- **Mantener el formato `qnaProceso`** (YYYYQQ); `adaptResponse`, `downloadExcel` y el diálogo dependen de él.  
- Si se agregan columnas a `displayedColumns`, actualizar el `.html`(matColumnDef) y, si aplica, el `filterPredicate`.  
- `adaptResponse` descarta empleados sin concepto aplicable: al  modificar `isApplicableConcept`/`pickConcept` verificar que no se filtren registros válidos.  
- Nuevos parámetros de consulta deben agregarse en el componente, en la firma del servicio y como header condicional.  
- Cualquier cambio debe seguir funcionando con `AuthGuard` (sesión válida) y en SSR (`isPlatformBrowser`).  
- `NominaExtraordinaria` está vacía (esqueleto); si se implementa, reutilizar el patrón de `NominaOrdinaria`.  