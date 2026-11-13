# Nomina-SEPH — Frontend

Sistema de gestión de nómina para la Secretaría de Educación Pública de Hidalgo (SEPH).

---

## Stack tecnológico
| Capa         | Tecnología     | Versión |
|--------------|----------------|---------|
| Framework    | Angular        | 20.2.0  |
| Lenguaje     | TypeScript     |         |
| Herramientas | Npm            | 10.9.3  |
|              | Node.js        | 22.19.0 |
|              | Angular CLI    | 20.2.0  |
|              | Bootstrap      | 5.3.8   |
|              | ApexCharts     | 5.16.0  |
|              | RxJS           | 7.8.0   |
|              | SockJS-client  | 1.6.1   |
|              | StompJS        | 2.3.3   |
|              | Zone.js        | 0.15.1  |
|              | Xlsx           | 0.18.5  |

---

## Módulos del sistema
| Módulo                            | Descripción                                                    |
|-----------------------------------|-----------------------------------------------------------     |
| Login                             | Muestra logs a nivel de consola del back                       |
| Auditación                        | Muestra logs a nivel de consola del back                       |
| Catálogos                         | Tablas de referencia (sexo, bancos, CCT, etc.)                 |
| Core                              | Usuarios, roles, módulos y permisos, notificaciones            | 
| Home                              | Dashboard                                                      |
| Nómina                            | Módulo de todos los procesos de nómina y exportación de anexos |
| Juicios mercantiles               | Módulo de todos los procesos de juicios                        |
| Pensión alimenticia (Beneficiarios) | Módulo de datos generales y pensión alimenticia              |
| Terceros                          | Módulo de todos los procesos de terceros                       |
| Empleados                         | Alta, baja y modificación de trabajadores                      |
| Plazas                            | Gestión de plazas y analítico FONE                             |
| Inasistencias                     | Registro de incidencias y faltas                               |
| FUP                               | Conceptos por plaza                     


## Endpoints principales del sistema clasificados por módulo

### Login
**Controller Back:** `UserController` · **Service front:** `LoginService`
| Método | Controller back    | Service front | Función                                             |
|--------|--------------------|---------------|-----------------------------------------------------|
| POST   | `/users/getToken`  | `/login`      | Obtener token de sesión por medio de credenciales.  |

### Home
_Pendiente de documentar._

### Auditación — `/logs`
**Controller Back:** `LogController` . **Service front:** `LogService`
| Método | Controller back               | Service front                    | Función                                              |
|--------|-------------------------------|----------------------------------|------------------------------------------------------|
| GET    | `/logs/fechas`                | `/logs/fechas`                   | Obtiene la lista de fechas con logs disponibles.     |
| GET    | `/logs/{fecha}/application`   | `/logs/${fecha}/application`     | Retorna el contenido completo del log de aplicación. |
| GET    | `/logs/{fecha}/error`         | `/logs/${fecha}/error`           | Retorna el contenido completo del log de errores.    |
| GET    | `/logs/{fecha}/login`         | `/logs/${fecha}/login`           | Retorna el contenido completo del log de login.      |
| GET    | `/logs/{fecha}/{tipo}/tail`   | `/logs/${fecha}/${tipo}/tail`    | Retorna las últimas N líneas de un log específico.   |
| GET    | `/logs/{fecha}/{tipo}/search` | `/logs/${fecha}/${tipo}/search`  | Busca líneas que contengan un texto específico.      |

### Core module — `/modules`
**Controller Back:** `ModuleController` · **Service front:** `ModuleService`
| Método | Controller back         | Service front           | Función                                |
|--------|-------------------------|-------------------------|----------------------------------------|
| GET    | `/modules`              | `/modules`              | Obtener todos los módulos.             |
| GET    | `/modules/module`       | `/modules/module`       | Obtener un módulo.                     |
| POST   | `/modules`              | `/modules`              | Agregar un nuevo módulo y sus roles.   |
| PATCH  | `/modules`              | `/modules`              | Actualizar un módulo y sus roles.      |
| PATCH  | `/modules/softdeleted`  | `/modules/softdeleted`  | Eliminación de un módulo.              |

