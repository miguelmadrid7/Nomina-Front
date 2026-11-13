# Diálogo - Alta de Parametrización

- Nombre del diálogo:
- AltaParametrizacionDialog (Alta de Parametrización)

## 1. Objetivo y alcance
El diálogo permite crear y editar parámetros de salario mínimo. Presenta un formulario con los campos requeridos para registrar o actualizar un parámetro: año, importe diario, importe mensual, quincena inicio y quincena fin. Soporta dos modos de operación: 'create' y 'update'.

En la vista:
- Se muestra un formulario con campos: anio, importeDiario, importeMensual, qnaInicio y qnaFin
- Todos los campos son obligatorios (Validators.required)
- Se muestra un botón para guardar el parámetro
- Se muestra un botón para cancelar y cerrar el diálogo
- Se muestra indicador de carga durante el proceso de guardado
- Se muestra mensajes de toast de éxito o error

- Flujo funcional:
1. Al abrir el diálogo, se recibe data con mode ('create' o 'update') y param (opcional)
2. Si mode es 'update' y existe param, se inicializa el formulario con los datos del parámetro
3. Si mode es 'create', el formulario se inicializa con valores nulos
4. El usuario completa o modifica los campos del formulario
5. Al hacer clic en guardar, se valida el formulario
6. Si es válido, se construye el payload con los datos del formulario
7. Si mode es 'update', se llama a `CoreSalarioMinimiService.updateParam()` con `PATCH /salario-minimo/${paramId}`
8. Si mode es 'create', se llama a `CoreSalarioMinimiService.createParam()` con `POST /salario-minimo`
9. Si la operación es exitosa, se cierra el diálogo retornando `true` y se muestra toast de éxito
10. Si falla, se muestra un toast de error y el diálogo permanece abierto
11. Al cancelar, se cierra el diálogo sin retornar valor

## 2. Mapa de código
- Ruta del diálogo:
src/app/shared/dialogs/alta-parametrizacion-dialog/

- Clases involucradas:
```text
    src/app/shared/dialogs/alta-parametrizacion-dialog/
        alta-parametrizacion-dialog.ts
        alta-parametrizacion-dialog.html
        alta-parametrizacion-dialog.css

    src/app/core/services/
        core-salario-minimo.service.ts
        toast.service.ts

    src/app/core/model/
        parametrizacion-request.model.ts
        parametrizacion-response.model.ts
        dialogdata.model.ts
```

## 3. API (Service)
| Metodo   |          Ruta                              | Uso                                                         |
|----------|--------------------------------------------|-------------------------------------------------------------|
| POST     | `/salario-minimo`                          | Crea un nuevo parámetro                                     |
| PATCH    | `/salario-minimo/${paramId}`               | Actualiza un parámetro existente                            |

## 4. Reglas de validación de negocio
1. **Campos obligatorios**: Todos los campos (anio, importeDiario, importeMensual, qnaInicio, qnaFin) son requeridos.
2. **Validación de formulario**: El formulario debe ser válido antes de enviar (form.markAllAsTouched()).
3. **Payload**: Se envían los campos anio, importeDiario, importeMensual, qnaInicio y qnaFin.
4. **Indicador de carga**: Se muestra isLoading=true durante la llamada al servicio.
5. **Manejo de errores**: Si falla la operación, se muestra un toast de error y el diálogo permanece abierto.
6. **Cierre exitoso**: Si la operación es exitosa, se cierra el diálogo retornando `true` para que el componente padre recargue la lista.
7. **Cierre cancelación**: Si se cancela, se cierra el diálogo sin retornar valor.
8. **Modo de operación**: El comportamiento cambia según mode ('create' o 'update').
9. **Inicialización en modo update**: Si mode es 'update' y existe param, se cargan los datos en el formulario mediante patchValue.

## 5. Diagrama de clases
| Componente principal            | Servicios                       | Modelos                 | Modelos de request       | Modelos de response       |
|---------------------------------|---------------------------------|-------------------------|--------------------------|---------------------------| 
| `AltaParametrizacionDialog`    | `CoreSalarioMinimiService`     | `ParametrizacionResponse` | `ParametrizacionRequest` | `ApiResponse<ParametrizacionResponse>` |
|                                 | `ToastService`                  | `DialogData`             |                          | `ApiResponse<any>`        |

## 6. Métodos del componente AltaParametrizacionDialog

### 6.1 Métodos de ciclo de vida
| Método          | Descripción                                                                                                                                             |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ngOnInit()`    | Si mode es 'update' y existe param, carga los datos del parámetro en el formulario mediante patchValue.                                                  |

### 6.2 Métodos de envío de formulario
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `guardar()`           | Valida el formulario. Si es válido, construye el payload y llama al servicio para crear o actualizar según mode. Cierra con true si es exitoso. |

### 6.3 Métodos de cierre
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `close()`             | Cierra el diálogo sin retornar valor (cancelación).                                                                                  |

### 6.4 Métodos auxiliares
No aplica - Este diálogo no tiene métodos auxiliares adicionales.

### 6.5 Getters
| Getter                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `get mode`            | Retorna el modo de operación ('create' o 'update') desde data.mode.                                                                    |
| `get isEdit`          | Retorna true si mode es 'update'.                                                                                                     |
| `get anioControl`     | Retorna el control del campo anio del formulario.                                                                                     |
| `get importeDiarioControl` | Retorna el control del campo importeDiario del formulario.                                                                          |
| `get importeMensualControl` | Retorna el control del campo importeMensual del formulario.                                                                        |
| `get qnaInicioControl` | Retorna el control del campo qnaInicio del formulario.                                                                               |
| `get qnaFinControl`   | Retorna el control del campo qnaFin del formulario.                                                                                   |

## 7. Prueba operativa mínima
1. Abrir el diálogo en modo 'create' desde el módulo de gestión de parametrización.
2. Verificar que el formulario se inicialice con campos nulos.
3. Intentar enviar el formulario vacío y verificar que se muestren los errores de validación.
4. Completar los campos requeridos y enviar.
5. Verificar que se muestre el indicador de carga.
6. Verificar que se muestre el toast de éxito y el diálogo se cierre.
7. Abrir el diálogo en modo 'update' con un parámetro existente.
8. Verificar que el formulario se inicialice con los datos del parámetro.
9. Modificar campos y enviar.
10. Verificar que se muestre el toast de actualización exitosa.
11. Probar con datos inválidos y verificar que se muestre el mensaje de error.
12. Verificar que el botón de cancelar cierre el diálogo sin guardar cambios.

## 8. Criterios al modificar el diálogo
- Conservar `ApiResponse` en todos los services.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentación o logs compartidos.
- En caso de que se integren nuevas variables, revisar primero los modelos para ver si coincidan con lo que es el nuevo requerimiento.
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por qué el cambio y si no afecta en el demás flujo.
- Si se agregan campos al formulario, actualizar el FormGroup y los getters correspondientes.
- Mantener la consistencia en el uso de Validators.required para campos obligatorios.
- Preservar el comportamiento de retornar `true` al éxito para que el componente padre pueda recargar la lista.
- El modo de operación ('create' vs 'update') debe mantenerse para diferenciar entre creación y actualización.
- La inicialización con patchValue en modo update es crítica; mantener esta lógica si se modifican los campos.
