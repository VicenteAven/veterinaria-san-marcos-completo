import { URLS, pedir } from './http'

const api = (ruta, opciones) => pedir(URLS.catalogo, ruta, opciones)

export const catalogo = {
  categorias: (tipo) => api('/categorias', { params: { tipo } }),
  especies: () => api('/especies'),
  servicios: (params) => api('/servicios', { params }),
  crearServicio: (cuerpo) => api('/servicios', { method: 'POST', cuerpo }),
  actualizarServicio: (id, cuerpo) => api(`/servicios/${id}`, { method: 'PUT', cuerpo }),
  desactivarServicio: (id) => api(`/servicios/${id}`, { method: 'DELETE' }),
  medicamentos: (params) => api('/medicamentos', { params }),
  crearMedicamento: (cuerpo) => api('/medicamentos', { method: 'POST', cuerpo }),
  actualizarMedicamento: (id, cuerpo) => api(`/medicamentos/${id}`, { method: 'PUT', cuerpo }),
  ajustarStock: (id, stock) => api(`/medicamentos/${id}/stock`, { method: 'PATCH', cuerpo: { stock } }),
  desactivarMedicamento: (id) => api(`/medicamentos/${id}`, { method: 'DELETE' }),
}
