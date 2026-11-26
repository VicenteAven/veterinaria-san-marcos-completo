import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { V, esquemas, reglasEnUso, validar } from './validators'

describe('catálogo de validaciones', () => {
  it('el frontend usa al menos 30 reglas de validación distintas en sus formularios', () => {
    expect(reglasEnUso().length).toBeGreaterThanOrEqual(30)
  })

  it('cada regla definida está en uso en algún formulario', () => {
    const usadas = new Set(reglasEnUso())
    const sinUso = Object.keys(V).filter((k) => !usadas.has(k))
    expect(sinUso).toEqual([])
  })
})

describe('cuenta y acceso', () => {
  it('valida nombre', () => {
    expect(V.nombreRequerido('')).not.toBe('')
    expect(V.nombreMin3('Al')).not.toBe('')
    expect(V.nombreSoloLetras('Juan123')).not.toBe('')
    expect(V.nombreSoloLetras("María José O'Higgins")).toBe('')
  })
  it('valida correo', () => {
    expect(V.emailFormato('sin-arroba')).not.toBe('')
    expect(V.emailFormato('a@b')).not.toBe('')
    expect(V.emailFormato('dueno@correo.cl')).toBe('')
  })
  it('valida contraseña por reglas independientes', () => {
    expect(V.passMin8('Ab1')).not.toBe('')
    expect(V.passMayuscula('abcdefg1')).not.toBe('')
    expect(V.passMinuscula('ABCDEFG1')).not.toBe('')
    expect(V.passNumero('Abcdefgh')).not.toBe('')
    expect(V.passSinEspacios('Abcd 1234')).not.toBe('')
    expect(esquemas.registro.password.map((r) => r('Clave1234')).every((m) => m === '')).toBe(true)
  })
  it('compara la confirmación de contraseña', () => {
    expect(V.passConfirmada('otra', { password: 'Clave1234' })).not.toBe('')
    expect(V.passConfirmada('Clave1234', { password: 'Clave1234' })).toBe('')
  })
  it('acepta celulares chilenos con o sin +56 y rechaza otros', () => {
    expect(V.telefonoChileno('+56912345678')).toBe('')
    expect(V.telefonoChileno('912345678')).toBe('')
    expect(V.telefonoChileno('+56 9 1234 5678')).toBe('')
    expect(V.telefonoChileno('12345')).not.toBe('')
    expect(V.telefonoChileno('')).toBe('')
  })
  it('exige aceptar los términos', () => {
    expect(V.terminosAceptados(false)).not.toBe('')
    expect(V.terminosAceptados(true)).toBe('')
  })
})

