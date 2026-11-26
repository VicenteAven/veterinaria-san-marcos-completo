import { useCallback, useEffect, useMemo, useState } from 'react'
import CampoFormulario from '../../components/CampoFormulario'
import { useAuth } from '../../context/AuthContext'
import { useForm } from '../../hooks/useForm'
import { leerError, usuarios as api } from '../../services/api'
import { ROLES, fechaCorta } from '../../utils/format'
import { esquemas } from '../../utils/validators'

const VACIO = { nombre: '', email: '', telefono: '', rol: '', password: '' }

/** panel de administración de usuarios (crear, editar, desactivar y asignar roles). */
export default function Usuarios() {
  const { usuario: yo } = useAuth()
  const [lista, setLista] = useState([])
  const [editando, setEditando] = useState(null) // null | 'nuevo' | usuario
  const [confirmando, setConfirmando] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const extra = useMemo(() => ({ creando: editando === 'nuevo' }), [editando])
  const form = useForm(VACIO, esquemas.usuario, extra)
  const { valores, errores, alCambiar, alSalir } = form

  const cargar = useCallback(async () => {
    try {
      setLista(await api.listar())
      setError('')
    } catch (e) {
      setError(leerError(e).mensaje)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const abrirNuevo = () => {
    form.reiniciar(VACIO)
    setEditando('nuevo')
    setMensaje('')
  }
  const abrirEdicion = (u) => {
    form.reiniciar({ nombre: u.nombre, email: u.email, telefono: u.telefono || '', rol: u.rol, password: '' })
    setEditando(u)
    setMensaje('')
  }

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.validarTodo()) return
    const cuerpo = { nombre: valores.nombre.trim(), email: valores.email.trim(), telefono: valores.telefono.trim(), rol: valores.rol, password: valores.password }
    setEnviando(true)
    try {
      if (editando === 'nuevo') await api.crear(cuerpo)
      else await api.actualizar(editando.id, cuerpo)
      setMensaje(editando === 'nuevo' ? 'Creamos el usuario.' : 'Guardamos los cambios del usuario.')
      setEditando(null)
      await cargar()
    } catch (err) {
      const { mensaje: m, campos } = leerError(err)
      form.ponerErrores(campos)
      setError(m)
    } finally {
      setEnviando(false)
    }
  }

  const cambiarEstado = async (u, activo) => {
    setError('')
    try {
      await api.cambiarEstado(u.id, activo)
      setMensaje(activo ? `${u.nombre} volvió a estar activo.` : `${u.nombre} fue desactivado y ya no puede iniciar sesión.`)
      setConfirmando(null)
      await cargar()
    } catch (err) {
      setError(leerError(err).mensaje)
      setConfirmando(null)
    }
  }

  return (
    <main className="container pagina">
      <div className="encabezado">
        <div>
          <h1>Usuarios</h1>
          <p>Crea cuentas del personal, asigna roles y desactiva accesos.</p>
        </div>
        {!editando && <button type="button" className="btn btn-calendula" onClick={abrirNuevo}>Nuevo usuario</button>}
      </div>

      {mensaje && <div className="alert alert-success" role="status">{mensaje}</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {editando && (
        <section className="panel mb-3" aria-labelledby="titulo-form-usuario">
          <div className="panel-titulo"><h2 id="titulo-form-usuario">{editando === 'nuevo' ? 'Nuevo usuario' : `Editar a ${editando.nombre}`}</h2></div>
          <form onSubmit={guardar} noValidate>
            <div className="row">
              <div className="col-md-6"><CampoFormulario label="Nombre completo" name="nombre" value={valores.nombre} onChange={alCambiar} onBlur={alSalir} error={errores.nombre} obligatorio /></div>
              <div className="col-md-6"><CampoFormulario label="Correo electrónico" name="email" type="email" value={valores.email} onChange={alCambiar} onBlur={alSalir} error={errores.email} obligatorio /></div>
              <div className="col-md-4"><CampoFormulario label="Celular" name="telefono" type="tel" value={valores.telefono} onChange={alCambiar} onBlur={alSalir} error={errores.telefono} ayuda="Opcional" /></div>
              <div className="col-md-4"><CampoFormulario label="Rol" name="rol" as="select" value={valores.rol} onChange={alCambiar} onBlur={alSalir} error={errores.rol} opciones={Object.entries(ROLES).map(([k, v]) => ({ value: k, label: v }))} obligatorio /></div>
              <div className="col-md-4">
                <CampoFormulario label={editando === 'nuevo' ? 'Contraseña inicial' : 'Nueva contraseña'} name="password" type="password" value={valores.password} onChange={alCambiar} onBlur={alSalir} error={errores.password}
                  ayuda={editando === 'nuevo' ? 'Mínimo 8 caracteres, con mayúscula, minúscula y número.' : 'Déjala vacía para no cambiarla.'} autoComplete="new-password" obligatorio={editando === 'nuevo'} />
              </div>
            </div>
            <div className="acciones">
              <button type="submit" className="btn btn-primary" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar usuario'}</button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setEditando(null)}>Cancelar</button>
            </div>
          </form>
        </section>
      )}

      <section className="panel" aria-label="Listado de usuarios">
        {cargando ? (
          <div className="pagina-cargando" role="status"><span className="spinner-border text-primary" aria-hidden="true" /><span className="ms-2">Cargando…</span></div>
        ) : (
          <table className="tabla">
            <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Alta</th><th>Acciones</th></tr></thead>
            <tbody>
              {lista.map((u) => (
                <tr key={u.id}>
                  <td data-label="Nombre"><strong>{u.nombre}</strong>{u.id === yo.id && <span className="texto-suave"> (tú)</span>}</td>
                  <td data-label="Correo">{u.email}</td>
                  <td data-label="Rol">{ROLES[u.rol]}</td>
                  <td data-label="Estado"><span className={`estado ${u.activo ? 'estado-success' : 'estado-secondary'}`}>{u.activo ? 'Activo' : 'Desactivado'}</span></td>
                  <td data-label="Alta">{fechaCorta(u.creadoEn?.slice(0, 10))}</td>
                  <td className="acciones" data-label="Acciones">
                    {confirmando === u.id ? (
                      <>
                        <span>¿Desactivar?</span>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => cambiarEstado(u, false)}>Sí</button>
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setConfirmando(null)}>No</button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => abrirEdicion(u)}>Editar</button>
                        {u.activo
                          ? u.id !== yo.id && <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setConfirmando(u.id)}>Desactivar</button>
                          : <button type="button" className="btn btn-outline-success btn-sm" onClick={() => cambiarEstado(u, true)}>Reactivar</button>}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}