### Core notifications — `/notifications`
**Controller Back:** `NotificationsController` · **Service front:** `IconService`
| Método | Controller back          | Service front           | Función                                                 |
|--------|--------------------------|-------------------------|---------------------------------------------------------|
| GET    | `/notifications`         | -                       | Obtiene todas las notificaciones de un usuario.         |
| POST   | `/notifications`         | -                       | Asignar suscripciones de notificaciones a un usuario.   |
| PATCH  | `/notifications/status`  | -                       | Actualización de estatus de una notificación.           |
| POST   | `/notifications/icons`   | `/notifications/icons`  | Agrega un nuevo ícono.                                  |
| GET    | `/notifications/icons`   | `/notifications/icons`  | Lista los íconos activos para selectores del frontend.  |

### Core role — `/roles`
**Controller Back:** `RoleController` · **Service front:** `RolService`
| Método | Controller back         | Service front         | Función                                  |
|--------|-------------------------|-----------------------|------------------------------------------|
| GET    | `/roles`                | `/roles`              | Obtener todos los roles.                 |
| GET    | `/roles/role`           | `/roles/role`         | Obtener un rol.                          |
| GET    | `/roles/permisos`       | -                     | Obtener todos los permisos.              |
| GET    | `/roles/permisosById`   | -                     | Obtener un permiso.                      |
| GET    | `/roles/conceptos`      | `/roles/conceptos`    | Obtener conceptos permitidos por rol.    |
| POST   | `/roles`                | `/roles`              | Agregar un nuevo rol.                    |
| PATCH  | `/roles`                | `/roles`              | Actualización de un rol y sus módulos.   |
| PATCH  | `/roles/softdeleted`    | `/roles/softdeleted`  | Elimina un rol.                          |

### Core user — `/users`
**Controller Back:** `UserController` · **Services front:** `UserService`, `LoginService`
| Método | Controller back                    | Service front          | Función                                                |
|--------|------------------------------------|------------------------|--------------------------------------------------------|
| POST   | `/users/getToken`                  | `/login`               | Obtener token de sesión por medio de credenciales.     |
| GET    | `/users`                           | `/users`               | Obtener todos los usuarios.                            |
| GET    | `/users/user`                      | `/users/user`          | Obtiene a un usuario.                                  |
| GET    | `/roles`                           | `/roles`               | Obtiene todos los roles.                               |
| GET    | `/users/rolesByUser`               | `/users/rolesByUser`   | Obtiene los roles del usuario.                         |
| POST   | `/users`                           | `/users`               | Crear un nuevo usuario.                                |
| POST   | `/users/rolesByUser`               | `/users/rolesByUser`   | Asigna roles por usuario.                              |
| PATCH  | `/users/softdeleted`               | `/users/softdeleted`   | Eliminación de un usuario.                             |
| PATCH  | `/users`                           | `/users`               | Actualización de usuario.                              |
| POST   | `/users/moduleByUser`              | -                      | Obtiene los módulos del usuario.                       |
| POST   | `/users/validateToken`             | -                      | Validación de token enviado por correo.                |
| POST   | `/users/changePassword`            | -                      | Cambio de contraseña del usuario.                      |
| POST   | `/users/sendChangePassword`        | -                      | Envía el correo con la liga de cambio de contraseña.   |
| GET    | `/users/validatePasswordRecovery`  | -                      | Valida si la liga sigue activa.                        |
| POST   | `/users/changePasswordRecovery`    | -                      | Cambio de contraseña por medio de la liga.             |

