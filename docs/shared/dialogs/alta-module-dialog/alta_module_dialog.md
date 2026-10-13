# Diálogo - Gestión de Módulo

- Nombre del diálogo:
- ALtaModuleDialog (Alta de Módulo)

## 1. Objetivo y alcance
El diálogo permite crear y editar módulos del sistema. Presenta un formulario con los campos requeridos para registrar o actualizar un módulo: nombre, ruta, descripción, visibilidad, ícono, módulo padre y roles asociados. Soporta dos modos de operación: 'create' y 'edit'.

En la vista:
- Se muestra un formulario con campos: id (deshabilitado), name, path, description, visible, iconId, parentId y rolesId
- Los campos name, description, visible, iconId y rolesId son obligatorios
- Se muestra un selector de íconos cargados dinámicamente
- Se muestra un selector de roles cargados dinámicamente
- Se muestra un selector de módulo padre (excluyendo el módulo actual y sus descendientes en modo edit)
- Se muestra un botón para guardar el módulo
- Se muestra un botón para cancelar y cerrar el diálogo
- Se muestra mensajes de toast de éxito o error

- Flujo funcional:
1. Al abrir el diálogo, se recibe data con mode ('create' o 'edit') y module (opcional)
2. Se inicializa el formulario con los datos del módulo (si existe) o valores por defecto
3. Se cargan los roles disponibles mediante `UserService.getRoles()`
4. Se cargan los íconos disponibles mediante `IconService.getIcons()`
5. Se calculan las opciones de módulo padre excluyendo el módulo actual y sus descendientes
6. El usuario completa o modifica los campos del formulario
7. Al hacer clic en guardar, se valida el formulario
8. Si es válido, se construye el payload con los datos del formulario
9. Si mode es 'edit', se llama a `ModuleService.updateModule()` con `PATCH /modules`
10. Si mode es 'create', se llama a `ModuleService.createModule()` con `POST /modules`
11. Si la operación es exitosa, se cierra el diálogo retornando `true` y se muestra toast de éxito
12. Si falla, se muestra un toast de error y el diálogo permanece abierto
13. Al cancelar, se cierra el diálogo sin retornar valor

## 2. Mapa de código
- Ruta del diálogo:
src/app/shared/dialogs/alta-module-dialog/

- Clases involucradas:
```text
    src/app/shared/dialogs/alta-module-dialog/
        alta-module-dialog.ts
        alta-module-dialog.html
        alta-module-dialog.css

    src/app/core/services/
        module.service.ts
        user.service.ts
        icon.service.ts
        toast.service.ts

    src/app/core/model/
        module.model.ts
        module-request.model.ts
        module-dialog-data.model.ts
        rol.model.ts
        icon.model.ts

    src/app/shared/directives/
        upperCase.directivas.ts
```

## 3. API (Service)
| Metodo   |          Ruta                              | Uso                                                         |
|----------|--------------------------------------------|-------------------------------------------------------------|
| GET      | `/roles`                                   | Obtiene todos los roles                                     |
| GET      | `/notifications/icons`                     | Obtiene todos los íconos                                    |
| POST     | `/modules`                                 | Crea un nuevo módulo                                        |
| PATCH    | `/modules`                                 | Actualiza un módulo existente (header: moduleId)            |

## 4. Reglas de validación de negocio
1. **Campos obligatorios**: name, description, visible, iconId y rolesId son requeridos.
2. **Validación de formulario**: El formulario debe ser válido antes de enviar (form.markAllAsTouched()).
3. **Validación de roles**: Se requiere al menos un rol seleccionado (rolesId.length > 0).
4. **Módulo padre**: En modo edit, no se puede seleccionar como padre el módulo actual ni sus descendientes (evitar ciclos).
5. **Payload**: Se envían los campos name, path, description, visible, iconId, parentId y rolesId.
6. **Manejo de nulos**: parentId y path se envían como null si están vacíos o undefined.
7. **Indicador de carga**: No se muestra loading explícito, pero se maneja con toasts.
8. **Manejo de errores**: Si falla la operación, se muestra un toast de error y el diálogo permanece abierto.
9. **Cierre exitoso**: Si la operación es exitosa, se cierra el diálogo retornando `true` para que el componente padre recargue la lista.
10. **Cierre cancelación**: Si se cancela, se cierra el diálogo sin retornar valor.
11. **Modo de operación**: El comportamiento cambia según mode ('create' o 'edit').

