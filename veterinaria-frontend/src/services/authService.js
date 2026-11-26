import { URLS, pedir } from './http'

const api = (ruta, opciones) => pedir(URLS.auth, ruta, opciones)

export const auth = {
  login: (email, password) => api('/auth/login', { method: 'POST', cuerpo: { email, password } }),
  registrar: (cuerpo) => api('/auth/register', { method: 'POST', cuerpo }),
  yo: () => api('/auth/me'),
}

export const usuarios = {
  listar: () => api('/usuarios'),
  duenos: () => api('/usuarios/duenos'),
  crear: (cuerpo) => api('/usuarios', { method: 'POST', cuerpo }),
  actualizar: (id, cuerpo) => api(`/usuarios/${id}`, { method: 'PUT', cuerpo }),
  cambiarEstado: (id, activo) => api(`/usuarios/${id}/estado`, { method: 'PATCH', cuerpo: { activo } }),
  roles: () => api('/roles'),
}
