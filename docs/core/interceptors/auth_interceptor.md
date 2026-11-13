# Interceptor - Auth Interceptor

- Nombre del interceptor:
- authInterceptor (Interceptor de Autenticación)

## 1. Objetivo y alcance
El interceptor es responsable de inyectar el token de autenticación (JWT) en todas las peticiones HTTP salientes, excepto en el endpoint de login. Implementa el patrón `HttpInterceptorFn` de Angular para interceptar y modificar las peticiones HTTP antes de ser enviadas al servidor.

En la vista:
- No tiene vista directa, es un interceptor de Angular HTTP
- Se ejecuta automáticamente en todas las peticiones HTTP
- Verifica si existe un token en `LoginService`
- Excluye el endpoint de login de la inyección del token
- Agrega el header `Authorization: Bearer ${token}` a las peticiones autenticadas

- Flujo funcional:
1. Se intercepta cada petición HTTP saliente
2. Se inyecta `LoginService` para obtener el token
3. Se obtiene el token mediante `LoginService.getToken()`
4. Se verifica si la URL incluye '/login' (endpoint de autenticación)
5. Si es el endpoint de login, no se inyecta el token
6. Si existe token y no es el endpoint de login:
7. Se clona la petición original
8. Se agrega el header `Authorization: Bearer ${token}`
9. Se continúa con la petición modificada
10. Si no existe token o es el endpoint de login, se continúa con la petición original sin modificaciones

## 2. Mapa de código
- Ruta del interceptor:
src/app/core/interceptors/

- Clases involucradas:
```text
    src/app/core/interceptors/
        auth.interceptor.ts

    src/app/core/services/
        login.service.ts
```

## 3. API (Service)
| Metodo               | Servicio         | Uso                                                         |
|----------------------|------------------|-------------------------------------------------------------|
| `getToken()`         | `LoginService`   | Obtiene el token JWT almacenado                             |

## 4. Reglas de validación de negocio
1. **Inyección condicional**: Solo se inyecta el token si existe y no es el endpoint de login.
2. **Exclusión de login**: El endpoint '/login' está excluido de la inyección del token para evitar errores de autenticación circular.
3. **Formato Bearer**: El token se inyecta en el formato estándar `Authorization: Bearer ${token}`.
4. **Clonación de petición**: Se usa `req.clone()` para crear una nueva petición con los headers modificados sin afectar la original.
5. **No bloqueante**: Si no existe token, la petición continúa sin modificaciones (el servidor decidirá si denegar el acceso).
6. **Función interceptor**: Implementa el patrón `HttpInterceptorFn` de Angular para interceptores funcionales.

## 5. Diagrama de clases
| Interceptor           | Servicios               |
|-----------------------|-------------------------|
| `authInterceptor`     | `LoginService`          |

## 6. Métodos del interceptor authInterceptor

### 6.1 Función interceptor
| Método                       | Descripción                                                                                                                      |
|------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| `authInterceptor(req, next)` | Función interceptor que inyecta el token de autenticación en las peticiones HTTP, excepto en el endpoint de login.               |

### 6.2 Métodos auxiliares
No aplica - Este interceptor no tiene métodos auxiliares adicionales.

## 7. Prueba operativa mínima
1. Iniciar la aplicación sin estar autenticado (sin token).
2. Realizar una petición HTTP a cualquier endpoint protegido.
3. Verificar que la petición se envíe sin el header Authorization.
4. Hacer login correctamente.
5. Realizar una petición HTTP a cualquier endpoint protegido.
6. Verificar que la petición se envíe con el header `Authorization: Bearer ${token}`.
7. Realizar una petición al endpoint '/login'.
8. Verificar que la petición se envíe sin el header Authorization (incluso después de estar autenticado).
9. Cerrar sesión (eliminar el token).
10. Realizar una petición HTTP a cualquier endpoint protegido.
11. Verificar que la petición se envíe sin el header Authorization.

## 8. Criterios al modificar el interceptor
- Este es un interceptor crítico de seguridad; cualquier cambio debe ser probado exhaustivamente.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentación o logs compartidos.
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por qué el cambio y si no afecta en el demás flujo.
- Si se agregan más endpoints excluidos, actualizar la lógica de verificación de URL.
- Mantener el formato estándar `Authorization: Bearer ${token}` para compatibilidad con el backend.
- La exclusión del endpoint de login es crítica; mantener esta lógica para evitar errores de autenticación circular.
- Si se requiere inyectar otros headers (ej. tenant, organization), agregarlos en el mismo `setHeaders`.
- El interceptor debe ser no bloqueante; si no existe token, continuar con la petición original.
- Considerar si se requiere manejo de errores (ej. token expirado) para redirigir al login automáticamente.
