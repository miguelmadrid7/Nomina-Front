# Diálogo - Gestión de Ícono

- Nombre del diálogo:
- IconoDialog (Alta de Ícono)

## 1. Objetivo y alcance
El diálogo permite crear nuevos íconos en el sistema. Presenta un formulario con los campos requeridos para registrar un ícono: nombre, icono y descripción.

En la vista:
- Se muestra un formulario con tres campos: name, icon y description
- Todos los campos son obligatorios (Validators.required)
- Se muestra un botón para guardar el ícono
- Se muestra un botón para cancelar y cerrar el diálogo
- Se muestra indicador de carga durante el proceso de creación
- Se muestra mensajes de error si falla la creación

- Flujo funcional:
1. Al abrir el diálogo, se inicializa el formulario con los campos vacíos
2. El usuario completa los campos del formulario
3. Al hacer clic en guardar, se valida el formulario
4. Si es válido, se construye el payload con los datos del formulario
5. Se llama al servicio `IconService.createIcon(payload)` con `POST /notifications/icons`
6. Si la creación es exitosa, se cierra el diálogo retornando `true`
7. Si falla, se muestra un mensaje de error y el diálogo permanece abierto
8. Al cancelar, se cierra el diálogo retornando `false`

## 2. Mapa de código
- Ruta del diálogo:
src/app/shared/dialogs/alta-icono-dialog/

- Clases involucradas:
```text
    src/app/shared/dialogs/alta-icono-dialog/
        alta-icono-dialog.ts
        alta-icono-dialog.html
        alta-icono-dialog.css

    src/app/core/services/
        icon.service.ts

    src/app/core/model/
        icon.model.ts
        icon-requets.model.ts

    src/app/shared/directives/
        upperCase.directivas.ts
```

## 3. API (Service)
| Metodo   |          Ruta                              | Uso                                                         |
|----------|--------------------------------------------|-------------------------------------------------------------|
| POST     | `/notifications/icons`                     | Crea un nuevo ícono                                         |

## 4. Reglas de validación de negocio
1. **Campos obligatorios**: Todos los campos (name, icon, description) son requeridos.
2. **Validación de formulario**: El formulario debe ser válido antes de enviar (form.markAllAsTouched()).
3. **Payload**: Se envían únicamente los campos name, icon y description.
4. **Indicador de carga**: Se muestra loading=true durante la llamada al servicio.
5. **Manejo de errores**: Si falla la creación, se muestra un mensaje de error y se mantiene el diálogo abierto.
6. **Cierre exitoso**: Si la creación es exitosa, se cierra el diálogo retornando `true` para que el componente padre recargue la lista.
7. **Cierre cancelación**: Si se cancela, se cierra el diálogo retornando `false`.

## 5. Diagrama de clases
| Componente principal      | Servicios               | Modelos                 | Modelos de request       | Modelos de response       |
|---------------------------|-------------------------|-------------------------|--------------------------|---------------------------| 
| `IconoDialog`             | `IconService`           | `Icon`                  | `IconRequest`            | `ApiResponse<any>`        |

## 6. Métodos del componente IconoDialog

### 6.1 Métodos de ciclo de vida
| Método          | Descripción                                                                                                                                             |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ngOnInit()`    | Inicializa el componente: crea el formulario con los campos name, icon y description, todos con Validators.required.                                    |

### 6.2 Métodos de envío de formulario
| Método                | Descripcion                                                                                                                                 |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| `submit()`            | Valida el formulario. Si es válido, construye el payload y llama al servicio para crear el ícono. Cierra el diálogo con true si es exitoso. |

### 6.3 Métodos de cierre
| Metodo                | Descripcion                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `close()`             | Cierra el diálogo retornando `false` (cancelación).                                                                                   |

### 6.4 Métodos auxiliares
No aplica - Este diálogo no tiene métodos auxiliares adicionales.

## 7. Prueba operativa mínima
1. Abrir el diálogo desde el módulo de gestión de íconos.
2. Verificar que el formulario se inicialice correctamente con campos vacíos.
3. Intentar enviar el formulario vacío y verificar que se muestren los errores de validación.
4. Completar solo algunos campos y verificar que la validación falle.
5. Completar todos los campos correctamente y enviar.
6. Verificar que se muestre el indicador de carga.
7. Verificar que al ser exitoso, el diálogo se cierre y la lista de íconos se recargue.
8. Probar con datos inválidos y verificar que se muestre el mensaje de error.
9. Verificar que el botón de cancelar cierre el diálogo sin guardar cambios.

## 8. Criterios al modificar el diálogo
- Conservar `ApiResponse` en todos los services.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentación o logs compartidos.
- En caso de que se integren nuevas variables, revisar primero los modelos para ver si coincidan con lo que es el nuevo requerimiento.
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por qué el cambio y si no afecta en el demás flujo.
- Si se agregan campos al formulario, actualizar el FormGroup en ngOnInit y el payload en submit.
- Mantener la consistencia en el uso de Validators.required para campos obligatorios.
- Preservar el comportamiento de retornar `true` al éxito y `false` al cancelar para que el componente padre pueda recargar la lista.
- La directiva UppercaseDirective se usa para convertir a mayúsculas; mantenerla si se requiere ese comportamiento.
