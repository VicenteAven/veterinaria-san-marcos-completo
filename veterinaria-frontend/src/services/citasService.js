import { URLS, pedir } from './http'

const api = (ruta, opciones) => pedir(URLS.citas, ruta, opciones)

export const mascotas = {
  listar: (params) => api('/mascotas', { params }),
  crear: (cuerpo) => api('/mascotas', { method: 'POST', cuerpo }),
  actualizar: (id, cuerpo) => api(`/mascotas/${id}`, { method: 'PUT', cuerpo }),
  eliminar: (id) => api(`/mascotas/${id}`, { method: 'DELETE' }),
  historial: (id) => api(`/mascotas/${id}/historial`),
  registrarConsulta: (id, cuerpo) => api(`/mascotas/${id}/consultas`, { method: 'POST', cuerpo }),
  editarConsulta: (consultaId, cuerpo) => api(`/consultas/${consultaId}`, { method: 'PUT', cuerpo }),
  vacunasProximas: (dias = 30) => api('/vacunaciones/proximas', { params: { dias } }),
}

export const citas = {
  listar: (params) => api('/citas', { params }),
  disponibilidad: (fecha) => api('/citas/disponibilidad', { params: { fecha } }),
  crear: (cuerpo) => api('/citas', { method: 'POST', cuerpo }),
  confirmar: (id) => api(`/citas/${id}/confirmar`, { method: 'PATCH' }),
  reagendar: (id, cuerpo) => api(`/citas/${id}/reagendar`, { method: 'PATCH', cuerpo }),
  aceptarPropuesta: (id) => api(`/citas/${id}/aceptar-propuesta`, { method: 'PATCH' }),
  cancelar: (id, motivo) => api(`/citas/${id}/cancelar`, { method: 'PATCH', cuerpo: motivo ? { motivo } : {} }),
  completar: (id) => api(`/citas/${id}/completar`, { method: 'PATCH' }),
}

export const reportes = {
  atenciones: (desde, hasta) => api('/reportes/atenciones', { params: { desde, hasta } }),
}
