import { parseFecha } from './validators'

export const ESPECIES = ['Perro', 'Gato', 'Conejo', 'Ave']

export const ROLES = {
  ADMIN: 'Administrador',
  RECEPCIONISTA: 'Recepcionista',
  DUENO: 'Dueño de mascota',
}

export const ESTADOS_CITA = {
  SOLICITADA: { texto: 'Por confirmar', tono: 'warning' },
  CONFIRMADA: { texto: 'Confirmada', tono: 'success' },
  REPROGRAMADA: { texto: 'Nuevo horario propuesto', tono: 'info' },
  CANCELADA: { texto: 'Cancelada', tono: 'secondary' },
  COMPLETADA: { texto: 'Atendida', tono: 'primary' },
}

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
export const pesos = (n) => clp.format(Number(n) || 0)

/** Acepta 'YYYY-MM-DD' o 'YYYY-MM-DDTHH:mm[:ss]' (hora local, sin zona). */
export function aFecha(s) {
  if (!s) return null
  return s.length > 10 ? new Date(s) : parseFecha(s)
}

export function fechaLarga(s) {
  const f = aFecha(s)
  return f ? f.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''
}

export function fechaCorta(s) {
  const f = aFecha(s)
  return f ? f.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '') : ''
}

export function horaDe(s) {
  const f = aFecha(s)
  return f ? f.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''
}

export function fechaHora(s) {
  return s ? `${fechaCorta(s)}, ${horaDe(s)}` : ''
}

/** 'YYYY-MM-DD' de hoy + n días, en hora local. */
export function isoFecha(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}
export function hoyMas(dias = 0) {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return isoFecha(d)
}

export function duracion(min) {
  if (min >= 60 && min % 60 === 0) return `${min / 60} h`
  return `${min} min`
}

export function edad(fechaNacimiento) {
  const n = parseFecha(fechaNacimiento)
  if (!n) return ''
  const hoy = new Date()
  let meses = (hoy.getFullYear() - n.getFullYear()) * 12 + (hoy.getMonth() - n.getMonth())
  if (hoy.getDate() < n.getDate()) meses -= 1
  if (meses < 1) return 'menos de 1 mes'
  if (meses < 24) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`
  const años = Math.floor(meses / 12)
  return `${años} años`
}

export const iniciales = (nombre = '') =>
  nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('')

/** Inicio de la semana de la ficha: cuántos días faltan para una fecha (negativo = ya pasó). */
export function diasHasta(s) {
  const f = aFecha(s)
  if (!f) return null
  const hoy = new Date()
  const base = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  return Math.round((new Date(f.getFullYear(), f.getMonth(), f.getDate()) - base) / 86400000)
}
