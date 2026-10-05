# Nomina - Historico percepciones informadas

- Nombre del modulo(Vista):
- Historico de percepiones informadas

## 1. Objetivo y alcance
El módulo permite consultar el histórico de cargas de percepciones informadas que ya fueron procesadas y enviadas a nómina. Proporciona funcionalidades de filtrado por año, quincena y concepto, además de permitir la descarga de reportes en formato Excel.

En la vista:
- Se observa la qna activa (viene de un endpoint del backend) como valor por defecto
- Se muestran filtros por:
- Año: Dropdown con años disponibles (generados dinámicamente)
- Quincena: Dropdown con quincenas del 1 al 24
- Concepto: Dropdown con conceptos predefinidos (ME, MG, VM, 37, TP, OA, OL, TE, 7S)
- Se muestra una tabla paginada con el histórico de cargas
- Cada fila muestra: concepto, qna proceso, fecha de carga y botón de acciones
- Se muestra un botón principal para descargar el reporte completo según los filtros aplicados
- Cada fila tiene un botón individual para descargar el reporte específico de esa carga

- Flujo funcional:
- Al cargar la vista, se obtiene la qna activa del calendario
- Se generan dinámicamente los años disponibles (año actual ± 1)
- Se cargan las quincenas disponibles (1-24)
- Si no se aplican filtros manuales, se carga el histórico de la qna activa
- El usuario puede aplicar filtros por año, quincena y concepto
- Los filtros se aplican automáticamente con un debounce de 200ms
- La tabla muestra los resultados paginados (10 registros por página por defecto)
- El usuario puede:
* Descargar el reporte completo según los filtros aplicados
* Descargar el reporte específico de una fila individual
* Limpiar los filtros para volver a la qna activa

## 2. Mapa de codigo
- Ruta del modulo:
```text
    src/app/features/nomina/historico-percepciones-informadas/
        historico-percepciones-informadas/
            historico-percepciones-informadas.ts
            historico-percepciones-informadas.html
            historico-percepciones-informadas.css
    
    src/app/core/services/
        calendario.service.ts
        toast.service.ts
        percepciones-informadas.service.ts

    src/app/shared/helpers/
        date-years.helper.ts
        file-download.helper.ts

```

## 3. API(Service)
| Metodo   |          Ruta                              | Uso                                                         |
|----------|--------------------------------------------|-------------------------------------------------------------|
| GET      | `/calendario/activa`                       | Muestra la qna activa                                       |
| GET      | `/nom-emp-pza-cpto/historico`              | Obtiene el histórico de cargas procesadas                   |
| GET      | `/nom-emp-pza-cpto/descargar-validaciones` | Descarga el Excel con las validaciones aplicadas            |

## 4. Regla de validacion de negocio
1. Reglas de Consulta
- Solo lectura: El módulo no permite modificar ni eliminar registros históricos
- Datos procesados: Solo muestra cargas que ya fueron enviadas a nómina (no staging)
- qna obligatoria: Siempre se requiere una quincena de proceso para consultar (formato AAAAQQ)
2. Reglas de Filtrado
- qna por defecto: Si no se aplican filtros manuales, usa la qna activa del calendario
- Filtros opcionales: Año, quincena y concepto son filtros opcionales
- Debounce automático: Los filtros se aplican automáticamente después de 200ms de inactividad para evitar llamadas excesivas
3. Reglas de Conceptos
- Conceptos predefinidos: Solo se permiten los siguientes conceptos:
ME, MG, VM, 37, TP, OA, OL, TE, 7S
- Validación de concepto: Si se selecciona un concepto, debe coincidir con uno de los predefinidos
4. Reglas de Descarga
- Prevenir descargas múltiples: No permite descargas simultáneas (flag isDownloadingReporte)
- Nombre de archivo: El archivo descargado se nombra con el formato: percepciones_qna{AAAAQQ}_{concepto}.xlsx
- Descarga por fila: Cada fila tiene su propia fecha de carga para descargar el reporte específico
5. Reglas de Paginación
- Paginación cliente: La paginación se maneja en el frontend (slice del array)
- Tamaño por defecto: 10 registros por página
- Reset al filtrar: Al aplicar filtros, la página se resetea a 0


## 6. Diagrama de clases
| Componente principal              | Servicios                       | Modelos                 | Modelos de request       | Modelos de response       |
|-----------------------------------|---------------------------------|-------------------------|--------------------------|---------------------------| 
| `HistoricoPercepcionesInformadas` | `CalendarioService`             | `Calendario`            | -                        | -                         |
|                                   | `PercepcionesInformadasService` | `HistoricoCarga`        |                          |                           |
|                                   | `ToastService`                  |                         |                          |                           |

