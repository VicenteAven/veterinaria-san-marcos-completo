# Veterinaria San Marcos (Rancagua) — DSY1104

Sistema web con **React + Vite** (frontend), **3 microservicios Spring Boot** y **MySQL de XAMPP**. No usa Docker.

```
veterinaria-san-marcos-completo/
├── auth/                          Microservicio de autenticación y usuarios   (puerto 8082)
├── veterinaria-catalogo-backend/  Servicios y medicamentos/vacunas            (puerto 8083)
├── veterinaria-citas-backend/     Mascotas, citas, consultas y reportes       (puerto 8084)
└── veterinaria-frontend/          React + Vite                                (puerto 5173)
```

Cada backend sigue la misma organización: `model`, `repository`, `service`, `controller`, `dto`, `config`, `security` y `exception`, en el paquete `cl.duoc.<servicio>`.

## Requisitos

- XAMPP (solo el módulo **MySQL**; Apache no es necesario)
- JDK 17 o superior
- Node.js 20 o superior

## Cómo ejecutarlo

1. **Base de datos:** abre el panel de XAMPP y pulsa *Start* en **MySQL**. Usuario `root` sin contraseña (lo normal en XAMPP). No tienes que crear nada: al iniciar, cada servicio crea su base (`veterinaria_auth`, `veterinaria_catalogo`, `veterinaria_citas`), sus tablas y los datos iniciales.
2. **Backends**, uno por terminal, **en este orden** (auth primero porque crea los usuarios):

   ```bash
   cd auth                          && ./mvnw spring-boot:run     # Windows: mvnw.cmd spring-boot:run
   cd veterinaria-catalogo-backend  && ./mvnw spring-boot:run
   cd veterinaria-citas-backend     && ./mvnw spring-boot:run
   ```
3. **Frontend:**

   ```bash
   cd veterinaria-frontend
   npm install
   npm run dev
   ```
   Abre http://localhost:5173

## Usuarios de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| ADMIN | admin@sanmarcos.cl | Admin#2026 |
| RECEPCIONISTA | recepcion@sanmarcos.cl | Recepcion#2026 |
| DUENO | dueno@correo.cl | Dueno#2026 |

El dueño de prueba ya tiene dos mascotas (Luna y Michi), una consulta con vacunas por vencer y dos citas.

## Swagger

- Auth: http://localhost:8082/swagger-ui.html
- Catálogo: http://localhost:8083/swagger-ui.html
- Citas: http://localhost:8084/swagger-ui.html

Para probar en Swagger: haz login en `/api/v1/auth/login`, copia el `token` y pulsa *Authorize*.

## Roles y seguridad

Spring Security con JWT sin sesión (el mismo secreto en los tres servicios). Todo exige token salvo `login` y `register`.

- **ADMIN**: todo, incluido el catálogo y los usuarios.
- **RECEPCIONISTA**: confirma o reprograma citas, registra consultas y vacunas, ajusta stock, ve reportes.
- **DUENO**: solo ve y gestiona sus mascotas, sus citas y su historial.

## Endpoints (`/api/v1`)

- **Auth (8082):** `POST /auth/register`, `POST /auth/login`, `GET /auth/me`; `GET/POST /usuarios`, `GET/PUT /usuarios/{id}`, `PATCH /usuarios/{id}/estado`, `GET /usuarios/duenos`, `GET /roles`
- **Catálogo (8083):** `/servicios` y `/medicamentos` (CRUD; `PATCH /medicamentos/{id}/stock`), `/categorias`, `/especies`
- **Citas (8084):** `/mascotas` (CRUD), `/mascotas/{id}/historial`, `POST /mascotas/{id}/consultas`, `PUT /consultas/{id}`, `/citas`, `/citas/disponibilidad`, `PATCH /citas/{id}/{confirmar|reagendar|aceptar-propuesta|cancelar|completar}`, `GET /vacunaciones/proximas`, `GET /reportes/atenciones`

## Reglas de la agenda

Lunes a sábado, 09:00 a 17:30, bloques de 30 minutos, hasta 90 días hacia adelante, 3 citas confirmadas por bloque. Flujo: SOLICITADA → CONFIRMADA o REPROGRAMADA → (el dueño acepta) CONFIRMADA → COMPLETADA.

## Pruebas (sin Jasmine ni Karma)

- Frontend: `npm test` (Vitest + Testing Library, 45 pruebas), `npm run coverage` y `npm run lint`
- Backend: `./mvnw test` en cada servicio (JUnit 5 + Mockito)

## Frontend

15 componentes, Bootstrap 5, Leaflet para el mapa. Más de 40 reglas de validación centralizadas en `src/utils/validators.js` (una prueba exige al menos 30 en uso). Las URLs de los servicios están en `.env.development`. Los datos de la clínica (dirección, coordenadas, horario) están en `src/data/clinica.js`.

## Problemas comunes

- **No conecta a la base:** MySQL de XAMPP debe estar iniciado. Si tu `root` tiene contraseña, define antes de arrancar `AUTH_DB_PASSWORD`, `CATALOGO_DB_PASSWORD` y `CITAS_DB_PASSWORD`.
- **Puerto ocupado:** cambia el puerto con la variable `SERVER_PORT` (y la URL en `veterinaria-frontend/.env.development`).
- **Empezar de cero:** borra las tres bases `veterinaria_*` en phpMyAdmin y vuelve a iniciar los servicios.
- **El frontend dice "No hay conexión con el servidor":** revisa que los tres backends estén corriendo.
