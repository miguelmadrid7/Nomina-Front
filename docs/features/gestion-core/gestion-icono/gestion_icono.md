# Gestión core - Gestión de Íconos

- Nombre del módulo (Vista):
- Gestión de Íconos

## 1. Objetivo y alcance
El módulo permite gestionar los íconos del sistema, incluyendo la consulta y creación de registros de íconos. Permite visualizar todos los íconos con su figura, nombre, icono y descripción.

En la vista:
- Se observa la qna activa (viene de un endpoint del backend) como referencia.
- Se muestra una tabla paginada con todos los íconos.
- Cada fila muestra: figura, icono, nombre y descripción.
- Se muestra un botón para crear un nuevo ícono.

- Flujo funcional:
1. Al cargar la vista, se obtiene la qna activa del calendario.
2. Se carga la lista completa de íconos mediante `GET /notifications/icons`.
3. Los registros se muestran en una tabla paginada (10 registros por página por defecto).
4. El usuario puede navegar entre páginas usando el paginador.
5. El usuario puede crear un nuevo ícono mediante un diálogo.
6. Al crear exitosamente, se recarga la lista de íconos.

## 2. Mapa de código
- Ruta del módulo:
src/app/features/gestion-core/gestion-icono/

- Clases involucradas: 
```text
    src/app/features/gestion-core/gestion-icono/
        gestion-icono.ts
        gestion-icono.html
        gestion-icono.css

    src/app/core/services/
        calendario.service.ts
        icon.service.ts
        toast.service.ts

    src/app/core/model/
        calendario.model.ts
        icon.model.ts
        icon-requets.model.ts

    src/app/shared/dialogs/
        alta-icono-dialog/
```

## 3. API (Service)
| Metodo   |          Ruta                              | Uso                                                         |
|----------|--------------------------------------------|-------------------------------------------------------------|
| GET      | `/calendario/activa`                       | Muestra la qna activa                                       |
| GET      | `/notifications/icons`                     | Obtiene todos los íconos                                    |
| POST     | `/notifications/icons`                     | Crea un nuevo ícono                                         |

## 4. Reglas de validación de negocio
1. **qna activa requerida**: La qna activa debe estar disponible para referencia.
2. **Paginación cliente**: La paginación se maneja en el frontend (slice del array).
3. **Tamaño por defecto**: 10 registros por página.
4. **Creación de ícono**: Solo se permite crear íconos mediante el diálogo de alta.
5. **Recarga automática**: Al crear exitosamente, se recarga la lista de íconos.
6. **Manejo de errores**: Si falla la carga, se muestra un toast de error y se limpia la tabla.
7. **Diálogo bloqueante**: El diálogo de creación no permite cerrar por click fuera (disableClose: true).

## 5. Diagrama de clases
| Componente principal      | Servicios               | Modelos                 | Modelos de request       | Modelos de response       |
|---------------------------|-------------------------|-------------------------|--------------------------|---------------------------| 
| `GestionIcono`            | `CalendarioService`     | `Calendario`            | -                        | -                         |
|                           | `IconService`           | `Icon`                  | `IconRequest`            | `ApiResponse<Icon[]>`     |
|                           | `ToastService`          |                         |                          | `ApiResponse<any>`        |

## 6. Métodos del componente GestionIcono
### 6.1 Métodos de ciclo de vida
| Método          | Descripción                                                                                                                                             |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ngOnInit()`    | Inicializa el componente: carga la qna activa y carga los íconos.                                                                                       |
| `ngOnDestroy()` | Cierra todos los diálogos abiertos al destruir el componente.                                                                                           |

### 6.2 Métodos de carga de datos
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `loadQnaActivated()`  | Obtiene la quincena activa desde `GET /calendario/activa`. Actualiza `calendarioActual` y maneja errores.                             |
| `loadIcons()`         | Obtiene todos los íconos desde `GET /notifications/icons`. Actualiza `icons` y aplica paginación local.                               |

### 6.3 Métodos de manipulación de archivos
No aplica - Este módulo no tiene funcionalidad de descarga de archivos.

### 6.4 Métodos de validación
No aplica - Este módulo gestiona íconos, las validaciones se realizan en el diálogo y en el backend.

### 6.5 Métodos de edición de registros
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `openCreateDialog()`  | Abre el diálogo de alta de ícono. Al cerrar con resultado true, llama al servicio para crear el ícono y recarga la lista.             |

### 6.6 Métodos de procesamiento
No aplica - Este módulo gestiona íconos, no procesa datos adicionales.

### 6.7 Métodos de búsqueda
No aplica - Este módulo no tiene funcionalidad de búsqueda.

### 6.8 Métodos auxiliares
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `onPageChange(event)` | Maneja el cambio de página en el paginador. Actualiza `pageSize` y `pageIndex`, y refresca la página.                                 |
| `refreshPage()`        | Refresca la página actual aplicando paginación local sobre el array `icons`.                                                         |

## 7. Prueba operativa mínima
1. Arrancar el perfil local y confirmar el puerto en el log.
2. Abrir `/src/environments/environment.ts`, cambiar la ruta a localhost, o descomentar esa ruta y comentar la de prod.
3. Hacer login.
4. Obtener JWT con `POST /users/getToken` y usar `Authorize`.
5. Entrar al módulo y verificar:
- Que se cargue la qna activa correctamente.
- Que se cargue la lista de íconos correctamente.
- Que la paginación funcione.
- Que el diálogo de creación funcione.
- Que al crear se recargue la lista.
* NOTA IMPORTANTE:
- Si no se puede ingresar al swagger, puedes hacer primero pruebas en el postman.

## 8. Criterios al modificar el módulo
- Conservar `ApiResponse` en todos los services.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentación o logs compartidos.
- En caso de que se integren nuevas variables, revisar primero los modelos para ver si coincidan con lo que es el nuevo requerimiento.
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por qué el cambio y si no afecta en el demás flujo.
- Si se agregan columnas a la tabla, actualizar `displayedColumns` y el HTML correspondiente.
- Mantener la consistencia en el uso del diálogo `IconoDialog` para creación.
- Preservar el comportamiento de recarga automática después de crear.
