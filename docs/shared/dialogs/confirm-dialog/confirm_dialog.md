# Diálogo - Confirmación

- Nombre del diálogo:
- ConfirmDialog (Diálogo de Confirmación)

## 1. Objetivo y alcance
El diálogo es un componente genérico de confirmación reutilizable en toda la aplicación. Presenta un mensaje de confirmación con título, mensaje personalizado, botón de confirmar y botón de cancelar. Soporta diferentes tipos visuales (danger o info) según la naturaleza de la acción a confirmar.

En la vista:
- Se muestra un título (opcional, por defecto vacío)
- Se muestra un mensaje (opcional, por defecto vacío)
- Se muestra un botón de confirmar con texto personalizable (por defecto vacío)
- Se muestra un botón de cancelar con texto personalizable (por defecto vacío)
- El tipo visual puede ser 'danger' (rojo) o 'info' (azul) según la acción
- Se muestra un ícono según el tipo de diálogo

- Flujo funcional:
1. Al abrir el diálogo, se recibe data con title, message, confirmText, cancelText y type
2. Se muestra el diálogo con los datos proporcionados
3. El usuario puede hacer clic en confirmar
4. Al confirmar, se cierra el diálogo retornando `true`
5. El usuario puede hacer clic en cancelar
6. Al cancelar, se cierra el diálogo retornando `false`
7. El usuario puede cerrar el diálogo con el botón X
8. Al cerrar con X, se cierra el diálogo sin retornar valor

## 2. Mapa de código
- Ruta del diálogo:
src/app/shared/dialogs/confirm-dialog/

- Clases involucradas:
```text
    src/app/shared/dialogs/confirm-dialog/
        confirm-dialog.ts
        confirm-dialog.html
        confirm-dialog.css
```

## 3. API (Service)
No aplica - Este diálogo no hace llamadas al servicio. Solo retorna un valor booleano al componente padre.

## 4. Reglas de validación de negocio
1. **Data opcional**: Todos los campos de data son opcionales (title, message, confirmText, cancelText, type).
2. **Tipo de diálogo**: El type puede ser 'danger' (para acciones destructivas) o 'info' (para acciones informativas).
3. **Retorno booleano**: Al confirmar retorna `true`, al cancelar retorna `false`.
4. **Cierre sin valor**: Al cerrar con el botón X, no retorna valor (undefined).
5. **Reutilizabilidad**: Este diálogo es genérico y se usa en múltiples lugares del sistema para confirmar acciones.
6. **disableClose**: El componente padre puede configurar disableClose en el MatDialog.open para evitar cerrar por click fuera.

## 5. Diagrama de clases
| Componente principal      | Servicios               | Modelos                 | Modelos de request       | Modelos de response       |
|---------------------------|-------------------------|-------------------------|--------------------------|---------------------------| 
| `ConfirmDialog`           | -                       | -                       | -                        | `boolean`                 |

## 6. Métodos del componente ConfirmDialog

### 6.1 Métodos de ciclo de vida
No aplica - Este diálogo no tiene métodos de ciclo de vida explícitos.

### 6.2 Métodos de confirmación
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `confirm()`           | Cierra el diálogo retornando `true` (confirmación).                                                                                  |
| `cancel()`            | Cierra el diálogo retornando `false` (cancelación).                                                                                  |

### 6.3 Métodos de cierre
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `cerrar()`            | Cierra el diálogo sin retornar valor (cierre con botón X).                                                                           |

### 6.4 Métodos auxiliares
No aplica - Este diálogo no tiene métodos auxiliares adicionales.

## 7. Prueba operativa mínima
1. Abrir el diálogo desde cualquier componente con data.type = 'danger'.
2. Verificar que se muestre el estilo visual de danger (rojo).
3. Verificar que se muestre el título y mensaje proporcionados.
4. Hacer clic en confirmar y verificar que retorne `true`.
5. Abrir el diálogo con data.type = 'info'.
6. Verificar que se muestre el estilo visual de info (azul).
7. Hacer clic en cancelar y verificar que retorne `false`.
8. Abrir el diálogo sin proporcionar data.
9. Verificar que se muestre con valores por defecto (vacíos).
10. Cerrar con el botón X y verificar que no retorne valor.
11. Probar con disableClose = true y verificar que no se pueda cerrar por click fuera.

## 8. Criterios al modificar el diálogo
- Este es un diálogo genérico reutilizable en toda la aplicación; cualquier cambio debe considerar el impacto en todos los usos.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentación o logs compartidos.
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por qué el cambio y si no afecta en el demás flujo.
- Si se agregan nuevos tipos visuales, actualizar la interfaz de data para incluirlos.
- Mantener la consistencia en el retorno de valores booleanos (true para confirmar, false para cancelar).
- Preservar la simplicidad del diálogo; es un componente genérico que no debe tener lógica de negocio compleja.
- El tipo 'danger' debe usarse para acciones destructivas (eliminar, soft delete).
- El tipo 'info' debe usarse para acciones informativas o menos críticas.
- Si se modifican los textos por defecto, considerar el impacto en todos los componentes que usan este diálogo.
