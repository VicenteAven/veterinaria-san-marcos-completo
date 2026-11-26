import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const iniciarSesion = vi.fn()
const registrarse = vi.fn()
let sesionFalsa
vi.mock('../context/AuthContext', () => ({ useAuth: () => sesionFalsa }))

vi.mock('../services/api', () => ({
  leerError: (e) => ({ mensaje: e.mensaje || 'Error', campos: {} }),
  catalogo: {
    servicios: vi.fn().mockResolvedValue([{ id: 1, nombre: 'Consulta general', activo: true, especies: ['Perro', 'Gato'], categoria: { nombre: 'Consultas' } }]),
    medicamentos: vi.fn().mockResolvedValue([]),
  },
  mascotas: { listar: vi.fn().mockResolvedValue([]) },
  usuarios: { duenos: vi.fn().mockResolvedValue([]) },
  citas: {
    listar: vi.fn(),
    confirmar: vi.fn().mockResolvedValue({}),
    aceptarPropuesta: vi.fn().mockResolvedValue({}),
    cancelar: vi.fn().mockResolvedValue({}),
    disponibilidad: vi.fn().mockResolvedValue({ bloques: [] }),
  },
}))

import Login from './Login'
import Citas from './Citas'
import { citas as apiCitas } from '../services/api'

const cita = (id, estado, extra = {}) => ({
  id, mascotaId: 1, mascotaNombre: 'Luna', mascotaEspecie: 'Perro', duenoId: 3, servicioId: 1,
  fechaHora: '2099-01-05T10:00:00', motivo: 'Control general', estado, ...extra,
})

beforeEach(() => {
  vi.clearAllMocks()
  sesionFalsa = { usuario: null, cargando: false, iniciarSesion, registrarse, esPersonal: false }
})

describe('Login · login', () => {
  it('muestra los errores de validación y no llama al servidor si el formulario está vacío', async () => {
    render(<MemoryRouter><Login modo="login" /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Escribe tu correo.')).toBeInTheDocument()
    expect(screen.getByText('Escribe tu contraseña.')).toBeInTheDocument()
    expect(iniciarSesion).not.toHaveBeenCalled()
  })

  it('valida el formato del correo al salir del campo', async () => {
    render(<MemoryRouter><Login modo="login" /></MemoryRouter>)
    await userEvent.type(screen.getByLabelText(/Correo/), 'malo')
    await userEvent.tab()
    expect(await screen.findByText(/no parece válido/)).toBeInTheDocument()
  })

  it('envía las credenciales cuando son válidas', async () => {
    iniciarSesion.mockResolvedValue({ id: 3, nombre: 'María', rol: 'DUENO' })
    render(<MemoryRouter><Login modo="login" /></MemoryRouter>)
    await userEvent.type(screen.getByLabelText(/Correo/), 'dueno@correo.cl')
    await userEvent.type(screen.getByLabelText(/Contraseña/), 'Dueno#2026')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(iniciarSesion).toHaveBeenCalledWith('dueno@correo.cl', 'Dueno#2026'))
  })

  it('muestra el mensaje del servidor si las credenciales fallan', async () => {
    iniciarSesion.mockRejectedValue({ mensaje: 'Correo o contraseña incorrectos.' })
    render(<MemoryRouter><Login modo="login" /></MemoryRouter>)
    await userEvent.type(screen.getByLabelText(/Correo/), 'dueno@correo.cl')
    await userEvent.type(screen.getByLabelText(/Contraseña/), 'mala')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeInTheDocument()
  })
})