describe('fechas y horarios (hoy = miércoles 25-11-2026 10:00)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 25, 10, 0, 0))
  })
  afterEach(() => vi.useRealTimers())

  it('rechaza fechas pasadas y acepta hoy', () => {
    expect(V.fechaNoPasada('2026-11-24')).not.toBe('')
    expect(V.fechaNoPasada('2026-11-25')).toBe('')
  })
  it('rechaza domingos', () => {
    expect(V.fechaNoDomingo('2026-11-29')).not.toBe('')
    expect(V.fechaNoDomingo('2026-11-28')).toBe('')
  })
  it('limita la anticipación a 90 días', () => {
    expect(V.fechaMax90Dias('2027-02-23')).toBe('')
    expect(V.fechaMax90Dias('2027-02-24')).not.toBe('')
  })
  it('acepta solo horas de 9:00 a 17:30 en bloques de 30 minutos', () => {
    expect(V.horaEnHorario('09:00')).toBe('')
    expect(V.horaEnHorario('17:30')).toBe('')
    expect(V.horaEnHorario('08:30')).not.toBe('')
    expect(V.horaEnHorario('18:00')).not.toBe('')
    expect(V.horaEnHorario('10:15')).not.toBe('')
  })
  it('si la fecha es hoy, la hora debe ser posterior a la actual', () => {
    expect(V.horaNoPasada('09:30', { fecha: '2026-11-25' })).not.toBe('')
    expect(V.horaNoPasada('10:30', { fecha: '2026-11-25' })).toBe('')
    expect(V.horaNoPasada('09:30', { fecha: '2026-11-26' })).toBe('')
  })
  it('valida la fecha de nacimiento de una mascota', () => {
    expect(V.nacimientoNoFuturo('2026-12-01')).not.toBe('')
    expect(V.nacimientoNoAntiguo('1980-01-01')).not.toBe('')
    expect(V.nacimientoNoFuturo('2022-05-10')).toBe('')
    expect(V.nacimientoNoAntiguo('2022-05-10')).toBe('')
  })
  it('valida fechas de la ficha clínica', () => {
    expect(V.fechaConsultaNoFutura('2026-11-30')).not.toBe('')
    expect(V.fechaConsultaNoFutura('2026-11-20')).toBe('')
    expect(V.proximoControlPosterior('2026-11-01', { fecha: '2026-11-20' })).not.toBe('')
    expect(V.proximoControlPosterior('2026-12-20', { fecha: '2026-11-20' })).toBe('')
    expect(V.proximaDosisPosterior('2026-10-01', { fechaAplicacion: '2026-11-01' })).not.toBe('')
  })
  it('valida el período de un reporte', () => {
    expect(V.rangoFechasValido('', { desde: '2026-11-10', hasta: '2026-11-01' })).not.toBe('')
    expect(V.rangoMax366('', { desde: '2024-01-01', hasta: '2026-01-01' })).not.toBe('')
    expect(V.rangoMax366('', { desde: '2026-01-01', hasta: '2026-11-01' })).toBe('')
  })
})

describe('mascotas, citas, catálogo y usuarios', () => {
  it('valida peso', () => {
    expect(V.pesoPositivo('0')).not.toBe('')
    expect(V.pesoMaximo('150')).not.toBe('')
    expect(V.pesoDosDecimales('4.255')).not.toBe('')
    expect(V.pesoDosDecimales('4,25')).toBe('')
  })
  it('valida el motivo de la cita', () => {
    expect(V.motivoMin10('Dolor')).not.toBe('')
    expect(V.motivoMax300('x'.repeat(301))).not.toBe('')
    expect(V.motivoMin10('Control general de vacunas')).toBe('')
  })
  it('cruza la especie de la mascota con el servicio', () => {
    const extra = {
      mascotas: [{ id: 1, especie: 'Perro' }],
      servicios: [{ id: 7, especies: ['Gato'] }, { id: 8, especies: ['Perro', 'Gato'] }],
    }
    expect(V.servicioCompatible('7', { mascotaId: '1' }, extra)).not.toBe('')
    expect(V.servicioCompatible('8', { mascotaId: '1' }, extra)).toBe('')
  })
  it('valida códigos, precios, stock y duración del catálogo', () => {
    expect(V.codigoFormato('sv001')).not.toBe('')
    expect(V.codigoFormato('SV001')).toBe('')
    expect(V.precioEntero('12.5')).not.toBe('')
    expect(V.precioEntero('12000')).toBe('')
    expect(V.stockEntero('-1')).not.toBe('')
    expect(V.stockEntero('')).not.toBe('')
    expect(V.duracionRango('0')).not.toBe('')
    expect(V.duracionRango('1441')).not.toBe('')
  })
  it('la contraseña de un usuario es obligatoria al crear y opcional al editar', () => {
    expect(V.passAdminValida('', {}, { creando: true })).not.toBe('')
    expect(V.passAdminValida('', {}, { creando: false })).toBe('')
    expect(V.passAdminValida('debil', {}, { creando: false })).not.toBe('')
    expect(V.passAdminValida('Clave1234', {}, { creando: true })).toBe('')
  })
})

describe('validar()', () => {
  it('devuelve solo el primer error de cada campo y omite los campos correctos', () => {
    const errores = validar(esquemas.login, { email: 'malo', password: '' })
    expect(Object.keys(errores).sort()).toEqual(['email', 'password'])
    expect(errores.email).toMatch(/correo/i)
    expect(validar(esquemas.login, { email: 'a@b.cl', password: 'x' })).toEqual({})
  })
})
