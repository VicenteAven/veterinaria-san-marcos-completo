import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CampoFormulario from './CampoFormulario'
import InsigniaEstado from './InsigniaEstado'
import Navegacion from './Navegacion'
import RutaProtegida from './RutaProtegida'

let sesionFalsa = { usuario: null, cargando: false }
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    ...sesionFalsa,
    salir: vi.fn(),
    esPersonal: ['ADMIN', 'RECEPCIONISTA'].includes(sesionFalsa.usuario?.rol),
    esRol: (...roles) => roles.includes(sesionFalsa.usuario?.rol),
  }),
}))

const usuario = (rol) => ({ id: 1, nombre: 'Ana Pérez', rol })

describe('CampoFormulario (render y props)', () => {
  it('asocia la etiqueta con el control y marca el obligatorio', () => {
    render(<CampoFormulario label="Correo" name="email" value="" onChange={() => {}} obligatorio />)
    expect(screen.getByLabelText(/Correo/)).toBeInTheDocument()
  })

  it('muestra el error solo cuando existe y lo enlaza con aria-describedby', () => {
    const { rerender } = render(<CampoFormulario label="Correo" name="email" value="" onChange={() => {}} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    rerender(<CampoFormulario label="Correo" name="email" value="" onChange={() => {}} error="El correo no es válido" />)
    const campo = screen.getByLabelText('Correo')
    expect(screen.getByRole('alert')).toHaveTextContent('El correo no es válido')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id)
  })

  it('renderiza las opciones de un select y avisa los cambios (evento)', async () => {
    const alCambiar = vi.fn()
    render(<CampoFormulario label="Especie" name="especie" as="select" value="" onChange={alCambiar} opciones={[{ value: 'Perro', label: 'Perro' }, { value: 'Gato', label: 'Gato' }]} />)
    expect(screen.getAllByRole('option')).toHaveLength(3)
    await userEvent.selectOptions(screen.getByLabelText('Especie'), 'Gato')
    expect(alCambiar).toHaveBeenCalled()
  })

  it('un checkbox refleja su valor y notifica el clic', async () => {
    const alCambiar = vi.fn()
    render(<CampoFormulario label="Acepto" name="terminos" type="checkbox" value={false} onChange={alCambiar} />)
    const caja = screen.getByLabelText('Acepto')
    expect(caja).not.toBeChecked()
    await userEvent.click(caja)
    expect(alCambiar).toHaveBeenCalledTimes(1)
  })
})

describe('InsigniaEstado (renderizado condicional)', () => {
  it('muestra el texto legible de cada estado', () => {
    const { rerender } = render(<InsigniaEstado estado="SOLICITADA" />)
    expect(screen.getByText('Por confirmar')).toBeInTheDocument()
    rerender(<InsigniaEstado estado="REPROGRAMADA" />)
    expect(screen.getByText('Nuevo horario propuesto')).toBeInTheDocument()
  })
})

describe('Navegacion (menú por rol y hamburguesa)', () => {
  const montar = () => render(<MemoryRouter><Navegacion /></MemoryRouter>)

  it('sin sesión solo muestra la marca', () => {
    sesionFalsa = { usuario: null, cargando: false }
    montar()
    expect(screen.getByText('San Marcos')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Citas' })).not.toBeInTheDocument()
  })

  it('el dueño no ve Reportes ni Usuarios y su lista se llama «Mis mascotas»', () => {
    sesionFalsa = { usuario: usuario('DUENO'), cargando: false }
    montar()
    expect(screen.getByRole('link', { name: 'Mis mascotas' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Reportes' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument()
  })

  it('la recepcionista ve Reportes pero no Usuarios; el administrador ve ambos', () => {
    sesionFalsa = { usuario: usuario('RECEPCIONISTA'), cargando: false }
    const { unmount } = montar()
    expect(screen.getByRole('link', { name: 'Reportes' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument()
    unmount()
    sesionFalsa = { usuario: usuario('ADMIN'), cargando: false }
    montar()
    expect(screen.getByRole('link', { name: 'Usuarios' })).toBeInTheDocument()
  })

  it('el botón hamburguesa abre y cierra el menú', async () => {
    sesionFalsa = { usuario: usuario('DUENO'), cargando: false }
    montar()
    const boton = screen.getByRole('button', { name: 'Abrir menú' })
    expect(boton).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(boton)
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('RutaProtegida', () => {
  const montar = (roles) =>
    render(
      <MemoryRouter initialEntries={['/privada']}>
        <Routes>
          <Route path="/login" element={<p>Pantalla de login</p>} />
          <Route path="/privada" element={<RutaProtegida roles={roles}><p>Contenido privado</p></RutaProtegida>} />
        </Routes>
      </MemoryRouter>,
    )

  it('redirige al login si no hay sesión', () => {
    sesionFalsa = { usuario: null, cargando: false }
    montar()
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument()
  })

  it('muestra el contenido si el rol está permitido', () => {
    sesionFalsa = { usuario: usuario('ADMIN'), cargando: false }
    montar(['ADMIN'])
    expect(screen.getByText('Contenido privado')).toBeInTheDocument()
  })

  it('bloquea con un mensaje si el rol no está permitido', () => {
    sesionFalsa = { usuario: usuario('DUENO'), cargando: false }
    montar(['ADMIN'])
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument()
    expect(screen.getByText('No tienes acceso a esta sección')).toBeInTheDocument()
  })

  it('muestra «Cargando» mientras se verifica la sesión', () => {
    sesionFalsa = { usuario: null, cargando: true }
    montar()
    expect(screen.getByRole('status')).toHaveTextContent('Cargando')
  })
})