## 7. Métodos del componente HistoricoPercepcionesInformadas

### 7.1 Métodos de ciclo de vida
| Método        | Descripción                                                                                                                                             |
|---------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ngOnInit()`  | Inicializa el componente: genera años y quincenas, carga quincena activa y configura filtros con debounce de 200ms.                                     |

### 7.2 Métodos de carga de datos
| Método                                   | Descripción                                                                                                                                                    |
|------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `loadQnaActivated()`                     | Obtiene la quincena activa desde `GET /calendario/activa`. Actualiza `calendarioActual` y aplica filtros automáticamente.                                      |
| `loadHistorico(qnaProceso, concepto)`    | Carga histórico desde `GET /nom-emp-pza-cpto/historico`. Acepta filtro opcional por concepto. Actualiza `historico` y aplica paginación local.                 |

### 7.3 Métodos de manipulación de archivos
| Método                                            | Descripción                                                                                                                                                                  |
|---------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `downloadExcel(qnaProceso, concepto, fechaCarga)` | Descarga reporte XLSX desde `GET /nom-emp-pza-cpto/descargar-validaciones`. Muestra toast persistente durante descarga. Guarda el blob con nombre formateado.                |
| `onDownloadReport()`                              | Descarga reporte general según los filtros aplicados (año, quincena, concepto).                                                                                              |
| `onDownloadRow(row)`                              | Descarga reporte específico de una fila del histórico usando su qnaProceso, concepto y fechaCarga.                                                                           |

### 7.4 Métodos de validación
No aplica - Este módulo es de consulta únicamente, no realiza validaciones de negocio.

### 7.5 Métodos de edición de registros
No aplica - Este módulo es de consulta únicamente, no permite edición.

### 7.6 Métodos de procesamiento
No aplica - Este módulo es de consulta únicamente, no procesa datos.

### 7.7 Métodos de búsqueda y filtros
| Método           | Descripción                                                                                                          |
|------------------|----------------------------------------------------------------------------------------------------------------------|
| `applyFilters()` | Aplica los filtros seleccionados (año, quincena, concepto). Usa qnaFiltro si está presente, sino usa qnaActiva.      |
| `clearFilters()` | Limpia todos los filtros (año, quincena, concepto) y recarga el histórico con la quincena activa.                    |

### 7.8 Métodos auxiliares
| Method                     | Description                                                                                                        |
|----------------------------|--------------------------------------------------------------------------------------------------------------------|
| `onPageChange(event)`      | Maneja cambio de página en paginador local. Actualiza `pageSize` y `pageIndex`, refresca la página actual.         |
| `refreshPage()`            | Refresca la página actual aplicando paginación local sobre el array `historico`.                                   |
| `toServerDateTime(value)`  | Convierte una fecha string a formato ISO datetime para enviar al servidor (YYYY-MM-DDTHH:mm:ss.SSS).               |
| `qnaActiva` (getter)       | Construye quincena completa en formato `AAAAQQ` a partir de `calendarioActual`.                                    |
| `qnaFiltro` (getter)       | Construye quincena completa en formato `AAAAQQ` a partir de los filtros de año y quincena.                         |



## 5. Prueba operativa minima
1. Arrancar el perfil local y confirmar el puerto en el log.
2. Abrir `/src/environments/environment.ts`, cambiar la ruta a localhost, o descomentar esa ruta y comentar la de prod.
3. Hacer login
4. Obtener JWT con `POST /users/getToken` y usar `Authorize`.
5. Entrar al módulo y verificar:
- Que se cargue la qna activa correctamente
- Que los filtros funcionen correctamente
- Que la paginación funcione
- Que la descarga de reportes funcione
* NOTA IMPORTANTE:
- Si no se puede ingresar al swagger, puedes hacer primero pruebas en el postman.

## 9. Criterios al modificar el modulo
- Conservar `ApiResponse` en todos los services.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentacion o logs compartidos.
- En caso de que se integren nuevas varibales, revisar primero los modelos para ver si coincidan con lo que es el nuevo requerimiento
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por que el cambio y si no afecta en el demas flujo
- Mantener la consistencia en el formato de qna (AAAAQQ) en todas las operaciones
- Preservar el comportamiento de debounce en los filtros para evitar llamadas excesivas al backend