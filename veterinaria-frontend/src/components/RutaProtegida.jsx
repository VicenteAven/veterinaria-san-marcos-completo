import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/** deja pasar solo a quien inició sesión y, si se indica, tiene alguno de los roles permitidos. */
export default function RutaProtegida({ roles, children }) {
  const { usuario, cargando } = useAuth()
  const ubicacion = useLocation()

  if (cargando) {
    return (
      <div className="pagina-cargando" role="status">
        <span className="spinner-border text-primary" aria-hidden="true" />
        <span className="ms-2">Cargando…</span>
      </div>
    )
  }
  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  }
  if (roles && !roles.includes(usuario.rol)) {
    return (
      <main className="container pagina">
        <div className="alert alert-warning" role="alert">
          <h1 className="h5">No tienes acceso a esta sección</h1>
          <p className="mb-2">Tu rol no incluye esta pantalla.</p>
          <Link to="/" className="btn btn-primary btn-sm">Volver al inicio</Link>
        </div>
      </main>
    )
  }
  return children
}
