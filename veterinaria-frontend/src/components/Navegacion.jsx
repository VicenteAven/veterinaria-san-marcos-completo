import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../utils/format'

/** barra de navegación. En móvil se colapsa en un menú «hamburguesa». */
export default function Navegacion() {
  const { usuario, salir, esPersonal, esRol } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const ubicacion = useLocation()
  const navegar = useNavigate()

  useEffect(() => setAbierto(false), [ubicacion.pathname])

  const enlaces = usuario
    ? [
        { a: '/', texto: 'Inicio', fin: true },
        { a: '/citas', texto: 'Citas' },
        { a: '/mascotas', texto: esPersonal ? 'Pacientes' : 'Mis mascotas' },
        { a: '/catalogo', texto: 'Servicios' },
        ...(esPersonal ? [{ a: '/reportes', texto: 'Reportes' }] : []),
        ...(esRol('ADMIN') ? [{ a: '/usuarios', texto: 'Usuarios' }] : []),
        { a: '/ubicacion', texto: 'Cómo llegar' },
      ]
    : []

  const cerrarSesion = () => {
    salir()
    navegar('/login')
  }

  return (
    <header className="barra">
      <nav className="barra-interior" aria-label="Principal">
        <Link to={usuario ? '/' : '/login'} className="marca">
          <svg viewBox="0 0 64 64" width="34" height="34" aria-hidden="true">
            <rect width="64" height="64" rx="14" fill="#F2B632" />
            <g fill="#12241F"><ellipse cx="32" cy="42" rx="12" ry="9" /><circle cx="17" cy="29" r="5" /><circle cx="28" cy="20" r="5" /><circle cx="40" cy="20" r="5" /><circle cx="51" cy="29" r="5" /></g>
          </svg>
          <span><strong>San Marcos</strong><small>Veterinaria · Rancagua</small></span>
        </Link>

        {usuario && (
          <button
            type="button"
            className="barra-boton"
            aria-expanded={abierto}
            aria-controls="menu-principal"
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setAbierto((a) => !a)}
          >
            <span /><span /><span />
          </button>
        )}

        {usuario && (
          <div id="menu-principal" className={`barra-menu ${abierto ? 'abierto' : ''}`}>
            <ul className="barra-enlaces">
              {enlaces.map((e) => (
                <li key={e.a}>
                  <NavLink to={e.a} end={e.fin} className={({ isActive }) => (isActive ? 'activo' : undefined)}>{e.texto}</NavLink>
                </li>
              ))}
            </ul>
            <div className="barra-usuario">
              <span className="barra-nombre">
                {usuario.nombre}
                <small>{ROLES[usuario.rol]}</small>
              </span>
              <button type="button" className="btn btn-outline-light btn-sm" onClick={cerrarSesion}>Salir</button>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
