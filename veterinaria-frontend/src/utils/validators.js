/**
 * Catálogo de validaciones del frontend.
 * Cada regla recibe (valor, valoresDelFormulario, contexto) y devuelve '' si es válida o el mensaje de error.
 * Las reglas de campos opcionales pasan cuando el campo está vacío: "obligatorio" es una regla aparte.
 * El backend vuelve a validar todo (Bean Validation): estas reglas son para dar respuesta inmediata al usuario.
 */
import { AGENDA } from '../data/clinica'

const OK = ''
const vacio = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0)
const texto = (v) => String(v ?? '').trim()

export const RE = {
  nombre: /^[\p{L}][\p{L} .'-]*$/u,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  telefono: /^(\+?56)?9\d{8}$/,
  codigo: /^[A-Z]{2}\d{3}$/,
}

// ---- fechas (siempre en hora local; 'YYYY-MM-DD' y 'HH:MM') ----
export function parseFecha(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '')
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}
export function inicioDeHoy() {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}
const aMinutos = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm || '')
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}
const diasEntre = (a, b) => Math.round((b - a) / 86400000)

const claveFuerte = (v) => /[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v) && !/\s/.test(v)

export const V = {
  // ---------- 1. Cuenta y acceso ----------
  nombreRequerido: (v) => (vacio(v) ? 'Escribe tu nombre.' : OK),
  nombreMin3: (v) => (vacio(v) || texto(v).length >= 3 ? OK : 'El nombre debe tener al menos 3 letras.'),
  nombreSoloLetras: (v) => (vacio(v) || RE.nombre.test(texto(v)) ? OK : 'El nombre solo puede tener letras y espacios.'),
  emailRequerido: (v) => (vacio(v) ? 'Escribe tu correo.' : OK),
  emailFormato: (v) => (vacio(v) || RE.email.test(texto(v)) ? OK : 'El correo no parece válido (ej: nombre@correo.cl).'),
  passRequerida: (v) => (vacio(v) ? 'Escribe tu contraseña.' : OK),
  passMin8: (v) => (vacio(v) || String(v).length >= 8 ? OK : 'La contraseña debe tener al menos 8 caracteres.'),
  passMayuscula: (v) => (vacio(v) || /[A-Z]/.test(v) ? OK : 'Incluye al menos una letra mayúscula.'),
  passMinuscula: (v) => (vacio(v) || /[a-z]/.test(v) ? OK : 'Incluye al menos una letra minúscula.'),
  passNumero: (v) => (vacio(v) || /\d/.test(v) ? OK : 'Incluye al menos un número.'),
  passSinEspacios: (v) => (vacio(v) || !/\s/.test(v) ? OK : 'La contraseña no puede tener espacios.'),
  passConfirmada: (v, all) => (v === all.password ? OK : 'Las contraseñas no coinciden.'),
  telefonoChileno: (v) => (vacio(v) || RE.telefono.test(texto(v).replace(/\s/g, '')) ? OK : 'Usa un celular chileno, ej: +56912345678.'),
  terminosAceptados: (v) => (v ? OK : 'Debes aceptar el uso de tus datos para crear la cuenta.'),

  // ---------- 2. Mascotas ----------
  mascotaNombreRequerido: (v) => (vacio(v) ? 'Escribe el nombre de la mascota.' : OK),
  mascotaNombreLargo: (v) => (vacio(v) || (texto(v).length >= 2 && texto(v).length <= 60) ? OK : 'El nombre debe tener entre 2 y 60 caracteres.'),
  especieRequerida: (v) => (vacio(v) ? 'Selecciona la especie.' : OK),
  sexoRequerido: (v) => (vacio(v) ? 'Indica el sexo de la mascota.' : OK),
  razaMax60: (v) => (texto(v).length <= 60 ? OK : 'La raza no puede superar 60 caracteres.'),
  nacimientoNoFuturo: (v) => {
    const f = parseFecha(v)
    return vacio(v) || (f && f <= inicioDeHoy()) ? OK : 'La fecha de nacimiento no puede ser futura.'
  },
  nacimientoNoAntiguo: (v) => {
    const f = parseFecha(v)
    if (vacio(v) || !f) return OK
    const limite = inicioDeHoy()
    limite.setFullYear(limite.getFullYear() - 40)
    return f >= limite ? OK : 'Revisa la fecha: la mascota tendría más de 40 años.'
  },
  pesoPositivo: (v) => (vacio(v) || Number(v) > 0 ? OK : 'El peso debe ser mayor a 0.'),
  pesoMaximo: (v) => (vacio(v) || Number(v) <= 100 ? OK : 'El peso no puede superar 100 kg.'),
  pesoDosDecimales: (v) => (vacio(v) || /^\d+([.,]\d{1,2})?$/.test(String(v).trim()) ? OK : 'Usa hasta 2 decimales (ej: 4.25).'),
  duenoRequerido: (v) => (vacio(v) ? 'Selecciona al dueño de la mascota.' : OK),

  // ---------- 3. Citas ----------
  mascotaSeleccionada: (v) => (vacio(v) ? 'Selecciona una mascota.' : OK),
  servicioSeleccionado: (v) => (vacio(v) ? 'Selecciona un servicio.' : OK),
  // El formulario entrega en `extra` las listas { mascotas, servicios } para cruzar especie y servicio.
  servicioCompatible: (v, all, extra = {}) => {
    const mascota = (extra.mascotas || []).find((m) => String(m.id) === String(all.mascotaId))
    const servicio = (extra.servicios || []).find((s) => String(s.id) === String(v))
    if (!mascota || !servicio) return OK
    return servicio.especies.includes(mascota.especie) ? OK : `Ese servicio no se ofrece para ${mascota.especie.toLowerCase()}s.`
  },
  fechaRequerida: (v) => (vacio(v) ? 'Selecciona una fecha.' : OK),
  fechaNoPasada: (v) => {
    const f = parseFecha(v)
    return vacio(v) || (f && f >= inicioDeHoy()) ? OK : 'La fecha no puede ser anterior a hoy.'
  },
  fechaNoDomingo: (v) => {
    const f = parseFecha(v)
    return vacio(v) || !f || f.getDay() !== 0 ? OK : 'La clínica no atiende los domingos.'
  },
  fechaMax90Dias: (v) => {
    const f = parseFecha(v)
    return vacio(v) || !f || diasEntre(inicioDeHoy(), f) <= AGENDA.diasMaximos ? OK : `Solo puedes agendar con hasta ${AGENDA.diasMaximos} días de anticipación.`
  },
  horaRequerida: (v) => (vacio(v) ? 'Selecciona una hora.' : OK),
  horaEnHorario: (v) => {
    const m = aMinutos(v)
    if (vacio(v) || m === null) return OK
    const dentro = m >= aMinutos(AGENDA.apertura) && m <= aMinutos(AGENDA.ultimoBloque) && m % 30 === 0
    return dentro ? OK : 'Atendemos de 9:00 a 18:00, en bloques de 30 minutos.'
  },
  // Si la fecha es hoy, la hora debe ser posterior a la actual.
  horaNoPasada: (v, all) => {
    const f = parseFecha(all.fecha)
    const m = aMinutos(v)
    if (vacio(v) || !f || m === null || f.getTime() !== inicioDeHoy().getTime()) return OK
    const n = new Date()
    return m > n.getHours() * 60 + n.getMinutes() ? OK : 'Esa hora ya pasó. Elige una más tarde.'
  },
  motivoMin10: (v) => (texto(v).length >= 10 ? OK : 'Cuéntanos el motivo con al menos 10 caracteres.'),
  motivoMax300: (v) => (texto(v).length <= 300 ? OK : 'El motivo no puede superar 300 caracteres.'),
  observacionMax300: (v) => (texto(v).length <= 300 ? OK : 'La observación no puede superar 300 caracteres.'),

  // ---------- 4. Usuarios (administración) ----------
  rolRequerido: (v) => (vacio(v) ? 'Asigna un rol al usuario.' : OK),
  // extra.creando = true exige contraseña; al editar es opcional pero, si se escribe, debe ser fuerte.
  passAdminValida: (v, all, extra = {}) => {
    if (vacio(v)) return extra.creando ? 'Define una contraseña inicial.' : OK
    return String(v).length >= 8 && claveFuerte(v) ? OK : 'Mínimo 8 caracteres con mayúscula, minúscula y número, sin espacios.'
  },

  // ---------- 5. Catálogo (administración) ----------
  codigoRequerido: (v) => (vacio(v) ? 'Escribe el código.' : OK),
  codigoFormato: (v) => (vacio(v) || RE.codigo.test(texto(v)) ? OK : 'El código son 2 letras mayúsculas y 3 números (ej: SV001).'),
  nombreCatalogoRequerido: (v) => (vacio(v) ? 'Escribe el nombre.' : OK),
  categoriaRequerida: (v) => (vacio(v) ? 'Selecciona una categoría.' : OK),
  especiesAlMenosUna: (v) => (vacio(v) ? 'Marca al menos una especie.' : OK),
  duracionRango: (v) => (Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 1440 ? OK : 'La duración va de 1 a 1440 minutos.'),
  precioEntero: (v) => (vacio(v) || (Number.isInteger(Number(v)) && Number(v) >= 0) ? OK : 'El precio debe ser un número entero (pesos), sin decimales.'),
  precioRequerido: (v) => (vacio(v) ? 'Escribe el precio.' : OK),
  stockEntero: (v) => (!vacio(v) && Number.isInteger(Number(v)) && Number(v) >= 0 ? OK : 'El stock debe ser un número entero de 0 o más.'),

  // ---------- 6. Ficha clínica ----------
  fechaConsultaNoFutura: (v) => {
    const f = parseFecha(v)
    if (vacio(v)) return 'Indica la fecha de la consulta.'
    return f && f <= inicioDeHoy() ? OK : 'La fecha de la consulta no puede ser futura.'
  },
  diagnosticoRequerido: (v) => (vacio(v) ? 'Escribe el diagnóstico.' : OK),
  diagnosticoMin5: (v) => (vacio(v) || texto(v).length >= 5 ? OK : 'El diagnóstico debe tener al menos 5 caracteres.'),
  proximoControlPosterior: (v, all) => {
    const c = parseFecha(v)
    const f = parseFecha(all.fecha)
    return vacio(v) || !c || !f || c >= f ? OK : 'El próximo control no puede ser anterior a la consulta.'
  },
  vacunaNombreRequerido: (v) => (vacio(v) ? 'Indica qué vacuna se aplicó.' : OK),
  vacunaFechaRequerida: (v) => (vacio(v) ? 'Indica la fecha de aplicación.' : OK),
  proximaDosisPosterior: (v, all) => {
    const p = parseFecha(v)
    const a = parseFecha(all.fechaAplicacion)
    return vacio(v) || !p || !a || p >= a ? OK : 'La próxima dosis no puede ser anterior a la aplicación.'
  },
  medicamentoRequerido: (v) => (vacio(v) ? 'Selecciona el medicamento.' : OK),
  indicacionesRequeridas: (v) => (vacio(v) ? 'Escribe las indicaciones de uso.' : OK),

  // ---------- 7. Reportes ----------
  rangoFechasValido: (v, all) => {
    const d = parseFecha(all.desde)
    const h = parseFecha(all.hasta)
    return !d || !h || d <= h ? OK : 'La fecha «Desde» no puede ser posterior a «Hasta».'
  },
  rangoMax366: (v, all) => {
    const d = parseFecha(all.desde)
    const h = parseFecha(all.hasta)
    return !d || !h || diasEntre(d, h) <= 366 ? OK : 'El período máximo de un reporte es un año.'
  },
}