### Core calendario — `/calendario`
**Controller Back:** `GestionCalendarioController` · **Service front:** `CalendarioService`
| Método | Controller back                 | Service front                   | Función                                          |
|--------|---------------------------------|---------------------------------|--------------------------------------------------|
| GET    | `/calendario`                   | `/calendario`                   | Obtener calendario de nómina por ejercicio.      |
| GET    | `/calendario/activa`            | `/calendario/activa`            | Obtener quincena activa.                         |
| GET    | `/calendario/{id}`              | `/calendario/{id}`              | Obtener calendario por ID.                       |
| GET    | `/calendario/conceptos-extra`   | `/calendario/conceptos-extra`   | Obtener quincena activa y sus conceptos extra.   |
| POST   | `/calendario`                   | `/calendario`                   | Dar de alta un nuevo calendario.                 |
| PUT    | `/calendario/{id}`              | `/calendario/{id}`              | Actualizar el estado del calendario.             |

### Core salario mínimo — `/salario-minimo`
**Controller Back:** `NomSalarioMinimoController` · **Service front:** `CoreSalarioMinimiService`
| Método | Controller back          | Service front                   | Función                                |
|--------|--------------------------|---------------------------------|----------------------------------------|
| GET    | `/salario-minimo`        | `/calendario`                   | Muestra todos los registros.           |
| POST   | `/salario-minimo`        | `/calendario/activa`            | Guarda un nuevo registro.              |
| PATCH  | `/salario-minimo/{id}`   | `/calendario/{id}`              | Actualiza un registro.                 |
| DELETE | `/salario-minimo/{id}`   | `/calendario/conceptos-extra`   | Elimina un registro (soft delete).     |

### Nómina — `/calculation`
**Controller:** `CalculationController` · **Service front:** `NominaOrdinariaService`
| Método | Controller back                               | Service front                    | Función                                                                       |
|--------|-----------------------------------------------|----------------------------------|-------------------------------------------------------------------------------|
| GET    | `/calculation/nomina-cheque/liquido/{rfc}`    | -                                | Obtiene líquido (sin pensión 62) y concepto 07 por plaza, buscando por RFC.   |
| GET    | `/calculation/nomina-cheque`                  | `/calculation/nomina-cheque`     | Obtiene conceptos de nómina cheque.                                           |
| POST   | `/calculation/execute`                        | `/calculation/execute`           | Ejecuta el proceso de cálculo de nómina.                                      |
| GET    | `/calculation/status/{id}`                    | `/calculation/status/${id}`      | Obtiene el estatus de un job por ID.                                          |
| POST   | `/calculation/export-anexo-v`                 | `/calculation/export-anexo-v`    | Exporta conceptos en CSV (Anexo V).                                           |
| POST   | `/calculation/export-anexo-VI`                | `/calculation/export-anexo-VI`   | Exporta cheques en CSV (Anexo VI).                                            |

### Juicios mercantiles — `/beneficiarios/jm`
**Controller Back:** `BeneficiariosJMController` · **Service front:** `JuiciosMercantilesService`
| Método | Controller back                                       | Service front                                         | Función                                                                    |
|--------|-------------------------------------------------------|-------------------------------------------------------|----------------------------------------------------------------------------|
| GET    | `/catalogo/bancos`                                    | `/catalogo/bancos`                                    | Obtiene la lista de los bancos por medio de la clave.                      |
| GET    | `/beneficiarios/jm/tab`                               | `/beneficiarios/jm/tab`                               | Lista todos los registros de TAB.                                          |
| GET    | `/beneficiarios/jm/tabla`                             | `/beneficiarios/jm/tabla`                             | Vista plana para la tabla del frontend con datos del empleado embebidos.   |
| POST   | `/beneficiarios/jm`                                   | `/beneficiarios/jm`                                   | Crea un registro en NOM (tabla de beneficiarios JM).                       |
| POST   | `/beneficiarios/jm/{id}`                              | `/beneficiarios/jm/{id}`                              | Actualiza un registro en NOM.                                              |
| GET    | `/beneficiarios/jm/empleado/{empleadoId}/historico`   | `/beneficiarios/jm/empleado/{empleadoId}/historico`   | Vista de histórico (vigentes, cancelados y finalizados).                   |
| POST   | `/beneficiarios/jm/tab/{id}`                          | `/beneficiarios/jm/tab/{id}`                          | Actualiza un registro en TAB.                                              |
| GET    | `/beneficiarios/jm/reporte-pagos`                     | `/beneficiarios/jm/reporte-pagos`                     | Descarga el XLSX de lo aplicado en una quincena de juicio mercantil.       |

