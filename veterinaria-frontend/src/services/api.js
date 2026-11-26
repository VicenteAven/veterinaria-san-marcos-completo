/** Punto único de importación de los servicios (las pantallas importan desde aquí). */
export { sesion, leerError } from './http'
export { auth, usuarios } from './authService'
export { catalogo } from './catalogoService'
export { mascotas, citas, reportes } from './citasService'
