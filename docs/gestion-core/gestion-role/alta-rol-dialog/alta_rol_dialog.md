# Diálogo - Gestion de Rol

- Nombre del diálogo:
- AltaRolDialog (Alta de Rol)

## 1. Objetivo y alcance
El diálogo permite crear y editar roles del sistema. Presenta un formulario con los campos requeridos para registrar o actualizar un rol: nombre, descripción, rol padre, permiso y módulos asociados. Soporta dos modos de operación: creación (data es null) y edición (data es un Role existente).

En la vista:
- Se muestra un formulario con campos: name, description, parentId, permissionId y modulesId
- Los campos name, description y modulesId son obligatorios
- Se muestra un selector de módulos cargados dinámicamente
- Se muestra un selector de permisos cargados dinámicamente
- Se muestra un selector de rol padre (opcional)
- Se muestra un botón para guardar el rol
- Se muestra un botón para cancelar y cerrar el diálogo

- Flujo funcional:
1. Al abrir el diálogo, se recibe data con un Role (modo edición) o null (modo creación)
2. Se inicializa el formulario con los datos del rol (si existe) o valores por defecto
3. Se cargan los módulos disponibles mediante `ModuleService.getAllModules()`
4. Se cargan los permisos disponibles mediante `RolService.getPermissions()`
5. Los permisos se cachean en permisosCache para uso futuro
6. El usuario completa o modifica los campos del formulario
7. Al hacer clic en guardar, se valida el formulario
8. Si es válido, se construye el payload con los datos del formulario
9. Se cierra el diálogo retornando el payload (no se hace la llamada al servicio desde el diálogo)
10. El componente padre es responsable de llamar al servicio para crear o actualizar
11. Al cancelar, se cierra el diálogo retornando null

## 2. Mapa de código
- Ruta del diálogo:
src/app/shared/dialogs/alta-rol-dialog/

- Clases involucradas:
```text
    src/app/shared/dialogs/alta-rol-dialog/
        alta-rol-dialog.ts
        alta-rol-dialog.html
        alta-rol-dialog.css

    src/app/core/services/
        module.service.ts
        rol.service.ts

    src/app/core/model/
        rol.model.ts
        module.model.ts
        permission.model.ts

    src/app/shared/directives/
        upperCase.directivas.ts
```

## 3. API (Service)
| Metodo   |          Ruta                              | Uso                                                         |
|----------|--------------------------------------------|-------------------------------------------------------------|
| GET      | `/modules`                                 | Obtiene todos los módulos                                   |
| GET      | `/roles/permisos`                          | Obtiene todos los permisos                                  |

## 4. Reglas de validación de negocio
1. **Campos obligatorios**: name, description y modulesId son requeridos.
2. **Validación de formulario**: El formulario debe ser válido antes de enviar (form.markAllAsTouched()).
3. **Payload**: Se envían los campos name, description, parentId, permissionId y modulesId.
4. **Manejo de nulos**: parentId y permissionId se envían como null si están vacíos o undefined.
5. **Sin llamada al servicio**: El diálogo no hace la llamada al servicio directamente; retorna el payload al componente padre.
6. **Cierre con payload**: Si es válido, se cierra el diálogo retornando el payload para que el componente padre lo procese.
7. **Cierre cancelación**: Si se cancela, se cierra el diálogo retornando null.
8. **Carga de datos**: Los módulos y permisos se cargan al iniciar el diálogo. Si fallan, se retornan arrays vacíos.
9. **Cache de permisos**: Los permisos se cachean en permisosCache para uso futuro en el componente.
10. **Compatibilidad de datos**: Se maneja tanto data.modulesId como data.modules para compatibilidad con diferentes formatos de datos.

## 5. Diagrama de clases
| Componente principal      | Servicios               | Modelos                 | Modelos de request       | Modelos de response       |
|---------------------------|-------------------------|-------------------------|--------------------------|---------------------------| 
| `AltaRolDialog`           | `ModuleService`         | `Role`                  | -                        | -                         |
|                           | `RolService`            | `Module`                |                          |                           |
|                           |                         | `Permission`            |                          |                           |

## 6. Métodos del componente AltaRolDialog

### 6.1 Métodos de ciclo de vida
| Método          | Descripción                                                                                                                                             |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ngOnInit()`    | Inicializa el componente: crea el formulario con los datos del rol (si existe), carga módulos y permisos. Cachea permisos en permisosCache.             |

### 6.2 Métodos de envío de formulario
| Método                | Descripción                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `guardar()`           | Valida el formulario. Si es válido, construye el payload y cierra el diálogo retornándolo. No hace llamada al servicio.               |

### 6.3 Métodos de cierre
| Método                | Descripción                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `cerrar()`            | Cierra el diálogo retornando null (cancelación).                                                                                      |

### 6.4 Métodos auxiliares
No aplica - Este diálogo no tiene métodos auxiliares adicionales.

## 7. Prueba operativa mínima
1. Abrir el diálogo en modo creación desde el módulo de gestión de roles.
2. Verificar que el formulario se inicialice con campos vacíos.
3. Verificar que se carguen los módulos y permisos correctamente.
4. Intentar enviar el formulario vacío y verificar que se muestren los errores de validación.
5. Completar los campos requeridos y guardar.
6. Verificar que el diálogo se cierre y el componente padre reciba el payload.
7. Verificar que el componente padre llame al servicio para crear el rol.
8. Abrir el diálogo en modo edición con un rol existente.
9. Verificar que el formulario se inicialice con los datos del rol.
10. Modificar campos y guardar.
11. Verificar que el diálogo se cierre y el componente padre reciba el payload actualizado.
12. Verificar que el componente padre llame al servicio para actualizar el rol.
13. Probar seleccionar módulos vacíos y verificar que falle la validación.
14. Verificar que el botón de cancelar cierre el diálogo sin guardar cambios.

## 8. Criterios al modificar el diálogo
- Conservar `ApiResponse` en todos los services (aunque este diálogo no hace llamadas directas).
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentación o logs compartidos.
- En caso de que se integren nuevas variables, revisar primero los modelos para ver si coincidan con lo que es el nuevo requerimiento.
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por qué el cambio y si no afecta en el demás flujo.
- Si se agregan campos al formulario, actualizar el FormGroup en ngOnInit y el payload en guardar.
- Mantener la consistencia en el uso de Validators.required para campos obligatorios.
- Preservar el comportamiento de retornar el payload al componente padre (no hacer llamadas al servicio desde el diálogo).
- El componente padre es responsable de llamar al servicio; mantener esta separación de responsabilidades.
- La compatibilidad con data.modulesId y data.modules debe mantenerse si se modifican los modelos.
- El cache de permisos (permisosCache) es útil para optimización; mantenerlo si se requiere acceso a permisos.
- La directiva UppercaseDirective se usa para convertir a mayúsculas; mantenerla si se requiere ese comportamiento.
