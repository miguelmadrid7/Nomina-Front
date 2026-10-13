# Guard - Auth Guard

- Nombre del guard:
- AuthGuard (Guard de Autenticación)

## 1. Objetivo y alcance
El guard es responsable de proteger las rutas de la aplicación verificando que el usuario esté autenticado y tenga permiso para acceder a la URL solicitada. Implementa las interfaces `CanActivate` y `CanActivateChild` para proteger tanto rutas principales como rutas hijas. Si el usuario no está autenticado, redirige al login. Si está autenticado pero no tiene permiso para la URL, redirige al home.

En la vista:
- No tiene vista directa, es un guard de Angular Router
- Se ejecuta automáticamente al navegar a una ruta protegida
- Evalúa la autenticación del usuario
- Evalúa los permisos del usuario basándose en los módulos del menú
- Redirige al login si no está autenticado
- Redirige al home si no tiene permiso para la URL

- Flujo funcional:
1. Al navegar a una ruta protegida, se ejecuta `canActivate` o `canActivateChild`
2. Se llama al método `checkAccess` con la URL solicitada
3. Se verifica si el usuario está autenticado mediante `LoginService.isAuthenticated()`
4. Si no está autenticado, redirige al login con `returnUrl` como query parameter
5. Si está autenticado, se normaliza la URL (elimina query params y fragments)
6. Si la URL es '/home', permite el acceso inmediatamente
7. Se verifica si hay módulos cacheados en `LoginService.getMenuModules()`
8. Si hay módulos cacheados, se verifica si el usuario tiene acceso a la URL
9. Si no tiene acceso, redirige al home
10. Si no hay módulos cacheados, se llama a `SidebarService.getModulesByUser()`
11. Se cachean los módulos en `LoginService.setMenuModules()`
12. Se verifica si el usuario tiene acceso a la URL
13. Si no tiene acceso, redirige al home
14. Si falla la carga de módulos, redirige al home

## 2. Mapa de código
- Ruta del guard:
src/app/core/guards/

- Clases involucradas:
```text
    src/app/core/guards/
        auth.guard.ts

    src/app/core/services/
        login.service.ts
        sidebar.service.ts

    src/app/core/model/
        sidebar.model.ts
```

## 3. API (Service)
| Metodo               |  Servicio        | Uso                                                         |
|----------------------|------------------|-------------------------------------------------------------|
| `isAuthenticated()`  | `LoginService`   | Verifica si el usuario está autenticado                     |
| `getMenuModules()`   | `LoginService`   | Obtiene los módulos del menú cacheados                      |
| `setMenuModules()`   | `LoginService`   | Cachea los módulos del menú                                 |
| `getModulesByUser()` | `SidebarService` | Obtiene los módulos del usuario desde el backend            |

## 4. Reglas de validación de negocio
1. **Autenticación requerida**: El usuario debe estar autenticado para acceder a cualquier ruta protegida.
2. **Redirección al login**: Si no está autenticado, redirige al login con `returnUrl` para volver después del login.
3. **URL normalizada**: La URL se normaliza eliminando query params y fragments para la comparación.
4. **Home permitido**: La URL '/home' siempre está permitida para usuarios autenticados.
5. **Módulos cacheados**: Los módulos se cachean en `LoginService` para evitar llamadas repetidas al backend.
6. **Verificación de vista**: Solo se permite acceso si el módulo tiene `vista = true`.
7. **Comparación de paths**: Se compara el path normalizado del módulo con la URL solicitada.
8. **Redirección al home**: Si el usuario está autenticado pero no tiene permiso, redirige al home.
9. **Manejo de errores**: Si falla la carga de módulos, redirige al home.
10. **CanActivateChild**: El mismo lógica se aplica para rutas hijas.

## 5. Diagrama de clases
| Guard principal      | Servicios              | Modelos                 |
|----------------------|------------------------|-------------------------|
| `AuthGuard`          | `LoginService`         | `SidebarModule`         |
|                      | `SidebarService`       |                         |

## 6. Métodos del guard AuthGuard

### 6.1 Métodos de implementación de interfaces
| Método          | Descripción                                                                                                                                             |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `canActivate(route, state)` | Implementación de CanActivate. Verifica el acceso a la ruta llamando a checkAccess.                                                         |
| `canActivateChild(route, state)` | Implementación de CanActivateChild. Verifica el acceso a la ruta hija llamando a checkAccess.                                          |

### 6.2 Métodos de verificación de acceso
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `checkAccess(url)`    | Verifica si el usuario está autenticado y tiene permiso para acceder a la URL. Redirige al login o home según corresponda.            |

### 6.3 Métodos auxiliares
| Method                              | Description                                                                                                                           |
|-------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `canAccessUrl(modules, currentUrl)` | Verifica si el usuario tiene acceso a la URL basándose en los módulos del menú. Solo permite si el módulo tiene vista = true.         |
| `normalizePath(path)`               | Normaliza el path eliminando query params y fragments. Asegura que el path empiece con '/'.                                           |

## 7. Prueba operativa mínima
1. Iniciar la aplicación sin estar autenticado.
2. Intentar navegar a una ruta protegida (ej. '/home').
3. Verificar que redirija al login con `returnUrl` en query params.
4. Hacer login correctamente.
5. Navegar a '/home' y verificar que permita el acceso.
6. Navegar a una ruta para la que el usuario tiene permiso.
7. Verificar que permita el acceso.
8. Navegar a una ruta para la que el usuario NO tiene permiso.
9. Verificar que redirija al home.
10. Cerrar sesión y verificar que redirija al login al intentar navegar a cualquier ruta protegida.
11. Verificar que los módulos se cacheen correctamente después de la primera carga.
12. Verificar que la normalización de URLs funcione correctamente con query params y fragments.

## 8. Criterios al modificar el guard
- Este es un guard crítico de seguridad; cualquier cambio debe ser probado exhaustivamente.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentación o logs compartidos.
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por qué el cambio y si no afecta en el demás flujo.
- Si se modifican las reglas de acceso, actualizar la lógica de `canAccessUrl`.
- Mantener la redirección al login con `returnUrl` para mejorar la UX.
- La normalización de paths es crítica para la comparación; mantener esta lógica si se modifican los formatos de URL.
- El cacheo de módulos en `LoginService` es importante para rendimiento; mantener esta optimización.
- La verificación de `vista = true` es crítica para el control de acceso; mantener esta validación.
- El manejo de errores debe redirigir al home por seguridad; mantener este comportamiento.
- Si se agregan nuevos tipos de rutas, considerar si requieren lógica especial en el guard.