### Pensión alimenticia — `/beneficiarios`
**Controller Back:** `BeneficiariosController` · **Service front:** `PensionAlimenticiaService`
| Método | Controller back                                       | Service front                                         | Función                                                                  |
|--------|-------------------------------------------------------|-------------------------------------------------------|--------------------------------------------------------------------------|
| GET    | `/employee/by/${target}`                              | `/employee/by/${target}`                              | Busca por RFC, CURP o nombre.                                            |
| GET    | `/employee/by/${encodeURIComponent(search)}/search`   | `/employee/by/${encodeURIComponent(search)}/search`   | Búsqueda libre.                                                          |
| GET    | `/catalogo/bancos`                                    | `/catalogo/bancos`                                    | Obtiene la lista de los bancos por medio de la clave.                    |
| POST   | `/beneficiarios/alim`                                 | `/beneficiarios/alim`                                 | Crear beneficiario alimenticio.                                          |
| POST   | `/beneficiarios`                                      | `/beneficiarios`                                      | Crear beneficiario.                                                      |
| GET    | `/beneficiarios`                                      | `/beneficiarios`                                      | Listar todos.                                                            |
| GET    | `/beneficiarios/${id}`                                | `/beneficiarios/${id}`                                | Obtener por ID.                                                          |
| GET    | `/beneficiarios/empleado/${empleadoId}`               | `/beneficiarios/empleado/${empleadoId}`               | Obtener por empleado por medio del ID.                                   |
| GET    | `/calculation/nomina-cheque/liquido/${rfc}`           | `/calculation/nomina-cheque/liquido/${rfc}`           | Obtiene el líquido del empleado para validar si le alcanza para sus pensiones. |
| GET    | `/beneficiarios/empleado/${empleadoId}/historico`     | `/beneficiarios/empleado/${empleadoId}/historico`     | Histórico de los beneficiarios que tiene el empleado por ID.             |
| PATCH  | `/beneficiarios/${id}`                                | `/beneficiarios/${id}`                                | Actualizar beneficiario por ID.                                          |
| PATCH  | `/beneficiarios/alim/${id}`                           | `/beneficiarios/alim/${id}`                           | Actualizar beneficiario alimenticio.                                     |
| DELETE | `/beneficiarios/alim/${id}`                           | `/beneficiarios/alim/${id}`                           | Eliminar beneficiario alimenticio.                                       |
| DELETE | `/beneficiarios/${id}`                                | `/beneficiarios/${id}`                                | Eliminar beneficiario (soft delete).                                     |
| GET    | `/beneficiarios/reporte-pagos`                        | `/beneficiarios/reporte-pagos`                        | Descarga de reportes después de haber pasado todo el proceso.            |

