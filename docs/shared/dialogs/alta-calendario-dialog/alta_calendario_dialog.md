# Diálogo - Gestión de Calendario

- Nombre del diálogo:
- AltaCalendarioDialog (Alta de Calendario)

## 1. Objetivo y alcance
El diálogo permite crear y editar calendarios del sistema. Presenta un formulario con los campos requeridos para registrar o actualizar un calendario: ejercicio, quincena, tipo, fecha de cierre, fecha de pago y banderas de configuración (movimientos, pensión, juicios, terceros, activa). Soporta dos modos de operación: 'create' y 'edit'.

En la vista:
- Se muestra un formulario con campos: ejercicio, qna, tipo, fechaCierre, fechaPago, movimientos, pension, juicios, terceros y activa
- Los campos ejercicio, qna, tipo, fechaCierre y fechaPago son obligatorios
- Los campos movimientos, pension, juicios, terceros y activa son checkboxes (booleanos)
- Se muestra un botón para guardar el calendario
- Se muestra un botón para cancelar y cerrar el diálogo

- Flujo funcional:
1. Al abrir el diálogo, se recibe data con mode ('create' o 'edit') y calendario (opcional)
2. Se inicializa el formulario con los datos del calendario (si existe) o valores por defecto
3. Las fechas se convierten de string a Date si existen
4. El usuario completa o modifica los campos del formulario
5. Al hacer clic en guardar, se valida el formulario
6. Si es válido, se construye el payload con los datos del formulario
7. Las fechas se convierten de Date a string (formato YYYY-MM-DD)
8. Se cierra el diálogo retornando el payload (no se hace la llamada al servicio desde el diálogo)
9. El componente padre es responsable de llamar al servicio para crear o actualizar
10. Al cancelar, se cierra el diálogo sin retornar valor

## 2. Mapa de código
- Ruta del diálogo:
src/app/shared/dialogs/alta-calendario-dialog/

- Clases involucradas:
```text
    src/app/shared/dialogs/alta-calendario-dialog/
        alta-calendario-dialog.ts
        alta-calendario-dialog.html
        alta-calendario-dialog.css

    src/app/core/model/
        calendario.model.ts
        dialogdata.model.ts
```

## 3. API (Service)
No aplica - Este diálogo no hace llamadas directas al servicio. Retorna el payload al componente padre.

## 4. Reglas de validación de negocio
1. **Campos obligatorios**: ejercicio, qna, tipo, fechaCierre y fechaPago son requeridos.
2. **Validación de formulario**: El formulario debe ser válido antes de enviar.
3. **Payload**: Se envían los campos ejercicio, qna, tipo, fechaCierre, fechaPago, movimientos, pension, juicios, terceros y activa.
4. **Conversión de fechas**: Las fechas se convierten de Date a string (formato YYYY-MM-DD) al construir el payload.
5. **Valores por defecto**: Los checkboxes tienen valor por defecto false si no se especifican.
6. **Sin llamada al servicio**: El diálogo no hace la llamada al servicio directamente; retorna el payload al componente padre.
7. **Cierre con payload**: Si es válido, se cierra el diálogo retornando el payload para que el componente padre lo procese.
8. **Cierre cancelación**: Si se cancela, se cierra el diálogo sin retornar valor.
9. **Modo de operación**: El comportamiento cambia según mode ('create' o 'edit'), pero ambos retornan el payload.

## 5. Diagrama de clases
| Componente principal      | Servicios               | Modelos                 | Modelos de request       | Modelos de response       |
|---------------------------|-------------------------|-------------------------|--------------------------|---------------------------| 
| `AltaCalendarioDialog`    | -                       | `Calendario`            | -                        | -                         |
|                           |                         | `DialogData`            |                          |                           |

## 6. Métodos del componente AltaCalendarioDialog

### 6.1 Métodos de ciclo de vida
No aplica - Este diálogo no tiene métodos de ciclo de vida explícitos (el formulario se inicializa en la declaración de propiedades).

### 6.2 Métodos de envío de formulario
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `save()`              | Valida el formulario. Si es válido, construye el payload convirtiendo fechas a string y cierra el diálogo retornándolo.               |

### 6.3 Métodos de cierre
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `cancel()`            | Cierra el diálogo sin retornar valor (cancelación).                                                                                   |

### 6.4 Métodos auxiliares
No aplica - Este diálogo no tiene métodos auxiliares adicionales.

## 7. Prueba operativa mínima
1. Abrir el diálogo en modo 'create' desde el módulo de gestión de calendario.
2. Verificar que el formulario se inicialice con campos nulos.
3. Intentar enviar el formulario vacío y verificar que falle la validación.
4. Completar los campos requeridos y guardar.
5. Verificar que el diálogo se cierre y el componente padre reciba el payload.
6. Verificar que las fechas se conviertan correctamente a formato YYYY-MM-DD.
7. Verificar que el componente padre llame al servicio para crear el calendario.
8. Abrir el diálogo en modo 'edit' con un calendario existente.
9. Verificar que el formulario se inicialice con los datos del calendario.
10. Verificar que las fechas se conviertan de string a Date correctamente.
11. Modificar campos y guardar.
12. Verificar que el diálogo se cierre y el componente padre reciba el payload actualizado.
13. Verificar que el componente padre llame al servicio para actualizar el calendario.
14. Probar con los checkboxes y verificar que se envíen correctamente como booleanos.
15. Verificar que el botón de cancelar cierre el diálogo sin guardar cambios.

## 8. Criterios al modificar el diálogo
- Conservar `ApiResponse` en todos los services (aunque este diálogo no hace llamadas directas).
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentación o logs compartidos.
- En caso de que se integren nuevas variables, revisar primero los modelos para ver si coincidan con lo que es el nuevo requerimiento.
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por qué el cambio y si no afecta en el demás flujo.
- Si se agregan campos al formulario, actualizar el FormGroup y el payload en save.
- Mantener la consistencia en el uso de Validators.required para campos obligatorios.
- Preservar el comportamiento de retornar el payload al componente padre (no hacer llamadas al servicio desde el diálogo).
- El componente padre es responsable de llamar al servicio; mantener esta separación de responsabilidades.
- La conversión de fechas de Date a string (YYYY-MM-DD) es crítica; mantener esta lógica si se modifican los campos de fecha.
- La conversión de fechas de string a Date al inicializar el formulario es crítica; mantener esta lógica si se modifican los campos de fecha.
- Los checkboxes deben tener valor por defecto false; mantener este comportamiento si se agregan nuevos checkboxes.