const fechaCita = [V.fechaRequerida, V.fechaNoPasada, V.fechaNoDomingo, V.fechaMax90Dias]
const horaCita = [V.horaRequerida, V.horaEnHorario, V.horaNoPasada]
const datosUsuario = {
  nombre: [V.nombreRequerido, V.nombreMin3, V.nombreSoloLetras],
  email: [V.emailRequerido, V.emailFormato],
  telefono: [V.telefonoChileno],
}
const datosMascota = {
  nombre: [V.mascotaNombreRequerido, V.mascotaNombreLargo],
  especie: [V.especieRequerida],
  sexo: [V.sexoRequerido],
  raza: [V.razaMax60],
  fechaNacimiento: [V.nacimientoNoFuturo, V.nacimientoNoAntiguo],
  pesoKg: [V.pesoPositivo, V.pesoMaximo, V.pesoDosDecimales],
}
const datosCatalogo = {
  codigo: [V.codigoRequerido, V.codigoFormato],
  categoriaId: [V.categoriaRequerida],
  precio: [V.precioRequerido, V.precioEntero],
  especies: [V.especiesAlMenosUna],
}

/** Un esquema es { campo: [regla, regla, ...] }. Se muestra el primer error de cada campo. */
export const esquemas = {
  login: { email: [V.emailRequerido, V.emailFormato], password: [V.passRequerida] },
  registro: {
    ...datosUsuario,
    password: [V.passRequerida, V.passMin8, V.passMayuscula, V.passMinuscula, V.passNumero, V.passSinEspacios],
    confirmar: [V.passConfirmada],
    terminos: [V.terminosAceptados],
  },
  usuario: { ...datosUsuario, rol: [V.rolRequerido], password: [V.passAdminValida] },
  mascota: datosMascota,
  mascotaPersonal: { ...datosMascota, duenoId: [V.duenoRequerido] },
  cita: {
    mascotaId: [V.mascotaSeleccionada],
    servicioId: [V.servicioSeleccionado, V.servicioCompatible],
    fecha: fechaCita,
    hora: horaCita,
    motivo: [V.motivoMin10, V.motivoMax300],
  },
  reagendar: { fecha: fechaCita, hora: horaCita, observacion: [V.observacionMax300] },
  servicio: {
    ...datosCatalogo,
    nombre: [V.nombreCatalogoRequerido],
    duracionMin: [V.duracionRango],
  },
  medicamento: {
    ...datosCatalogo,
    nombreComercial: [V.nombreCatalogoRequerido],
    principioActivo: [V.nombreCatalogoRequerido],
    presentacion: [V.nombreCatalogoRequerido],
    stock: [V.stockEntero],
  },
  stock: { stock: [V.stockEntero] },
  consulta: {
    fecha: [V.fechaConsultaNoFutura],
    diagnostico: [V.diagnosticoRequerido, V.diagnosticoMin5],
    pesoKg: [V.pesoPositivo, V.pesoMaximo],
    proximoControl: [V.proximoControlPosterior],
  },
  vacuna: {
    nombreVacuna: [V.vacunaNombreRequerido],
    fechaAplicacion: [V.vacunaFechaRequerida],
    proximaDosis: [V.proximaDosisPosterior],
  },
  receta: { medicamentoId: [V.medicamentoRequerido], indicaciones: [V.indicacionesRequeridas] },
  reporte: { desde: [V.fechaRequerida, V.rangoFechasValido], hasta: [V.fechaRequerida, V.rangoMax366] },
}

/** Ejecuta un esquema y devuelve { campo: mensaje } solo con los campos que fallaron. */
export function validar(esquema, valores, extra = {}) {
  const errores = {}
  for (const [campo, reglas] of Object.entries(esquema)) {
    for (const regla of reglas) {
      const mensaje = regla(valores[campo], valores, extra)
      if (mensaje) {
        errores[campo] = mensaje
        break
      }
    }
  }
  return errores
}

/** Nombres de todas las reglas que algún formulario usa (para contarlas y probarlas). */
export function reglasEnUso() {
  const usadas = new Set()
  for (const esquema of Object.values(esquemas)) {
    for (const reglas of Object.values(esquema)) {
      for (const regla of reglas) {
        const nombre = Object.keys(V).find((k) => V[k] === regla)
        if (nombre) usadas.add(nombre)
      }
    }
  }
  return [...usadas]
}
