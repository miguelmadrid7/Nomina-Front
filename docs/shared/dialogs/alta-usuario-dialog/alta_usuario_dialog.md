# Diálogo - Gestión de Usuario

- Nombre del diálogo:
- AltaUsuarioDialog (Alta de Usuario)

## 1. Objetivo y alcance
El diálogo permite crear nuevos usuarios en el sistema. Presenta un formulario con los campos requeridos para registrar un usuario: usuario (email), contraseña, empleado (srl_emp), área, task, activo, página principal, extras y roles. Recibe los roles disponibles desde el componente padre.

En la vista:
- Se muestra un formulario con campos: user, password, srl_emp, area, task, active, principal, extras y roles
- Los campos user, password, srl_emp y roles son obligatorios
- El campo user debe ser un email válido
- El campo password debe tener mínimo 6 caracteres
- El campo password tiene un botón para mostrar/ocultar
- El campo active es un checkbox (booleano, por defecto true)
- El campo principal tiene un valor por defecto 'pages/Inicio/General'
- El campo roles es un selector que recibe los roles disponibles desde data
- Si solo hay un rol disponible, se selecciona automáticamente
- Se muestra un botón para guardar el usuario
- Se muestra un botón para cancelar y cerrar el diálogo

- Flujo funcional:
1. Al abrir el diálogo, se recibe data con roles disponibles
2. Se inicializa el formulario con valores por defecto
3. Si solo hay un rol disponible, se selecciona automáticamente
4. El usuario completa los campos del formulario
5. Al hacer clic en guardar, se valida el formulario
6. Si es válido, se obtiene el valor raw del formulario
7. Se cierra el diálogo retornando el payload (no se hace la llamada al servicio desde el diálogo)
8. El componente padre es responsable de llamar al servicio para crear el usuario
9. Al cancelar, se cierra el diálogo sin retornar valor

## 2. Mapa de código
- Ruta del diálogo:
src/app/shared/dialogs/alta-usuario-dialog/

- Clases involucradas:
```text
    src/app/shared/dialogs/alta-usuario-dialog/
        alta-usuario-dialog.ts
        alta-usuario-dialog.html
        alta-usuario-dialog.css

    src/app/shared/directives/
        upperCase.directivas.ts
```

## 3. API (Service)
No aplica - Este diálogo no hace llamadas directas al servicio. Retorna el payload al componente padre.

## 4. Reglas de validación de negocio
1. **Campos obligatorios**: user, password, srl_emp y roles son requeridos.
2. **Validación de email**: El campo user debe ser un email válido (Validators.email).
3. **Validación de contraseña**: El campo password debe tener mínimo 6 caracteres (Validators.minLength(6)).
4. **Validación de formulario**: El formulario debe ser válido antes de enviar (form.markAllAsTouched()).
5. **Payload**: Se envían los campos user, password, srl_emp, area, task, active, principal, extras y roles.
6. **Valores por defecto**: active tiene valor por defecto true, principal tiene valor por defecto 'pages/Inicio/General', extras tiene valor por defecto [].
7. **Selección automática de rol**: Si solo hay un rol disponible, se selecciona automáticamente.
8. **Sin llamada al servicio**: El diálogo no hace la llamada al servicio directamente; retorna el payload al componente padre.
9. **Cierre con payload**: Si es válido, se cierra el diálogo retornando el payload para que el componente padre lo procese.
10. **Cierre cancelación**: Si se cancela, se cierra el diálogo sin retornar valor.
11. **Ocultar contraseña**: El campo password tiene un botón para mostrar/ocultar (hidePassword).

## 5. Diagrama de clases
| Componente principal      | Servicios               | Modelos                 | Modelos de request       | Modelos de response       |
|---------------------------|-------------------------|-------------------------|--------------------------|---------------------------| 
| `AltaUsuarioDialog`       | -                       | -                       | -                        | -                         |

## 6. Métodos del componente AltaUsuarioDialog

### 6.1 Métodos de ciclo de vida
| Método          | Descripción                                                                                                                                             |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ngOnInit()`    | Inicializa el componente: crea el formulario con valores por defecto. Si solo hay un rol disponible, lo selecciona automáticamente.                     |

### 6.2 Métodos de envío de formulario
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `guardar()`           | Valida el formulario. Si es válido, obtiene el valor raw y cierra el diálogo retornándolo. No hace llamada al servicio.               |

### 6.3 Métodos de cierre
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `cerrar()`            | Cierra el diálogo sin retornar valor (cancelación).                                                                                   |

### 6.4 Métodos auxiliares
No aplica - Este diálogo no tiene métodos auxiliares adicionales.

## 7. Prueba operativa mínima
1. Abrir el diálogo desde el módulo de gestión de usuarios.
2. Verificar que el formulario se inicialice con valores por defecto.
3. Verificar que si solo hay un rol disponible, se seleccione automáticamente.
4. Intentar enviar el formulario vacío y verificar que se muestren los errores de validación.
5. Intentar enviar con un email inválido y verificar que falle la validación.
6. Intentar enviar con una contraseña menor a 6 caracteres y verificar que falle la validación.
7. Completar los campos requeridos correctamente y guardar.
8. Verificar que el diálogo se cierre y el componente padre reciba el payload.
9. Verificar que el componente padre llame al servicio para crear el usuario.
10. Probar el botón de mostrar/ocultar contraseña.
11. Verificar que el checkbox active funcione correctamente.
12. Verificar que el botón de cancelar cierre el diálogo sin guardar cambios.

## 8. Criterios al modificar el diálogo
- Conservar `ApiResponse` en todos los services (aunque este diálogo no hace llamadas directas).
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentación o logs compartidos.
- En caso de que se integren nuevas variables, revisar primero los modelos para ver si coincidan con lo que es el nuevo requerimiento.
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por qué el cambio y si no afecta en el demás flujo.
- Si se agregan campos al formulario, actualizar el FormGroup en ngOnInit.
- Mantener la consistencia en el uso de Validators.required para campos obligatorios.
- Preservar el comportamiento de retornar el payload al componente padre (no hacer llamadas al servicio desde el diálogo).
- El componente padre es responsable de llamar al servicio; mantener esta separación de responsabilidades.
- La validación de email (Validators.email) es crítica; mantenerla si se requiere este formato.
- La validación de longitud mínima de contraseña (Validators.minLength(6)) es crítica para seguridad; mantenerla.
- La selección automática de rol cuando solo hay uno disponible es útil para UX; mantener esta lógica.
- La directiva UppercaseDirective se usa para convertir a mayúsculas; mantenerla si se requiere ese comportamiento.
