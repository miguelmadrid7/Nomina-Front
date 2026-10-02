# Nomina - Generar entregables

- Nombre del modulo(Vista):
- Generar entregables de nóminas

## 1. Objetivo y alcance

## 2. Mapa de codigo
- Ruta del modulo:
```text
```

## 3. API(Service)
| Metodo   |          Ruta                              | Uso                                                         |
|----------|--------------------------------------------|-------------------------------------------------------------|
| GET      | `/calendario/activa`                       | Muestra la qna activa, esto se controla en el               |

## 4. Regla de validacion de negocio

## 5. Prueba operativa minima

## 6. Criterios al modificar el modulo
- Conservar `ApiResponse` en todos los services.
- No exponer registros de muestra, RFC, CURP, tokens ni credenciales en documentacion o logs compartidos.
- En caso de que se integren nuevas varibales, revisar primero los modelos para ver si coincidan con lo que es el nuevo requerimiento
- Cada cambio debe de estar documentado, y justificado en el commit, ser muy detallado del por que el cambio y si no afecta en el demas flujo