### Terceros — `/nom-emp-pza-cpto`, `/terceros`
**Controller Back:** `NomEmpPzaCptoController` · **Service front:** `TerceroService`
| Método | Controller back                                       | Service front                                         | Función                                                     |
|--------|-------------------------------------------------------|-------------------------------------------------------|-------------------------------------------------------------|
| GET    | `/employee/by/${encodeURIComponent(search)}/search`   | `/employee/by/${encodeURIComponent(search)}/search`   | Búsqueda libre.                                             |
| POST   | `/nom-emp-pza-cpto/registro-np`                       | `/nom-emp-pza-cpto/registro-np`                       | Registra un concepto en tabla temporal.                     |
| GET    | `/nom-emp-pza-cpto/conceptos`                         | `/nom-emp-pza-cpto/conceptos`                         | Obtiene los conceptos.                                      |
| GET    | `/nom-emp-pza-cpto/registros-np`                      | `/nom-emp-pza-cpto/registros-np`                      | Consulta registros NP en tabla temporal.                    |
| GET    | `/nom-emp-pza-cpto/conteo-por-concepto`               | `/nom-emp-pza-cpto/conteo-por-concepto`               | Obtiene conteo de registros NP agrupado por concepto.       |
| PUT    | `/nom-emp-pza-cpto/registro-np/{id}`                  | `/nom-emp-pza-cpto/registro-np/${id}`                 | Edita un registro temporal.                                 |
| GET    | `/nom-emp-pza-cpto/importe-mensual-real`              | `/nom-emp-pza-cpto/importe-mensual-real`              | Obtiene importe mensual desde `nom_emp_pza_cpto`.           |
| GET    | `/nom-emp-pza-cpto/registros-np/excel`                | `/nom-emp-pza-cpto/registros-np/excel`                | Exporta registros NP en Excel.                              |
| GET    | `/nom-emp-pza-cpto/registros-np/pdf`                  | `/nom-emp-pza-cpto/registros-np/pdf`                  | Exporta registros NP en PDF.                                |
| GET    | `/nom-emp-pza-cpto`                                   | `/nom-emp-pza-cpto`                                   | Muestra calendario de recepción.                            |
| GET    | `/nom-emp-pza-cpto/{qnaRecepcion}`                    | `/nom-emp-pza-cpto/{qnaRecepcion}`                    | Muestra quincena de recepción.                              |
| GET    | `/nom-emp-pza-cpto/upload`                            | `/nom-emp-pza-cpto/upload`                            | Sube un documento PDF asociado a un tercero.                |
| GET    | `/nom-emp-pza-cpto/download/{id}`                     | `/nom-emp-pza-cpto/download/{id}`                     | Descarga un documento PDF por ID.                           |

**Controller Back:** `TercerosController` · **Service front:** `TerceroService`
| Método | Controller back                   | Service front                     | Función                                                        |
|--------|-----------------------------------|-----------------------------------|----------------------------------------------------------------|
| POST   | `/terceros/cargar-txt`            | `/terceros/cargar-txt`            | Carga un TXT de ancho fijo y valida el lote.                   |
| POST   | `/terceros/validar`               | `/terceros/validar`               | Revalida el lote completo.                                     |
| POST   | `/terceros/personalizar`          | -                                 | Agrega manualmente un movimiento al lote.                      |
| PUT    | `/terceros/personalizar/{id}`     | `/terceros/personalizar/{id}`     | Edita un movimiento temporal y revalida el lote.               |
| DELETE | `/terceros/personalizar/{id}`     | `/terceros/personalizar/{id}`     | Elimina un registro temporal.                                  |
| POST   | `/terceros/procesar`              | `/terceros/procesar`              | Aplica altas, bajas y modificaciones y genera el snapshot.     |
| GET    | `/terceros/lotes`                 | `/terceros/lotes`                 | Lista los lotes pendientes.                                    |
| POST   | `/terceros/borrar-lote`           | `/terceros/borrar-lote`           | Elimina el lote por quincena y concepto.                       |
| GET    | `/terceros/historico`             | `/terceros/historico`             | Consulta snapshots procesados.                                 |
| GET    | `/terceros/descargar-reporte`     | `/terceros/descargar-reporte`     | Descarga Excel de movimientos de terceros procesados.          |

### Empleados — `/employee`
**Controller Back:** `EmpleadoController` · **Service front:** `EmployeeService`
| Método | Controller back                  | Service front                    | Función                                                   |
|--------|----------------------------------|----------------------------------|-----------------------------------------------------------|
| GET    | `/employee/by/{target}`          | `/employee/by/{target}`          | Buscar por RFC, CURP o nombre (header: `targetValue`).    |
| GET    | `/employee/by/{search}/search`   | `/employee/by/{search}/search`   | Búsqueda general.                                         |