describe('Login · registro', () => {
  it('exige coincidir contraseñas y aceptar los términos', async () => {
    render(<MemoryRouter><Login modo="registro" /></MemoryRouter>)
    await userEvent.type(screen.getByLabelText(/Nombre completo/), 'Pedro Soto')
    await userEvent.type(screen.getByLabelText(/Correo/), 'pedro@correo.cl')
    await userEvent.type(screen.getByLabelText(/^Contraseña/), 'Clave1234')
    await userEvent.type(screen.getByLabelText(/Repite la contraseña/), 'Clave9999')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeInTheDocument()
    expect(screen.getByText(/Debes aceptar/)).toBeInTheDocument()
    expect(registrarse).not.toHaveBeenCalled()
  })

  it('muestra los requisitos de la contraseña uno por uno', async () => {
    render(<MemoryRouter><Login modo="registro" /></MemoryRouter>)
    const clave = screen.getByLabelText(/^Contraseña/)
    await userEvent.type(clave, 'abcdefgh')
    await userEvent.tab()
    expect(await screen.findByText('Incluye al menos una letra mayúscula.')).toBeInTheDocument()
  })
})

describe('Citas · acciones según rol y estado', () => {
  it('la recepcionista ve Confirmar en una cita solicitada y la confirma', async () => {
    sesionFalsa = { usuario: { id: 2, nombre: 'Recepción', rol: 'RECEPCIONISTA' }, cargando: false, esPersonal: true }
    apiCitas.listar.mockResolvedValue([cita(10, 'SOLICITADA')])
    render(<MemoryRouter><Citas /></MemoryRouter>)
    const boton = await screen.findByRole('button', { name: 'Confirmar' })
    expect(screen.getByRole('button', { name: 'Proponer otro horario' })).toBeInTheDocument()
    await userEvent.click(boton)
    await waitFor(() => expect(apiCitas.confirmar).toHaveBeenCalledWith(10))
    expect(await screen.findByText('La cita fue confirmada.')).toBeInTheDocument()
  })

  it('el dueño ve «Aceptar nuevo horario» solo cuando hay una propuesta y no puede confirmar', async () => {
    sesionFalsa = { usuario: { id: 3, nombre: 'María', rol: 'DUENO' }, cargando: false, esPersonal: false }
    apiCitas.listar.mockResolvedValue([cita(11, 'REPROGRAMADA', { fechaPropuesta: '2099-01-06T15:00:00', observacion: 'Ese día no hay médico' }), cita(12, 'SOLICITADA')])
    render(<MemoryRouter><Citas /></MemoryRouter>)
    await screen.findAllByRole('row')
    expect(screen.getAllByRole('button', { name: 'Aceptar nuevo horario' })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Confirmar' })).not.toBeInTheDocument()
    expect(screen.getByText(/Ese día no hay médico/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Aceptar nuevo horario' }))
    await waitFor(() => expect(apiCitas.aceptarPropuesta).toHaveBeenCalledWith(11))
  })

  it('pide confirmación antes de cancelar y no cancela si el usuario dice que no', async () => {
    sesionFalsa = { usuario: { id: 3, nombre: 'María', rol: 'DUENO' }, cargando: false, esPersonal: false }
    apiCitas.listar.mockResolvedValue([cita(12, 'SOLICITADA')])
    render(<MemoryRouter><Citas /></MemoryRouter>)
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar' }))
    expect(screen.getByText('¿Cancelar esta cita?')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'No' }))
    expect(apiCitas.cancelar).not.toHaveBeenCalled()
    expect(screen.queryByText('¿Cancelar esta cita?')).not.toBeInTheDocument()
  })

  it('no ofrece acciones sobre citas ya canceladas o atendidas', async () => {
    sesionFalsa = { usuario: { id: 2, nombre: 'Recepción', rol: 'RECEPCIONISTA' }, cargando: false, esPersonal: true }
    apiCitas.listar.mockResolvedValue([cita(13, 'CANCELADA'), cita(14, 'COMPLETADA')])
    render(<MemoryRouter><Citas /></MemoryRouter>)
    const filas = await screen.findAllByRole('row')
    for (const fila of filas.slice(1)) {
      expect(within(fila).queryByRole('button')).not.toBeInTheDocument()
    }
  })
})
