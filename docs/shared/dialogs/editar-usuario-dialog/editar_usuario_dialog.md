# Diálogo - Editar Usuario

- Nombre del diálogo:
- UsuarioDialog (Editar Usuario)

## 1. Objetivo y alcance
El diálogo permite editar usuarios existentes del sistema. Presenta un formulario con los campos para actualizar un usuario: id (deshabilitado), catEmpleadoId, username, email, área, task, activo, eliminado, verificado, tiene contraseña, página principal, extras y roles. Recibe el usuario a editar y los roles seleccionados desde el componente padre.

En la vista:
- Se muestra un formulario con campos: id, catEmpleadoId, username, email, area, task, active, deleted, isVerified, isPassword, principal, extras y roleIds
- El campo id está deshabilitado
- Los campos active, deleted, isVerified e isPassword son checkboxes (booleanos)
- El campo extras se muestra como string separado por comas (se convierte de array a string al inicializar)
- El campo roleIds muestra los roles seleccionados
- Se muestra un botón para guardar los cambios
- Se muestra un botón para cancelar y cerrar el diálogo
- Se muestra indicador de carga durante la asignación de roles

- Flujo funcional:
1. Al abrir el diálogo, se recibe data con user (usuario a editar) y selectedRoleIds (roles seleccionados)
2. Se inicializa el formulario con los datos del usuario
3. Los roles seleccionados se cargan en selectedRoleIdsSet (Set para manejo eficiente)
4. El campo extras se convierte de array a string separado por comas
5. El usuario modifica los campos del formulario
6. Al hacer clic en guardar, se construye el payload con los datos del formulario
7. El campo extras se convierte de string a array de números
8. Se cierra el diálogo retornando un objeto con userPatch y selectedRoleIds
9. El componente padre es responsable de llamar al servicio para actualizar el usuario
10. Al cancelar, se cierra el diálogo sin retornar valor
11. El método toggleRole permite agregar o quitar roles del Set
12. El método asignarRoles llama al servicio para asignar roles (aunque parece incompleto)

## 2. Mapa de código
- Ruta del diálogo:
src/app/shared/dialogs/editar-usuario-dialog/

- Clases involucradas:
```text
    src/app/shared/dialogs/editar-usuario-dialog/
        editar-usuario-dialog.ts
        editar-usuario-dialog.html
        editar-usuario-dialog.css

    src/app/core/services/
        user.service.ts

    src/app/core/model/
        emplado.model.ts
        assignrole-request.model.ts
```

## 3. API (Service)
| Metodo   |          Ruta                              | Uso                                                         |
|----------|--------------------------------------------|-------------------------------------------------------------|
| GET      | `/roles`                                   | Obtiene todos los roles (usado en asignarRoles)              |

## 4. Reglas de validación de negocio
1. **Campo id deshabilitado**: El campo id no se puede modificar.
2. **Conversión de extras**: El campo extras se convierte de array a string (separado por comas) al inicializar y de string a array de números al guardar.
3. **Payload**: Se envían los campos srl_emp, user, email, area, task, active, roles, principal y extras.
4. **Manejo de nulos**: Los campos tienen valores por defecto null si no se especifican.
5. **Sin llamada al servicio principal**: El diálogo no hace la llamada al servicio para actualizar el usuario; retorna el payload al componente padre.
6. **Cierre con payload**: Se cierra el diálogo retornando un objeto con userPatch y selectedRoleIds para que el componente padre lo procese.
7. **Cierre cancelación**: Si se cancela, se cierra el diálogo sin retornar valor.
8. **Set de roles**: selectedRoleIdsSet es un Set para manejo eficiente de roles seleccionados.
9. **Método toggleRole**: Permite agregar o quitar roles del Set según el estado del checkbox.
10. **Método asignarRoles**: Llama al servicio para asignar roles (aunque la implementación parece incompleta, solo carga roles y limpia selectedRoles).

## 5. Diagrama de clases
| Componente principal      | Servicios               | Modelos                 | Modelos de request       | Modelos de response       |
|---------------------------|-------------------------|-------------------------|--------------------------|---------------------------| 
| `UsuarioDialog`           | `UserService`           | `EmpleadoItem`          | `AssignRoleRequest`      | -                         |
|                           |                         |                         |                          |                          |

## 6. Métodos del componente UsuarioDialog

### 6.1 Métodos de ciclo de vida
| Método          | Descripción                                                                                                                                             |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ngOnInit()`    | Inicializa el componente: crea el formulario con los datos del usuario. Convierte extras de array a string. Inicializa selectedRoleIdsSet con los roles seleccionados. |

### 6.2 Métodos de envío de formulario
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `guardar()`           | Construye el payload con los datos del formulario. Convierte extras de string a array de números. Cierra el diálogo retornando userPatch y selectedRoleIds. |

### 6.3 Métodos de cierre
| Method                | Description                                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `cerrar()`            | Cierra el diálogo sin retornar valor (cancelación).                                                                                  |

### 6.4 Métodos de gestión de roles
| Method                        | Description                                                                                                                           |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `toggleRole(roleId, checked)` | Agrega o elimina un rol del Set selectedRoleIdsSet según el estado del checkbox.                                                      |
| `asignarRoles(userId, roleIds)` | Llama al servicio para asignar roles (implementación incompleta, solo carga roles y limpia selectedRoles).                            |

## 7. Prueba operativa mínima
1. Abrir el diálogo desde el módulo de gestión de usuarios con un usuario existente.
2. Verificar que el formulario se inicialice con los datos del usuario.
3. Verificar que el campo id esté deshabilitado.
4. Verificar que los roles seleccionados se carguen correctamente.
5. Verificar que el campo extras se muestre como string separado por comas.
6. Modificar campos y guardar.
7. Verificar que el diálogo se cierre y el componente padre reciba el payload.
8. Verificar que el campo extras se convierta correctamente de string a array de números.
9. Verificar que el componente padre llame al servicio para actualizar el usuario.
10. Probar toggleRole agregando y quitando roles.
11. Verificar que el botón de cancelar cierre el diálogo sin guardar cambios.
12. Probar modificar los checkboxes (active, deleted, isVerified, isPassword).

## 8. Criterios al modificar el diálogo
- Conservar `ApiResponse` en todos los services.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentación o logs compartidos.
- En caso de que se integren nuevas variables, revisar primero los modelos para ver si coincidan con lo que es el nuevo requerimiento.
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por qué el cambio y si no afecta en el demás flujo.
- Si se agregan campos al formulario, actualizar el FormGroup en ngOnInit y el payload en guardar.
- Preservar el comportamiento de retornar el payload al componente padre (no hacer llamadas al servicio desde el diálogo).
- El componente padre es responsable de llamar al servicio; mantener esta separación de responsabilidades.
- La conversión de extras de array a string y viceversa es crítica; mantener esta lógica si se modifican los campos de extras.
- El uso de Set para selectedRoleIdsSet es eficiente para manejo de roles; mantener esta estructura.
- El método asignarRoles parece incompleto; revisar si se requiere completar su implementación.
- El campo id debe permanecer deshabilitado para evitar modificaciones del identificador.
