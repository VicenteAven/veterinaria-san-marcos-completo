import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CampoFormulario from '../components/CampoFormulario'
import { useAuth } from '../context/AuthContext'
import { useForm } from '../hooks/useForm'
import { leerError, mascotas as api, usuarios } from '../services/api'
import { ESPECIES, edad, iniciales } from '../utils/format'
import { esquemas } from '../utils/validators'

const VACIA = { nombre: '', especie: '', raza: '', sexo: '', fechaNacimiento: '', pesoKg: '', duenoId: '' }
const SEXOS = [{ value: 'H', label: 'Hembra' }, { value: 'M', label: 'Macho' }]

/** mascotas del dueño (o pacientes de la clínica) con alta, edición y baja. */
export default function Mascotas() {
  const { esPersonal } = useAuth()
  const [lista, setLista] = useState([])
  const [duenos, setDuenos] = useState([])
  const [filtroDueno, setFiltroDueno] = useState('')
  const [editando, setEditando] = useState(null) // null | 'nueva' | objeto mascota
  const [confirmando, setConfirmando] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const form = useForm(VACIA, esPersonal ? esquemas.mascotaPersonal : esquemas.mascota)
  const { valores, errores, alCambiar, alSalir } = form

  const cargar = useCallback(async () => {
    try {
      const [m, d] = await Promise.all([api.listar(filtroDueno ? { duenoId: filtroDueno } : undefined), esPersonal ? usuarios.duenos() : Promise.resolve([])])
      setLista(m)
      setDuenos(d)
      setError('')
    } catch (e) {
      setError(leerError(e).mensaje)
    } finally {
      setCargando(false)
    }
  }, [esPersonal, filtroDueno])

  useEffect(() => {
    cargar()
  }, [cargar])

  const nombreDueno = useMemo(() => Object.fromEntries(duenos.map((d) => [d.id, d.nombre])), [duenos])

  const abrirNueva = () => {
    form.reiniciar(VACIA)
    setEditando('nueva')
    setMensaje('')
  }
  const abrirEdicion = (m) => {
    form.reiniciar({
      nombre: m.nombre, especie: m.especie, raza: m.raza || '', sexo: m.sexo,
      fechaNacimiento: m.fechaNacimiento || '', pesoKg: m.pesoKg ?? '', duenoId: String(m.duenoId),
    })
    setEditando(m)
    setMensaje('')
  }

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.validarTodo()) return
    const cuerpo = {
      nombre: valores.nombre.trim(),
      especie: valores.especie,
      raza: valores.raza.trim() || null,
      sexo: valores.sexo,
      fechaNacimiento: valores.fechaNacimiento || null,
      pesoKg: valores.pesoKg === '' ? null : Number(String(valores.pesoKg).replace(',', '.')),
      duenoId: esPersonal ? Number(valores.duenoId) : undefined,
    }
    setEnviando(true)
    try {
      if (editando === 'nueva') await api.crear(cuerpo)
      else await api.actualizar(editando.id, cuerpo)
      setMensaje(editando === 'nueva' ? `${cuerpo.nombre} quedó registrada.` : `Guardamos los cambios de ${cuerpo.nombre}.`)
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

  const eliminar = async (m) => {
    setError('')
    try {
      await api.eliminar(m.id)
      setMensaje(`${m.nombre} fue dada de baja. Su ficha clínica se conserva.`)
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
          <h1>{esPersonal ? 'Pacientes' : 'Mis mascotas'}</h1>
          <p>{esPersonal ? 'Fichas de las mascotas de todos los clientes.' : 'Registra a tus mascotas para pedir citas y ver su historial.'}</p>
        </div>
        {!editando && <button type="button" className="btn btn-calendula" onClick={abrirNueva}>Registrar mascota</button>}
      </div>

      {mensaje && <div className="alert alert-success" role="status">{mensaje}</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {editando && (
        <section className="panel mb-3" aria-labelledby="titulo-form-mascota">
          <div className="panel-titulo"><h2 id="titulo-form-mascota">{editando === 'nueva' ? 'Nueva mascota' : `Editar a ${editando.nombre}`}</h2></div>
          <form onSubmit={guardar} noValidate>
            <div className="row">
              {esPersonal && editando === 'nueva' && (
                <div className="col-md-6">
                  <CampoFormulario label="Dueño" name="duenoId" as="select" value={valores.duenoId} onChange={alCambiar} onBlur={alSalir} error={errores.duenoId}
                    opciones={duenos.map((d) => ({ value: d.id, label: `${d.nombre} (${d.email})` }))} placeholder="Selecciona al dueño" obligatorio />
                </div>
              )}
              <div className="col-md-6"><CampoFormulario label="Nombre" name="nombre" value={valores.nombre} onChange={alCambiar} onBlur={alSalir} error={errores.nombre} obligatorio /></div>
              <div className="col-md-4"><CampoFormulario label="Especie" name="especie" as="select" value={valores.especie} onChange={alCambiar} onBlur={alSalir} error={errores.especie} opciones={ESPECIES.map((e) => ({ value: e, label: e }))} obligatorio /></div>
              <div className="col-md-4"><CampoFormulario label="Sexo" name="sexo" as="select" value={valores.sexo} onChange={alCambiar} onBlur={alSalir} error={errores.sexo} opciones={SEXOS} obligatorio /></div>
              <div className="col-md-4"><CampoFormulario label="Raza" name="raza" value={valores.raza} onChange={alCambiar} onBlur={alSalir} error={errores.raza} ayuda="Opcional" /></div>
              <div className="col-md-6"><CampoFormulario label="Fecha de nacimiento" name="fechaNacimiento" type="date" value={valores.fechaNacimiento} onChange={alCambiar} onBlur={alSalir} error={errores.fechaNacimiento} ayuda="Opcional. Si no la sabes, pon una aproximada." /></div>
              <div className="col-md-6"><CampoFormulario label="Peso (kg)" name="pesoKg" type="text" inputMode="decimal" value={valores.pesoKg} onChange={alCambiar} onBlur={alSalir} error={errores.pesoKg} ayuda="Opcional. Ej: 4.25" /></div>
            </div>
            <div className="acciones">
              <button type="submit" className="btn btn-primary" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar mascota'}</button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setEditando(null)}>Cancelar</button>
            </div>
          </form>
        </section>
      )}

      {esPersonal && (
        <div className="mb-3" style={{ maxWidth: 360 }}>
          <CampoFormulario label="Filtrar por dueño" name="filtroDueno" as="select" value={filtroDueno} onChange={(e) => setFiltroDueno(e.target.value)}
            opciones={duenos.map((d) => ({ value: d.id, label: d.nombre }))} placeholder="Todos los dueños" />
        </div>
      )}

      {cargando ? (
        <div className="pagina-cargando" role="status"><span className="spinner-border text-primary" aria-hidden="true" /><span className="ms-2">Cargando…</span></div>
      ) : lista.length === 0 ? (
        <div className="vacio">
          <strong>{esPersonal ? 'No hay pacientes registrados' : 'Aún no registras mascotas'}</strong>
          Registra una para poder pedir una cita.
        </div>
      ) : (
        <div className="rejilla-mascotas">
          {lista.map((m) => (
            <article key={m.id} className="mascota">
              <div className="mascota-cabecera">
                <div className="avatar" aria-hidden="true">{iniciales(m.nombre)}</div>
                <div>
                  <h3>{m.nombre}</h3>
                  <span className="texto-suave">{m.especie}{m.raza ? ` · ${m.raza}` : ''}</span>
                </div>
              </div>
              <dl>
                <dt>Sexo</dt><dd>{m.sexo === 'H' ? 'Hembra' : 'Macho'}</dd>
                {m.fechaNacimiento && (<><dt>Edad</dt><dd>{edad(m.fechaNacimiento)}</dd></>)}
                {m.pesoKg != null && (<><dt>Peso</dt><dd>{m.pesoKg} kg</dd></>)}
                {esPersonal && nombreDueno[m.duenoId] && (<><dt>Dueño</dt><dd>{nombreDueno[m.duenoId]}</dd></>)}
              </dl>
              {confirmando === m.id ? (
                <div role="alertdialog" aria-label={`Confirmar baja de ${m.nombre}`}>
                  <p className="mb-2">¿Dar de baja a <strong>{m.nombre}</strong>? Su ficha clínica se conserva.</p>
                  <div className="acciones">
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => eliminar(m)}>Sí, dar de baja</button>
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setConfirmando(null)}>No</button>
                  </div>
                </div>
              ) : (
                <div className="acciones mt-auto">
                  <Link to={`/mascotas/${m.id}/ficha`} className="btn btn-primary btn-sm">Ver ficha</Link>
                  <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => abrirEdicion(m)}>Editar</button>
                  <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setConfirmando(m.id)}>Dar de baja</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