### Catálogos — `/catalogo`
**Controller Back:** `CatalogoController` · **Service front:** `CatalogoService`
| Método | Controller back      | Service front        | Función                                          |
|--------|----------------------|----------------------|--------------------------------------------------|
| GET    | `/catalogo/bancos`   | `/catalogo/bancos`   | Obtener el catálogo de los bancos por su ID.     |

### Plazas

_Pendiente de documentar._

### Inasistencias

_Pendiente de documentar._

### FUP

_Pendiente de documentar._

---

## Estructura del proyecto

```text
├── docs/                           # Documentación del proyecto: archivos .md de cada módulo
├── node_modules/                   # Librerías instaladas por npm (no se edita ni se sube a Git)
├── public/                         # Archivos estáticos que se copian tal cual al build (favicon, íconos)
├── src/                            # Todo el código fuente de la aplicación
│   ├── app/                        # Corazón de la app: componentes, servicios, rutas y lógica
│   │   ├── core/                   # Lo que existe UNA sola vez en toda la app (singleton)
│   │   │   ├── guards/             # Protegen rutas (ej. solo entrar si el usuario está logueado)
│   │   │   ├── interceptors/       # Interceptan peticiones HTTP (ej. agregar token, manejar errores)
│   │   │   ├── model/              # Interfaces y tipos de datos (estructura de usuarios, respuestas, etc.)
│   │   │   └── services/           # Servicios globales (auth, conexión a la API, etc.)
│   │   ├── features/               # Módulos/pantallas de negocio, uno por funcionalidad (ej. usuarios, reportes)
│   │   ├── layout/                 # Estructura visual fija: header, sidebar, footer
│   │   ├── shared/                 # Piezas reutilizables en varios lugares (botones, pipes, directivas)
│   │   ├── app.config.server.ts    # Configuración extra cuando la app se renderiza en el servidor (SSR)
│   │   ├── app.config.ts           # Configuración global: router, HttpClient, interceptors, providers
│   │   ├── app.css                 # Estilos del componente raíz
│   │   ├── app.html                # Plantilla HTML del componente raíz (normalmente contiene <router-outlet>)
│   │   ├── app.routes.server.ts    # Define cómo se renderiza cada ruta en el servidor (SSR)
│   │   ├── app.routes.ts           # Define qué componente se muestra según la URL
│   │   ├── app.spec.ts             # Pruebas unitarias del componente raíz
│   │   └── app.ts                  # Componente raíz: de él cuelgan todos los demás
│   ├── assets/                     # Recursos estáticos usados dentro del código
│   │   ├── icons/                  # Íconos del proyecto
│   │   └── img/                    # Imágenes del proyecto
│   ├── environments/               # Variables según el entorno (URL de la API, flags, etc.)
│   │   ├── environments.ts         # Entorno por defecto (desarrollo)
│   │   ├── environments.stage.ts   # Entorno de pruebas / staging
│   │   ├── environments.prod.ts    # Entorno de producción
│   │   └── environments.local.ts   # Entorno local de tu máquina
│   ├── custom-theme.scss           # Tema personalizado (colores y tipografía, ej. de Angular Material)
│   ├── index.html                  # Única página HTML real; Angular inyecta la app en <app-root>
│   ├── main.server.ts              # Punto de arranque de la app en el servidor (SSR)
│   ├── main.ts                     # Punto de arranque de la app en el navegador
│   ├── polyfills.ts                # Compatibilidad con navegadores que no soportan funciones modernas
│   ├── server.ts                   # Servidor Node/Express que sirve la app con SSR
│   └── styles.css                  # Estilos globales para toda la aplicación
├── .gitignore                      # Archivos y carpetas que Git debe ignorar (ej. node_modules)
├── angular.json                    # Configuración del proyecto Angular: build, entornos, assets, estilos
└── package.json                    # Lista de dependencias y scripts del proyecto (npm start, npm run build)
```
