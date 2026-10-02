# Terceros — carga y proceso de movimientos informados

- Nombre del modulo(Vista):
- Carga de terceros

## 1. Objetivo y alcance
El modulo recibe archivos TXT de ancho fijo proporcionados por terceros.
En la vista:
- Se observa la qna proceso o qna activa(es lo mismo), viene de un endpoint del lado del backend
- Se observa un select que hace la seleccion de un cpto, dicho cpto viene de un endpoint del lado del backend
- Se muestra el boton de cargar TXT, en este caso seria el layout proporcionado por terceros
- Al hacer la carga se hace validaciones, tales como: 
* El cpto seleccionado coincida con el layout cargado
* El tamaño en posisiones coincida con los formatos de ilimitados = 100 posisiones y limitados = 180 posiones 
* No haya duplicaciones en el lote cargado
* La plaza si este autorizada con el cpto cargado
- Ya validado, se muestran 4 botones:
* Cargar: Su funcionalida es para hacer la carga del layout
* Revalidar: Su funcion es para cuando se haga alguna modificacion directa en la tabla de la validacion, consultar, agregar, editar o eliminar filas temporales
* Procesar: Su funcinalidad, es que hace el volcado de la informacion temporal a la tabla para el calculo de la nomina
* Ver lotes: Son los lotes cargados que esten en staging(Espera)

- Flujo funcional:
1. Cargar TXT y seleccionar concepto/quincena, en este caso se toma la qna activa.
2. Parsear cada linea segun el layout del concepto.
3. Guardar en `tmp_terceros`.
4. Validar duplicados.
5. Consultar, agregar, editar o eliminar filas temporales.
6. Revalidar el lote.
7. Procesar altas, bajas o modificaciones en `nom_emp_pza_cpto`.
8. Guardar snapshot en `nom_historico_terceros`.
9. Eliminar el lote temporal dentro de la misma transaccion.

## 2. Mapa de codigo
- Ruta del modulo:
src/app/features/terceros/carga-terceros-inst-noinst

- Clases involucradas:
```text
    src/app/features/terceros/carga-terceros-inst-noinst
        carga-terceros-inst-noinst/
            carga-terceros-inst-noinst.ts
            carga-terceros-inst-noinst.html
            carga-terceros-inst-noinst.css
    
    src/app/core/services/
        tercero.service.ts
        toast.service.ts
        calendario.service.ts
    
    src/app/core/model/
        calendario.model.ts
    src/app/core/model/terceros
        tercero-conceptos.model.ts
        tercero-row.model.ts
        tercero-lote.model.ts
        tercero-historico.model.ts
    src/app/core/model/response/terceros
        tercero-carga-response.model.ts
        tercero-procesar-response.model.ts
    src/app/core/model/request/terceros
        tercero-lote-request.model.ts
        tercero-registro-request.model.ts
```

## 3. API(Service)
Metodo |          Ruta                 | Uso 
GET    | `/calendario/activa`          | Muestra la qna activa, esto se controla en el backend por medio de un endpoint de true/false 
GET    | `/terceros/conceptos`         | Lista los conceptos configurados para terceros con su layout y movimientos permitidos. 
POST   | `/terceros/cargar-txt`        | Multipart: carga TXT y valida el lote. 
POST   | `/terceros/validar`           | Revalida por `qnaProceso + concepto`. 
GET    | `/terceros/personalizar`      | Lista staging con paginacion, estatus y busqueda. 
DELETE | `/terceros/personalizar/{id}` | Elimina una fila temporal. 
PUT    | `/terceros/personalizar/{id}` | Edita una fila y revalida el lote. 
POST   | `/terceros/procesar`          | Aplica movimientos, crea snapshot y limpia staging atomicamente. 
GET    | `/terceros/lotes`             | Resume lotes pendientes. 
DELETE | `/terceros/borrar-lote`       | Elimina staging por quincena y concepto. 


