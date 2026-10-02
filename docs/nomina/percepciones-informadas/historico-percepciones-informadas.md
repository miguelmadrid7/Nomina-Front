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

## 7. Criterios al modificar el modulo
- Conservar `ApiResponse` en todos los services.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentacion o logs compartidos.
- En caso de que se integren nuevas varibales, revisar primero los modelos para ver si coincidan con lo que es el nuevo requerimiento
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por que el cambio y si no afecta en el demas flujo
- Mantener la consistencia en el formato de qna (AAAAQQ) en todas las operaciones
- Preservar el comportamiento de debounce en los filtros para evitar llamadas excesivas al backend