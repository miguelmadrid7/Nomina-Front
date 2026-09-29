# Nomina - percepciones informadas

- Nombre del modulo(Vista):
- Carga de percepiones informadas

## 1. Objetivo y alcance
El modulo recibe archivos excel(.xls, .xlsx) con la estructura de:
- RFC.
- CURP.
- CONCEPTO.
- IMPORTE.
- CANTIDAD.
En la vista:
- Se observa la qna proceso o qna activa(es lo mismo), viene de un endpoint del lado del backend
- Se observa un select, hace la seleccion de un cpto, dicho viene de un endpoint del lado del backend
- Se muestra el boton de cargar layout extension .xls, xlsx, en este caso seria el layout proporcionado por cada area de trabajo
- Al hacer la carga se hace validaciones, tales como:
* El cpto seleccionado coincida con el layout cargado
* No haya duplicaciones en el lote cargado
* La plaza esta autorizada con el cpto cargado
* El cpto cargado no este aplicado para la qna activa o el trabajador activo
* El orden de las columnas y los nombre de la columnas del excel sean los mismo que se muestran en la card de la parte de abajo
- Se muestra un card con el formato correcto que debe de contener y el orden de las columnas del excel, si no viene en ese formato no se podra cargar correctamente
- Se muestran 4 botones:
* Cargar: Su funcionalida es para hacer la carga del layout
* Revalidar: Su funcion es para cuando se haga alguna modificacion directa en la tabla de la validacion, consultar, agregar, editar o eliminar filas temporales
* Procesar: Su funcinalidad, es que hace el volcado de la informacion temporal a la tabla para el calculo de la nomina
* Ver lotes: Son los lotes cargados que esten en staging(Espera)
* Reporte: Descargar todas la valiadcion en formato xlsx

- Flujo funcional:
1. Cargar xlsx y seleccionar concepto, en este caso se toma la qna activa, no es necesario agreagr el filtro de la qna.
2. Parsear cada linea segun el layout del concepto.
3. Guardar en `tmp_percep_informada`.
4. Revalidar el lote.
5. Accion de validaciones, todas las mencionadas anteriormente
6. Consultar, agregar, editar o eliminar filas temporales.
8. Guardar snapshot en `nom_historico_percep`.
9. Eliminar el lote temporal dentro de la misma transaccion.

## 2. Mapa de codigo
- Ruta del modulo:
    src/app/features/nomina/percepciones-informadas
        percepciones-informadas/
            percepciones-informadas.ts
            percepciones-informadas.html
            percepciones-informadas.css

    src/app/core/services/
        calendario.service.ts
        toast.service.ts
        percepciones-informadas.service.ts
        excel-upload.service.ts

    src/app/core/model/
        calendario.model.ts
        empleado.model.ts
        personalizar-row.model.ts

## 3. API(Service)
Metodo   |          Ruta                              | Uso 
GET      | `/calendario/activa`                       | Muestra la qna activa, esto se controla en el 
VALIDATE | `excel-upload.service`                     | Valida el formato que contiene el excel 
POST     | `/nom-emp-pza-cpto/cargar-excel`           | Hace la carga del excel en la tabla temporal
GET      | `/nom-emp-pza-cpto/personalizar`           | Se obtiene la tabla de las validaciones
POST     | `/nom-emp-pza-cpto/validar`                | Se revalida el lote ya precargado 
PUT      | `/nom-emp-pza-cpto/personalizar/${id}`     | Edita una fila y revalida el lote. 
POST     | `/nom-emp-pza-cpto/procesar`               | Se hace el volcado a la tabla de la nomina
DELETE   | `/nom-emp-pza-cpto/personalizar/${id}`     | Elimina staging por quincena y concepto. 
GET      | `/nom-emp-pza-cpto/descargar-validaciones` | Se descarga el excel ya con todas la validaciones aplicadas

## 4. Layouts XLS, XLSX
Unicamente se puede tener el archivo con las siguiente cabeceras:
- RFC.
- CURP.
- CONCEPTO.
- IMPORTE.
- CANTIDAD.
Si no se respetan este orden no se podar seguir el flujo correctamente y no se podra cargar correctamente, y no se permite hacer una carag incorrecta

## 5. Regla de validacion de negocio
1. El RFC debe corresponder a un empleado existente (`tab_empleados.deleted = false`).
2. El empleado debe tener una plaza cuyo estatus en `nom_emp_pza_cct.cat_estatus_plaza_id` sea `1` (`OCUPADA EH`) o `6` (`OCUPADA INTERINA`).
3. Si no existe, queda `RECHAZADO` con motivo `El empleado no existe`; si no se cumple la condicion concepto/plaza, queda `RECHAZADO` con motivo `El empleado no tiene una plaza activa para el concepto`.
4. No cargar dos veces a la misma persona, en la misma quincena de proceso y con el mismo concepto.

## 6. Prueba operativa minima
1. Arrancar el perfil local y confirmar el puerto en el log.
2. Abrir `/src/environments/environment.ts`, cambiar la ruta a localhost, o descomentar esa ruta y comentar la de prod.
3. Hacer login
4. Obtener JWT con `POST /users/getToken` y usar `Authorize`.
5. Entrar el modulo y probar flujo, pero una ves validado que este en ejecuion el proyecto en env de localhost
* NOTA IMPROTENTE:
- Si no se puede ingresar al swagger, puedes hacer primero pruebas en el postman.

## 7. Criterios al modificar el modulo
- Conservar `ApiResponse` en todos los services.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentacion o logs compartidos.
- En caso de que se integren nuevas varibales, revisar primero los modelos para ver si coincidan con lo que es el nuevo requerimiento
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por que el cambio y si no afecta en el demas flujo