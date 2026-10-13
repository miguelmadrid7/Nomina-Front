# Terceros - historico de carga

- Nombre del modulo(Vista):
- Historico carga de terceros

## 1. Objetivo y alcance
Muestra el historial de los conceptos cargados y validados
En la vista:
- Se observa la qna proceso o qna activa(es lo mismo), viene de un endpoint del lado del backend
- Se observa un select que hace la seleccion de un cpto, dicho cpto viene de un endpoint del lado del backend
- Se observan los filtros de seleccion del año, qna 
- Se observan do botones:
* Limpiar: Unicamente hace lo siguiente, si hay filtros activos ejemplo el cpto seleccionado o los filtros de la fecha, limpia dichos filtros
* Reporte: Se deben de aplicar los filtros en caso de que se requiera ejemplo se selecciona el cpto año, qna y se muestra el cpto en la tabla y se da clic en el icono que se muestra en la columna de acciones

- Flujo funcional:
1. Al ingresar al modulo, carga en automatico el historico de los cpto aplicados en la qna activa
2. Se muestran los filtros a aplicar, en caso UNICAMENTE CUANDO SE REQUIERA DESCARGAR UNO ESPECIFICO
3. Se hace descarga genral de todos con el boton de Reporte 
4. Se descarga un excel en la forma que se haya seleccionado ya sea por filtros o de manera general

## 2. Mapa de codigo
- Ruta del modulo:
src/app/features/nomina/percepciones-informadas

- Clases involucradas:
```text
    src/app/features/terceros/historico-terceros
        historico-terceros/
            historico-terceros.ts
            historico-terceros.html
            historico-terceros.css

    src/app/core/services/
        calendario.service.ts
        toast.service.ts
        calendario.service.ts

    src/app/core/model/
        calendario.model.ts
    src/app/core/model/terceros
        tercero-conceptos.model.ts
        tercero-historico.model.ts
```


## 3. API(Service)
|Metodo  | Ruta                          | Uso                                                                                            |
|--------|-------------------------------|------------------------------------------------------------------------------------------------|
| GET    | `/calendario/activa`          | Muestra la qna activa, esto se controla en el backend por medio de un endpoint de true/false   |
| GET    | `/terceros/conceptos`         | Lista los conceptos configurados para terceros con su layout y movimientos permitidos.         |
| GET    | `/terceros/historico`         | Lista lotes procesados distintos por concepto, quincena y fecha de carga.                      |
| GET    | `/terceros/descargar-reporte` | Descarga XLSX del historico. `qnaProceso`, `concepto` y `fechaCarga` son opcionales (ver 3.2). |

## 4. Layouts XLS, XLSX
No aplica, ay que se descargan con la siguiente estructura:
- RFC
- CURP
- NOMBRE
- NUMERO DOCUMENTO
- TIPO MOVIMIENTO
- CONCEPTO
- IMPORTE
- QNA PROCESO
- DESDE
- QNA INICO
- QNA FIN
- ESTATUS
- FECHA CARGA

## 5. Regla de validacion de negocio
Las reglas de aceptacion solicitadas actualmente son:
1. El archivo de descarga debio de haber pasado por todas la validacines mencionadas en el archivo de carga_terceros.md

## 6. Semantica de movimientos
No aplica como tal, unicamente en la columna del xls, debe de mostrar siempre ESTATUS = "ACEPTADO", si a estas alturas muestra otro estatus, algo esta mal a nivel de logica

## 7. Diagrama de clases
| Componente principal      | Servicios               | Modelos                 | Modelos de request       | Modelos de response       |
|---------------------------|-------------------------|-------------------------|--------------------------|---------------------------| 
| `HistoricoTerceros`       | `CalendarioService`     | `Calendario`            | -                        | -                         |
|                           | `TerceroService`        | `TerceroConcepto`       |                          |                           |
|                           | `ToastService`          | `TerceroHistorico`      |                          |                           |