## 5. Diagrama de clases
| Componente principal      | Servicios               | Modelos                 | Modelos de request       | Modelos de response       |
|---------------------------|-------------------------|-------------------------|--------------------------|---------------------------| 
| `ALtaModuleDialog`        | `ModuleService`         | `Module`                | `ModuleRequest`          | `ApiResponse<any>`        |
|                           | `UserService`           | `Role`                  |                          |                           |
|                           | `IconService`           | `Icon`                  |                          |                           |
|                           | `ToastService`          | `DialogData`            |                          |                           |

## 6. Métodos del componente ALtaModuleDialog

### 6.1 Métodos de ciclo de vida
| Método          | Descripción                                                                                                                                             |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ngOnInit()`    | Inicializa el componente: crea el formulario con los datos del módulo, carga roles, íconos y calcula opciones de padre.                                 |

### 6.2 Métodos de carga de datos
| Método                | Descripción                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `loadRoles()`         | Obtiene todos los roles desde `GET /roles`. Maneja errores retornando array vacío.                                                    |
| `loadIcons()`         | Obtiene todos los íconos desde `GET /notifications/icons`. Actualiza el signal icons. Muestra toast de error si falla.                |

### 6.3 Métodos de envío de formulario
| Método                | Descripción                                                                                                                                     |
|-----------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| `submit()`            | Valida el formulario. Si es válido, construye el payload y llama al servicio para crear o actualizar según mode. Cierra con true si es exitoso. |

### 6.4 Métodos de cierre
| Método                | Descripción                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `close()`             | Cierra el diálogo sin retornar valor (cancelación).                                                                                   |

### 6.5 Métodos auxiliares
| Método                        | Descripción                                                                                                                           |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `calcularOpcionesPadre()`     | Calcula los módulos disponibles como padre excluyendo el módulo actual y sus descendientes para evitar ciclos en la jerarquía.        |
| `get mode`                    | Getter que retorna el modo de operación ('create' o 'edit') desde data.mode.                                                          |
| `get module`                  | Getter que retorna el módulo desde data.module o un módulo vacío por defecto.                                                         |
| `get selectedIcon`            | Getter que retorna el ícono seleccionado basado en iconId del formulario.                                                             |

## 7. Prueba operativa mínima
1. Abrir el diálogo en modo 'create' desde el módulo de gestión de módulos.
2. Verificar que el formulario se inicialice con campos vacíos.
3. Verificar que se carguen los roles e íconos correctamente.
4. Intentar enviar el formulario vacío y verificar que se muestren los errores de validación.
5. Completar los campos requeridos y enviar.
6. Verificar que se muestre el toast de éxito y el diálogo se cierre.
7. Abrir el diálogo en modo 'edit' con un módulo existente.
8. Verificar que el formulario se inicialice con los datos del módulo.
9. Verificar que el campo id esté deshabilitado.
10. Verificar que el módulo actual y sus descendientes no aparezcan en las opciones de padre.
11. Modificar campos y enviar.
12. Verificar que se muestre el toast de actualización exitosa.
13. Probar seleccionar roles vacíos y verificar que falle la validación.
14. Verificar que el botón de cancelar cierre el diálogo sin guardar cambios.

## 8. Criterios al modificar el diálogo
- Conservar `ApiResponse` en todos los services.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentación o logs compartidos.
- En caso de que se integren nuevas variables, revisar primero los modelos para ver si coincidan con lo que es el nuevo requerimiento.
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por qué el cambio y si no afecta en el demás flujo.
- Si se agregan campos al formulario, actualizar el FormGroup en ngOnInit y el payload en submit.
- Mantener la consistencia en el uso de Validators.required para campos obligatorios.
- Preservar el comportamiento de retornar `true` al éxito para que el componente padre pueda recargar la lista.
- La lógica de calcularOpcionesPadre es crítica para evitar ciclos en la jerarquía; mantener esta lógica si se modifican las relaciones padre-hijo.
- El modo de operación ('create' vs 'edit') debe mantenerse para diferenciar entre creación y actualización.
- La directiva UppercaseDirective se usa para convertir a mayúsculas; mantenerla si se requiere ese comportamiento.