### 3.1 Carga multipart
POST /terceros/cargar-txt` consume `multipart/form-data`:
Campo            | Tipo     | Requerido | Nota 
`file`           | TXT      | Si        | Se declara con `@RequestPart` para que Swagger muestre selector de archivo. 
`qnaProceso`     | Integer  | Si        | Preferido en formato `AAAAQQ`, por ejemplo `202522`. 
`concepto`       | String   | Si        | Normalizado a mayusculas; debe coincidir con el TXT. 
`importeDefault` | Decimal  | No        | En `ILIMITADO` solo reemplaza el importe cuando el archivo trae cero; en `LIMITADO` tiene precedencia sobre el importe del archivo. 

### 3.2 Filtros del reporte XLSX
`GET /terceros/descargar-reporte` acepta `qnaProceso`, `concepto` y `fechaCarga`, los tres opcionales y combinables:
qnaProceso | concepto | Resultado 
Si         | Si       | Movimientos de ese concepto en esa quincena. 
Si         | No       | Todos los conceptos de esa quincena. 
No         | Si       | Ultima quincena **de ese concepto** (`findMaxQnaProcesoByConcepto`). 
No         | No       | Ultima quincena procesada global (`findMaxQnaProceso`). 

El default por concepto no es el maximo global a proposito: un concepto puede llevar quincenas sin cargarse mientras otros ya procesaron la vigente, y con el maximo global el archivo saldria vacio. `fechaCarga` acota a una carga puntual dentro de la quincena resuelta y no participa en esa resolucion.
Sin filas para la combinacion elegida la respuesta es `404`. El nombre del archivo lleva la quincena realmente exportada y el concepto cuando se filtro: `terceros_qna202522_85.xlsx`.

## 4. Layouts TXT
Hay **dos** layouts: `ILIMITADO` de 100 caracteres e `LIMITADO` de 180. Cual aplica no se decide en codigo: se lee de `cat_conceptos`.

### 4.1 Layout ILIMITADO de 100 caracteres
No trae quincena de termino: `hasta` queda nulo y el servicio guarda `qna_fin = 999999` (vigencia abierta).
Posicion | Longitud | Campo               | Tratamiento 
1-13     | 13       | RFC                 | Trim + mayusculas. 
14-43    | 30       | Nombre              | Trim. 
44-71    | 28       | Filler              | Ignorado. 
72-80    | 9        | Numero de documento | Se quitan ceros iniciales; todo ceros queda `NULL`. 
81       | 1        | Tipo de movimiento  | Entero. 
82-89    | 8        | Importe             | Dos decimales implicitos. 
90-91    | 2        | Concepto            | Debe coincidir con la seleccion. 
92       | 1        | Filler              | Ignorado. 
93-98    | 6        | Desde               | Quincena efectiva en formato `AAAAQQ`. 
99-100   | 2        | Filler              | Ignorado. 
Se guarda con `formato_origen = ILIMITADO_100`.

### 4.2 Layout LIMITADO de 180 caracteres
Si trae quincena de termino, en la segunda mitad del periodo. Se acepta longitud 180 y, por compatibilidad con archivos recibidos previamente, 182.
Posicion | Campo 
 1-18    | Ramo, pagaduria y numero ISSSTE. No se interpreta; queda en `registro_origen`. 
 19-31   | RFC. 
 32-71   | Nombre. 
 72-99   | Clave de cobro/plaza. Se conserva en el registro original; la asignacion exacta por clave queda pendiente de confirmacion de negocio. 
 100-102 | Tipo de movimiento: 1 alta, 2 baja, 3 cambio. 
 103-105 | Plazo o numero de quincenas. No se interpreta. 
 106-117 | Periodo `QQAAAAQQAAAA`: quincena desde y hasta. Ambas se normalizan a `AAAAQQ`; por ejemplo `172026` se convierte en `202617`. 
 118-119 | Concepto. Debe coincidir con la seleccion. 
 120-126 | Importe mensual, dos decimales implicitos. 
 127-132 | Numero de documento. 
 133-138 | Quincena del reporte en formato `AAAAQQ`. Redundante con el `desde` del periodo; no se lee. 
 139-fin | Parametros de origen. 

Se guarda con `formato_origen = LIMITADO_180` o `LIMITADO_182`.

### 4.3 Controles de formato
Estos controles ocurren antes de insertar y no son reglas de negocio:
- Archivo no vacio y extension `.txt`.
- Concepto con layout configurado.
- Longitud exacta soportada.
- Concepto interno igual al seleccionado.
- Campos numericos parseables.
- Archivo con al menos una linea util.
Ante cualquier error de formato se rechaza la carga completa y no se inserta parcialmente.

## 5. Regla de validacion de negocio
Las reglas de aceptacion solicitadas actualmente son:

1. El RFC debe corresponder a un empleado existente (`tab_empleados.deleted = false`), el concepto debe existir como deduccion en `cat_conceptos` y el empleado debe tener una plaza cuyo estatus en `nom_emp_pza_cct.cat_estatus_plaza_id` sea `1` (`OCUPADA EH`) o `6` (`OCUPADA INTERINA`). Si no existe, queda `RECHAZADO` con motivo `El empleado no existe`; si no se cumple la condicion concepto/plaza, queda `RECHAZADO` con motivo `El empleado no tiene una plaza activa para el concepto`.
2. No cargar dos veces a la misma persona, en la misma quincena de proceso y con el mismo concepto.
3. Para altas y modificaciones, el importe debe caber en `nom_emp_pza_cpto.importe` (`numeric(10,2)`): maximo `99,999,999.99`. Los valores nulos o mayores quedan `RECHAZADO` antes de procesar para evitar un error SQL.
4. Los movimientos aceptados por concepto salen de `cat_conceptos.movimientos_permitidos`. Si la columna esta vacia se aceptan `1`, `2` y `3`. Restringir un concepto es un `UPDATE`, no un cambio de codigo.
5. La plaza resuelta para un alta debe existir, estar activa con estatus `1` o `6` y tener `tab_plaza_id > 0`; nunca se inserta el valor `0` como sustituto.

## 6. Semantica de movimientos
Tipo | Significado  | Staging                                                                                      | Al procesar 
1    | Alta         | `qna_ini = desde`. `qna_fin = hasta` si el layout es `LIMITADO`; `999999` si es `ILIMITADO`. | Crea deduccion `D` respetando ambas vigencias. 
2    | Baja         | `qna_fin = hasta` si el layout es `LIMITADO`; `desde` si es `ILIMITADO`.                     | Localiza deduccion vigente y actualiza `qna_fin`. 
3    | Modificacion | Fechas temporales nulas                                                                      | Localiza deduccion vigente y actualiza importe/quincena de proceso. 


## 7. Prueba operativa minima
1. Arrancar el perfil local y confirmar el puerto en el log.
2. Abrir `/src/environments/environment.ts`, cambiar la ruta a localhost, o descomentar esa ruta y comentar la de prod.
3. Hacer login
4. Obtener JWT con `POST /users/getToken` y usar `Authorize`.
5. Entrar el modulo y probar flujo, pero una ves validado que este en ejecuion el proyecto en env de loscalhost
6. Cargar por `POST /terceros/cargar-txt` un TXT de concepto `21` con `qnaProceso=202522`.
7. Consultar `GET /terceros/personalizar?qnaProceso=202522&concepto=21`.
8. Comprobar que un RFC inexistente o sin plaza en estatus `1`/`6` para el concepto quede rechazado.
9. Volver a cargar el mismo archivo para comprobar rechazo por duplicado.
10. Limpiar staging con `DELETE /terceros/borrar-lote?qnaProceso=202522&concepto=21`.
11. No ejecutar `/procesar` en una base productiva solo para probar. Ese endpoint modifica `nom_emp_pza_cpto`.
* NOTA IMPROTENTE:
- Si no se puede ingresar al swagger, puedes hacer primero pruebas en el postman.

## 8. Criterios al modificar el modulo
- Conservar `ApiResponse` en todos los services.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentacion o logs compartidos.
- En caso de que se integren nuevas varibales, revisar primero los modelos para ver si coincidan con lo que es el nuevo requerimiento
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por que el cambio y si no afecta en el demas flujo