## 8. Métodos del componente HistoricoTerceros
### 8.1 Métodos de ciclo de vida
| Método        | Descripción                                                                                                                                             |
|---------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ngOnInit()`  | Inicializa el componente: genera años y quincenas, carga quincena activa, carga conceptos y configura filtros con debounce de 200ms.                    |

### 8.2 Métodos de carga de datos
| Método                                   | Descripción                                                                                                                                                    |
|------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `loadQnaActivated()`                     | Obtiene la quincena activa desde `GET /calendario/activa`. Actualiza `calendarioActual` y carga automáticamente el histórico de esa quincena.                  |
| `cargarConceptos()`                      | Obtiene la lista de conceptos desde `GET /terceros/conceptos`. Ordena alfabéticamente por clave y maneja errores.                                              |
| `loadHistorico(qnaProceso, concepto)`    | Carga histórico desde `GET /terceros/historico`. Acepta filtro opcional por concepto. Actualiza `historico` y aplica paginación local.                         |

### 8.3 Métodos de manipulación de archivos
| Método                                            | Descripción                                                                                                                                                                  |
|---------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `downloadExcel(qnaProceso, concepto, fechaCarga)` | Descarga reporte XLSX desde `GET /terceros/descargar-reporte`. Muestra toast persistente durante descarga. Extrae filename del response y guarda el blob.                    |
| `onDownloadReport()`                              | Descarga reporte general de la quincena activa sin filtros adicionales.                                                                                                      |
| `onDownloadRepor()`                               | Descarga reporte aplicando los filtros seleccionados (año, quincena, concepto).                                                                                              |
| `onDownloadRow(row)`                              | Descarga reporte específico de una fila del histórico usando su qnaProceso, concepto y fechaCarga.                                                                           |


### 8.4 Métodos de búsqueda y filtros
| Método              | Descripción                                                                                                          |
|---------------------|----------------------------------------------------------------------------------------------------------------------|
| `aplicateFilters()` | Aplica los filtros seleccionados (año, quincena, concepto). Usa qnaFilter si está presente, sino usa qnaActive.      |
| `cleanFilters()`    | Limpia todos los filtros (año, quincena, concepto) y recarga el histórico con la quincena activa.                    |

### 8.5 Métodos auxiliares
| Método                     | Descripción                                                                                                        |
|----------------------------|--------------------------------------------------------------------------------------------------------------------|
| `onPageChange(event)`      | Maneja cambio de página en paginador local. Actualiza `pageSize` y `pageIndex`, refresca la página actual.         |
| `refreshPage()`            | Refresca la página actual aplicando paginación local sobre el array `historico`.                                   |
| `toServerDateTime(value)`  | Convierte una fecha string a formato ISO datetime para enviar al servidor (YYYY-MM-DDTHH:mm:ss.SSS).               |
| `qnaFilter` (getter)       | Construye quincena completa en formato `AAAAQQ` a partir de los filtros de año y quincena.                         |
| `qnaCompleta` (getter)     | Construye quincena completa en formato `AAAAQQ` a partir de `calendarioActual.ejercicio` y `calendarioActual.qna`. |


## 9. Prueba operativa minima
1. Arrancar el perfil local y confirmar el puerto en el log.
2. Abrir `/src/environments/environment.ts`, cambiar la ruta a localhost, o descomentar esa ruta y comentar la de prod.
3. Hacer login
4. Obtener JWT con `POST /users/getToken` y usar `Authorize`.
5. Entrar el modulo y probar flujo, pero una ves validado que este en ejecuion el proyecto en env de localhost
* NOTA IMPROTENTE:
- Si no se puede ingresar al swagger, puedes hacer primero pruebas en el postman, el lo mismo.


## 10. Criterios al modificar el modulo
- Conservar `ApiResponse` en todos los services.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentacion o logs compartidos.
- En caso de que se integren nuevas varibales, revisar primero los modelos para ver si coincidan con lo que es el nuevo requerimiento