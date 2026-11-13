# Interceptor - Loader Interceptor

- Nombre del interceptor:
- LoaderInterceptor (Interceptor de Loader)

## 1. Objetivo y alcance
El interceptor está diseñado para manejar indicadores de carga (loader) durante las peticiones HTTP. Actualmente es una implementación placeholder que no implementa ninguna funcionalidad de loader. Implementa la interfaz `HttpInterceptor` de Angular pero solo pasa la petición al siguiente handler sin modificaciones.

En la vista:
- No tiene vista directa, es un interceptor de Angular HTTP
- Se ejecuta automáticamente en todas las peticiones HTTP
- Actualmente no implementa ninguna funcionalidad
- Solo pasa la petición al siguiente handler sin modificaciones

- Flujo funcional:
1. Se intercepta cada petición HTTP saliente
2. Se llama al método `intercept` con la petición y el handler
3. Se pasa la petición al siguiente handler sin modificaciones
4. No se muestra ningún indicador de carga
5. No se realiza ninguna acción adicional

**Nota**: Este interceptor parece ser un placeholder o una implementación incompleta. Para implementar funcionalidad de loader, se debería:
- Mostrar un indicador de carga global al iniciar una petición
- Ocultar el indicador de carga al completar o fallar la petición
- Manejar múltiples peticiones concurrentes para mantener el loader visible hasta que todas terminen

## 2. Mapa de código
- Ruta del interceptor:
src/app/core/interceptors/

- Clases involucradas:
```text
    src/app/core/interceptors/
        loader.interceptor.ts
```

## 3. API (Service)
No aplica - Este interceptor no utiliza servicios actualmente.

## 4. Reglas de validación de negocio
1. **Sin funcionalidad actual**: El interceptor no implementa ninguna funcionalidad de loader.
2. **Paso de petición**: La petición se pasa al siguiente handler sin modificaciones.
3. **Placeholder**: Este interceptor parece ser un placeholder para funcionalidad futura.
4. **Interfaz HttpInterceptor**: Implementa la interfaz estándar de Angular para interceptores.

## 5. Diagrama de clases
| Interceptor           | Servicios               |
|-----------------------|-------------------------|
| `LoaderInterceptor`   | -                       |

## 6. Métodos del interceptor LoaderInterceptor

### 6.1 Método de interceptación
| Método          | Descripción                                                                                                                                             |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `intercept(req, next)` | Pasa la petición al siguiente handler sin modificaciones. Actualmente no implementa ninguna funcionalidad de loader.                                    |

### 6.2 Métodos auxiliares
No aplica - Este interceptor no tiene métodos auxiliares adicionales.

## 7. Prueba operativa mínima
1. Realizar cualquier petición HTTP.
2. Verificar que la petición se complete normalmente.
3. Verificar que no se muestre ningún indicador de carga global.
4. Verificar que el interceptor no interfiera con las peticiones.

**Nota**: Al ser un placeholder, no hay funcionalidad específica que probar. Si se implementa la funcionalidad de loader, se deberían agregar pruebas para:
- Verificar que el loader se muestre al iniciar peticiones
- Verificar que el loader se oculte al completar peticiones
- Verificar el manejo de múltiples peticiones concurrentes

## 8. Criterios al modificar el interceptor
- Este interceptor está diseñado para manejar loaders; cualquier implementación debe mantener este propósito.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentación o logs compartidos.
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por qué el cambio y si no afecta en el demás flujo.
- Si se implementa la funcionalidad de loader:
  - Considerar usar un servicio global de loader (ej. LoaderService)
  - Manejar múltiples peticiones concurrentes para mantener el loader visible hasta que todas terminen
  - Considerar exclusiones de URLs que no deben mostrar loader (ej. polling)
  - Manejar errores para asegurar que el loader se oculte incluso si falla la petición
- Mantener la implementación de la interfaz `HttpInterceptor` para compatibilidad con Angular.
- Considerar si se requiere configuración para personalizar el comportamiento del loader.
