# Interceptor - HTTP Error Interceptor

- Nombre del interceptor:
- httpErrorInterceptor (Interceptor de Manejo de Errores HTTP)

## 1. Objetivo y alcance
El interceptor es responsable de interceptar y manejar los errores HTTP que ocurren en las peticiones al servidor. Implementa el patrón `HttpInterceptorFn` de Angular para capturar errores y mostrar mensajes de toast al usuario según el código de estado HTTP. Proporciona una experiencia de usuario consistente al manejar diferentes tipos de errores de red y servidor.

En la vista:
- No tiene vista directa, es un interceptor de Angular HTTP
- Se ejecuta automáticamente en todas las peticiones HTTP
- Intercepta errores HTTP mediante `catchError`
- Muestra mensajes de toast según el código de estado HTTP
- Registra el error en consola para depuración
- Retorna el error para que el componente que hizo la petición pueda manejarlo adicionalmente

- Flujo funcional:
1. Se intercepta cada petición HTTP saliente
2. Se inyecta `ToastService` para mostrar mensajes al usuario
3. Se continúa con la petición original
4. Si ocurre un error HTTP, se captura con `catchError`
5. Se registra el error en consola para depuración
6. Se evalúa el código de estado HTTP del error
7. Según el código, se muestra un toast específico:
   - 0: Sin conexión al servidor
   - 400: Solicitud inválida
   - 401: Sesión expirada
   - 403: Acceso denegado
   - 404: Recurso no encontrado
   - 500: Error del servidor
   - 502, 503, 504: Servicio no disponible
   - Default: Error inesperado
8. Se retorna el error usando `throwError` para que el componente pueda manejarlo

## 2. Mapa de código
- Ruta del interceptor:
src/app/core/interceptors/

- Clases involucradas:
```text
    src/app/core/interceptors/
        http-error.interceptor.ts

    src/app/core/services/
        toast.service.ts
```

## 3. API (Service)
| Metodo               | Servicio        | Uso                                                          |
|----------------------|------------------|-------------------------------------------------------------|
| `error()`            | `ToastService`   | Muestra mensaje de error al usuario                         |
| `warning()`          | `ToastService`   | Muestra mensaje de advertencia al usuario                   |

## 4. Reglas de validación de negocio
1. **Captura de errores**: Todos los errores HTTP son capturados mediante `catchError`.
2. **Registro en consola**: Los errores se registran en consola para depuración.
3. **Mensajes específicos**: Cada código de estado HTTP tiene un mensaje específico y amigable para el usuario.
4. **Duración de toasts**: Los mensajes de error tienen una duración de 6000ms (6 segundos), excepto el error default que dura 5000ms.
5. **Tipo de toast**: Se usa `error()` para errores críticos (0, 403, 404, 500, 502, 503, 504, default) y `warning()` para advertencias (400, 401).
6. **Retorno de error**: El error se retorna usando `throwError` para que el componente pueda manejarlo adicionalmente.
7. **Código 0**: El código 0 indica problemas de red o servidor no disponible (sin conexión).
8. **Códigos 502, 503, 504**: Se agrupan como "Servicio no disponible" (errores de gateway/servidor).
9. **Error default**: Cualquier código no manejado específicamente muestra un mensaje genérico de error inesperado.
10. **Función interceptor**: Implementa el patrón `HttpInterceptorFn` de Angular para interceptores funcionales.

## 5. Diagrama de clases
| Interceptor           | Servicios               |
|-----------------------|-------------------------|
| `httpErrorInterceptor` | `ToastService`         |

## 6. Métodos del interceptor httpErrorInterceptor

### 6.1 Función interceptor
| Método                            | Descripción                                                                                                                           |
|-----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `httpErrorInterceptor(req, next)` | Función interceptor que captura errores HTTP y muestra mensajes de toast según el código de estado.                                   |

### 6.2 Métodos auxiliares
No aplica - Este interceptor no tiene métodos auxiliares adicionales.

## 7. Prueba operativa mínima
1. Desconectar la red y realizar una petición HTTP.
2. Verificar que se muestre el toast "Sin conexión".
3. Realizar una petición con datos inválidos (código 400).
4. Verificar que se muestre el toast "Solicitud inválida".
5. Expirar el token y realizar una petición (código 401).
6. Verificar que se muestre el toast "Sesión expirada".
7. Intentar acceder a un recurso sin permisos (código 403).
8. Verificar que se muestre el toast "Acceso denegado".
9. Intentar acceder a un recurso inexistente (código 404).
10. Verificar que se muestre el toast "Recurso no encontrado".
11. Simular un error del servidor (código 500).
12. Verificar que se muestre el toast "Error del servidor".
13. Simular un error de gateway (código 502, 503, 504).
14. Verificar que se muestre el toast "Servicio no disponible".
15. Verificar que los errores se registren en consola.
16. Verificar que el componente que hizo la petición pueda manejar el error adicionalmente.

## 8. Criterios al modificar el interceptor
- Este es un interceptor crítico de UX; cualquier cambio debe mejorar la claridad de los mensajes para el usuario.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentación o logs compartidos.
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por qué el cambio y si no afecta en el demás flujo.
- Si se agregan más códigos de estado, agregar casos al switch con mensajes apropiados.
- Mantener la consistencia en el uso de `error()` para errores críticos y `warning()` para advertencias.
- La duración de los toasts debe ser consistente (6000ms para errores específicos, 5000ms para default).
- El registro en consola es útil para depuración; mantenerlo.
- El retorno del error con `throwError` es crítico para que los componentes puedan manejar errores específicamente.
- Considerar si se requiere redirección automática al login para el código 401.
- Los mensajes deben ser amigables y claros para el usuario final.
