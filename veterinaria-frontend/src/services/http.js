/**
 * Utilidades comunes de los servicios: llamada fetch con token JWT, manejo de errores y sesión.
 * Cada microservicio tiene su propia URL base (ver .env.development).
 */
const TOKEN_KEY = 'vet_token'
const TIEMPO_MAXIMO_MS = 12000

export const URLS = {
  auth: import.meta.env.VITE_AUTH_API_URL,
  catalogo: import.meta.env.VITE_CATALOGO_API_URL,
  citas: import.meta.env.VITE_CITAS_API_URL,
}

export const sesion = {
  token() {
    try {
      return sessionStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  guardar(token) {
    try {
      sessionStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* sin almacenamiento: la sesión dura solo mientras la pestaña esté abierta */
    }
  },
  borrar() {
    try {
      sessionStorage.removeItem(TOKEN_KEY)
    } catch {
      /* nada que borrar */
    }
  },
}

export class ErrorHttp extends Error {
  constructor(status, datos, tiempoAgotado = false) {
    super(datos?.message || `Solicitud rechazada: ${status}`)
    this.status = status
    this.datos = datos || {}
    this.tiempoAgotado = tiempoAgotado
  }
}

function armarUrl(base, ruta, params) {
  const consulta = new URLSearchParams()
  Object.entries(params || {}).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') consulta.append(clave, valor)
  })
  const texto = consulta.toString()
  return `${base}${ruta}${texto ? `?${texto}` : ''}`
}

/** Llama a un microservicio. Devuelve el JSON de la respuesta (o null si es 204). */
export async function pedir(base, ruta, { method = 'GET', cuerpo, params } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = sesion.token()
  if (token) headers.Authorization = `Bearer ${token}`

  const control = new AbortController()
  const temporizador = setTimeout(() => control.abort(), TIEMPO_MAXIMO_MS)
  let respuesta
  try {
    respuesta = await fetch(armarUrl(base, ruta, params), {
      method,
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: control.signal,
    })
  } catch (error) {
    throw new ErrorHttp(0, null, error?.name === 'AbortError')
  } finally {
    clearTimeout(temporizador)
  }

  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => ({}))
    const esAcceso = ruta.startsWith('/auth/login') || ruta.startsWith('/auth/register')
    if (respuesta.status === 401 && !esAcceso) {
      sesion.borrar()
      window.dispatchEvent(new Event('vet:sesion-expirada'))
    }
    throw new ErrorHttp(respuesta.status, datos)
  }
  return respuesta.status === 204 ? null : respuesta.json()
}

/** Convierte cualquier error en { mensaje, campos } listo para mostrar al usuario. */
export function leerError(error) {
  if (error?.tiempoAgotado) return { mensaje: 'El servidor tardó demasiado en responder. Intenta nuevamente.', campos: {} }
  if (!error?.status) return { mensaje: 'No hay conexión con el servidor. Revisa que los servicios estén encendidos e intenta de nuevo.', campos: {} }
  return { mensaje: error.datos?.message || 'No se pudo completar la operación.', campos: error.datos?.errores || {} }
}
