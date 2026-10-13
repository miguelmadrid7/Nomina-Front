# Nomina - Generación de Entregables

- Nombre del módulo (Vista):
- Generar entregables de nóminas

## 1. Objetivo y alcance
El módulo permite generar y descargar los entregables de nómina en formato CSV, específicamente el Anexo V y el Anexo VI, los cuales son reportes requeridos para la presentación de la nómina quincenal.

En la vista:
- Se observa la qna activa (viene de un endpoint del backend) como referencia
- Se muestran dos botones principales:
  * Descargar Anexo V: Genera y descarga el archivo CSV del Anexo V
  * Descargar Anexo VI: Genera y descarga el archivo CSV del Anexo VI
- Cada botón muestra un loader durante la generación del archivo
- Los archivos se descargan automáticamente con nombres predefinidos

- Flujo funcional:
1. Al cargar la vista, se obtiene la qna activa del calendario
2. El usuario hace clic en el botón del anexo deseado (Anexo V o Anexo VI)
3. Se muestra un loader mientras se genera el archivo en el backend
4. El backend genera el archivo CSV correspondiente
5. El archivo se descarga automáticamente en el navegador
6. Se muestra un toast de éxito o error según el resultado

## 2. Mapa de código
- Ruta del módulo:
src/app/features/nomina/generar-producto/

```text
    src/app/features/nomina/generar-producto/
        generar-producto.component.ts
        generar-producto.component.html
        generar-producto.component.css

    src/app/core/services/
        nomina-ordinaria.service.ts
        calendario.service.ts
        toast.service.ts
        loader.service.ts

    src/app/core/model/
        calendario.model.ts
```

## 3. API (Service)
| Metodo   |          Ruta                              | Uso                                                         |
|----------|--------------------------------------------|-------------------------------------------------------------|
| GET      | `/calendario/activa`                       | Muestra la qna activa                                       |
| POST     | `/calculation/export-anexo-v`              | Genera y descarga el archivo CSV del Anexo V                |
| POST     | `/calculation/export-anexo-VI`             | Genera y descarga el archivo CSV del Anexo VI               |

## 4. Reglas de validación de negocio
1. **qna activa requerida**: La qna activa debe estar disponible para referencia, aunque no se usa directamente en la generación de los anexos.
2. **Formato de archivo**: Los archivos se generan en formato CSV con codificación estándar.
3. **Nombres de archivo**: Los archivos se descargan con nombres predefinidos:
   - Anexo V: `Anexo V.csv`
   - Anexo VI: `Anexo-VI.csv`
4. **Descarga única**: Cada botón genera una descarga individual; no hay descarga masiva.
5. **Manejo de errores**: Si la generación falla, se muestra un toast de error sin descargar ningún archivo.

## 5. Diagrama de clases
| Componente principal      | Servicios               | Modelos                 | Modelos de request       | Modelos de response       |
|---------------------------|-------------------------|-------------------------|--------------------------|---------------------------| 
| `GenerarProductoComponent`| `CalendarioService`     | `Calendario`            | -                        | -                         |
|                           | `NominaService`         | -                       |                          | Blob (CSV)                |
|                           | `ToastService`          | -                       |                          |                           |
|                           | `LoaderService`         | -                       |                          |                           |

## 6. Métodos del componente GenerarProductoComponent

### 6.1 Métodos de ciclo de vida
| Método        | Descripción                                                                                                                                             |
|---------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ngOnInit()`  | Inicializa el componente: carga la quincena activa del calendario.                                                                                      |

### 6.2 Métodos de carga de datos
| Método                | Descripción                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `loadQnaActivated()`  | Obtiene la quincena activa desde `GET /calendario/activa`. Actualiza `calendarioActual` y maneja errores.                             |

### 6.3 Métodos de manipulación de archivos
| Método                    | Descripción                                                                                                                                                                  |
|---------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `descargarCSVAnexoV()`    | Descarga el Anexo V mediante `POST /calculation/export-anexo-v`. Muestra loader durante generación. Guarda el blob como `Anexo V.csv`.                                       |
| `descargarCSVAnexoVI()`   | Descarga el Anexo VI mediante `POST /calculation/export-anexo-VI`. Muestra loader durante generación. Guarda el blob como `Anexo-VI.csv`.                                    |


## 7. Prueba operativa mínima
1. Arrancar el perfil local y confirmar el puerto en el log.
2. Abrir `/src/environments/environment.ts`, cambiar la ruta a localhost, o descomentar esa ruta y comentar la de prod.
3. Hacer login
4. Obtener JWT con `POST /users/getToken` y usar `Authorize`.
5. Entrar al módulo y verificar:
- Que se cargue la qna activa correctamente
- Que el botón de Anexo V funcione y descargue el archivo
- Que el botón de Anexo VI funcione y descargue el archivo
- Que los archivos descargados tengan el formato CSV correcto
* NOTA IMPORTANTE:
- Si no se puede ingresar al swagger, puedes hacer primero pruebas en el postman.

## 8. Criterios al modificar el módulo
- Conservar `ApiResponse` en todos los services cuando aplique.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentación o logs compartidos.
- En caso de que se integren nuevas variables, revisar primero los modelos para ver si coincidan con lo que es el nuevo requerimiento.
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por qué el cambio y si no afecta en el demás flujo.
- Mantener la consistencia en el formato de los nombres de archivo (Anexo V.csv, Anexo-VI.csv).
- Si se agregan nuevos anexos, seguir el patrón existente: método de descarga, endpoint en el servicio y loader durante la generación.
