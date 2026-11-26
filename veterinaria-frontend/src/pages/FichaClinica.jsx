import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CampoFormulario from '../components/CampoFormulario'
import { useAuth } from '../context/AuthContext'
import { useForm } from '../hooks/useForm'
import { useReferencias } from '../hooks/useReferencias'
import { leerError, mascotas as api } from '../services/api'
import { edad, fechaCorta, fechaLarga, isoFecha } from '../utils/format'
import { esquemas, validar } from '../utils/validators'

const CONSULTA_VACIA = () => ({ fecha: isoFecha(), diagnostico: '', tratamiento: '', pesoKg: '', proximoControl: '' })
const ESQUEMA_EDICION = { diagnostico: esquemas.consulta.diagnostico, proximoControl: esquemas.consulta.proximoControl }

/** ficha clínica de una mascota, dibujada como su libreta sanitaria. El personal registra consultas. */
export default function FichaClinica() {
  const { id } = useParams()
  const { esPersonal } = useAuth()
  const { servicios, medicamentos, medicamentoPorId } = useReferencias()
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(true)
  const [formAbierto, setFormAbierto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [vacunas, setVacunas] = useState([])
  const [recetas, setRecetas] = useState([])
  const [erroresFilas, setErroresFilas] = useState({ vacunas: [], recetas: [] })
  const [editandoId, setEditandoId] = useState(null)
  const form = useForm(CONSULTA_VACIA(), esquemas.consulta)
  const edicion = useForm({ fecha: '', diagnostico: '', tratamiento: '', proximoControl: '' }, ESQUEMA_EDICION)

  const cargar = useCallback(async () => {
    try {
      setDatos(await api.historial(id))
      setError('')
    } catch (e) {
      setError(leerError(e).mensaje)
    } finally {
      setCargando(false)
    }
  }, [id])

  useEffect(() => {
    cargar()
  }, [cargar])

  if (cargando) {
    return <div className="pagina-cargando" role="status"><span className="spinner-border text-primary" aria-hidden="true" /><span className="ms-2">Cargando ficha…</span></div>
  }
  if (!datos) {
    return (
      <main className="container pagina">
        <div className="alert alert-danger" role="alert">{error || 'No encontramos esa ficha.'}</div>
        <Link to="/mascotas" className="btn btn-primary">Volver a las mascotas</Link>
      </main>
    )
  }

  const { mascota, consultas } = datos
  const opcionesVacuna = servicios
    .filter((s) => s.activo && s.categoria.nombre === 'Vacunación' && s.especies.includes(mascota.especie))
    .map((s) => ({ value: s.nombre, label: s.nombre }))
  const opcionesMedicamento = medicamentos
    .filter((m) => m.activo && m.especies.includes(mascota.especie))
    .map((m) => ({ value: m.id, label: `${m.nombreComercial} · ${m.presentacion}` }))
  const sellos = consultas
    .flatMap((c) => c.vacunaciones.map((v) => ({ ...v, consultaId: c.id })))
    .sort((a, b) => b.fechaAplicacion.localeCompare(a.fechaAplicacion))

  const cambiarFila = (lista, setLista, i, campo, valor) => setLista(lista.map((fila, idx) => (idx === i ? { ...fila, [campo]: valor } : fila)))
  const quitarFila = (lista, setLista, i) => setLista(lista.filter((_, idx) => idx !== i))

  const abrirFormulario = () => {
    form.reiniciar(CONSULTA_VACIA())
    setVacunas([])
    setRecetas([])
    setErroresFilas({ vacunas: [], recetas: [] })
    setFormAbierto(true)
    setMensaje('')
  }

  const registrar = async (e) => {
    e.preventDefault()
    setError('')
    const principalOk = form.validarTodo()
    const erroresVac = vacunas.map((v) => validar(esquemas.vacuna, v))
    const erroresRec = recetas.map((r) => validar(esquemas.receta, r))
    setErroresFilas({ vacunas: erroresVac, recetas: erroresRec })
    if (!principalOk || erroresVac.some((x) => Object.keys(x).length) || erroresRec.some((x) => Object.keys(x).length)) return

    const v = form.valores
    setEnviando(true)
    try {
      await api.registrarConsulta(mascota.id, {
        fecha: v.fecha,
        diagnostico: v.diagnostico.trim(),
        tratamiento: v.tratamiento.trim() || null,
        pesoKg: v.pesoKg === '' ? null : Number(String(v.pesoKg).replace(',', '.')),
        proximoControl: v.proximoControl || null,
        vacunas: vacunas.map((x) => ({ nombreVacuna: x.nombreVacuna, fechaAplicacion: x.fechaAplicacion, proximaDosis: x.proximaDosis || null })),
        recetas: recetas.map((x) => ({ medicamentoId: Number(x.medicamentoId), indicaciones: x.indicaciones.trim() })),
      })
      setMensaje('La consulta quedó registrada en la ficha.')
      setFormAbierto(false)
      await cargar()
    } catch (err) {
      const { mensaje: m, campos } = leerError(err)
      form.ponerErrores(campos)
      setError(m)
    } finally {
      setEnviando(false)
    }
  }

  const abrirEdicion = (c) => {
    edicion.reiniciar({ fecha: c.fecha, diagnostico: c.diagnostico, tratamiento: c.tratamiento || '', proximoControl: c.proximoControl || '' })
    setEditandoId(c.id)
    setMensaje('')
  }

  const guardarEdicion = async (e) => {
    e.preventDefault()
    setError('')
    if (!edicion.validarTodo()) return
    const v = edicion.valores
    setEnviando(true)
    try {
      await api.editarConsulta(editandoId, { diagnostico: v.diagnostico.trim(), tratamiento: v.tratamiento.trim() || null, proximoControl: v.proximoControl || null })
      setMensaje('Actualizamos la consulta.')
      setEditandoId(null)
      await cargar()
    } catch (err) {
      const { mensaje: m, campos } = leerError(err)
      edicion.ponerErrores(campos)
      setError(m)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="container pagina">
      <p><Link to="/mascotas">← {esPersonal ? 'Pacientes' : 'Mis mascotas'}</Link></p>

      {mensaje && <div className="alert alert-success" role="status">{mensaje}</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <article className="libreta">
        <header className="libreta-portada">
          <small>Libreta sanitaria · Veterinaria San Marcos</small>
          <h1>{mascota.nombre}</h1>
          <div className="libreta-datos">
            <span>{mascota.especie}{mascota.raza ? ` · ${mascota.raza}` : ''}</span>
            <span>{mascota.sexo === 'H' ? 'Hembra' : 'Macho'}</span>
            {mascota.fechaNacimiento && <span>{edad(mascota.fechaNacimiento)}</span>}
            {mascota.pesoKg != null && <span>{mascota.pesoKg} kg</span>}
          </div>
        </header>

        <div className="libreta-cuerpo">
          <section aria-labelledby="titulo-vacunas" className="mb-4">
            <h2 id="titulo-vacunas" className="h4 mb-3">Vacunas</h2>
            {sellos.length === 0 ? (
              <div className="vacio"><strong>Sin vacunas registradas</strong>Cuando se aplique una vacuna en la clínica, quedará sellada aquí.</div>
            ) : (
              <div className="sellos">
                {sellos.map((v) => (
                  <div key={v.id} className="sello">
                    <strong>{v.nombreVacuna}</strong>
                    <span>Aplicada el {fechaCorta(v.fechaAplicacion)}</span>
                    {v.proximaDosis && <span className="proxima">Próxima dosis: {fechaCorta(v.proximaDosis)}</span>}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="titulo-historial">
            <div className="panel-titulo">
              <h2 id="titulo-historial" className="h4">Historial de consultas</h2>
              {esPersonal && !formAbierto && <button type="button" className="btn btn-calendula btn-sm" onClick={abrirFormulario}>Registrar consulta</button>}
            </div>

            {formAbierto && (
              <form onSubmit={registrar} noValidate className="panel mb-4" aria-label="Registrar consulta">
                <div className="row">
                  <div className="col-md-4"><CampoFormulario label="Fecha de la consulta" name="fecha" type="date" value={form.valores.fecha} max={isoFecha()} onChange={form.alCambiar} onBlur={form.alSalir} error={form.errores.fecha} obligatorio /></div>
                  <div className="col-md-4"><CampoFormulario label="Peso (kg)" name="pesoKg" inputMode="decimal" value={form.valores.pesoKg} onChange={form.alCambiar} onBlur={form.alSalir} error={form.errores.pesoKg} ayuda="Opcional" /></div>
                  <div className="col-md-4"><CampoFormulario label="Próximo control" name="proximoControl" type="date" value={form.valores.proximoControl} onChange={form.alCambiar} onBlur={form.alSalir} error={form.errores.proximoControl} ayuda="Opcional" /></div>
                  <div className="col-12"><CampoFormulario label="Diagnóstico" name="diagnostico" as="textarea" value={form.valores.diagnostico} onChange={form.alCambiar} onBlur={form.alSalir} error={form.errores.diagnostico} obligatorio /></div>
                  <div className="col-12"><CampoFormulario label="Tratamiento" name="tratamiento" as="textarea" value={form.valores.tratamiento} onChange={form.alCambiar} onBlur={form.alSalir} error={form.errores.tratamiento} ayuda="Opcional" /></div>
                </div>

                <h3 className="h5">Vacunas aplicadas</h3>
                {vacunas.map((fila, i) => (
                  <div key={i} className="row align-items-start">
                    <div className="col-md-5"><CampoFormulario label="Vacuna" name={`vac-${i}-nombre`} as="select" value={fila.nombreVacuna} onChange={(e) => cambiarFila(vacunas, setVacunas, i, 'nombreVacuna', e.target.value)} error={erroresFilas.vacunas[i]?.nombreVacuna} opciones={opcionesVacuna} /></div>
                    <div className="col-md-3"><CampoFormulario label="Aplicada el" name={`vac-${i}-fecha`} type="date" value={fila.fechaAplicacion} max={isoFecha()} onChange={(e) => cambiarFila(vacunas, setVacunas, i, 'fechaAplicacion', e.target.value)} error={erroresFilas.vacunas[i]?.fechaAplicacion} /></div>
                    <div className="col-md-3"><CampoFormulario label="Próxima dosis" name={`vac-${i}-proxima`} type="date" value={fila.proximaDosis} onChange={(e) => cambiarFila(vacunas, setVacunas, i, 'proximaDosis', e.target.value)} error={erroresFilas.vacunas[i]?.proximaDosis} /></div>
                    <div className="col-md-1 pt-md-4"><button type="button" className="btn btn-outline-danger btn-sm mt-md-2" onClick={() => quitarFila(vacunas, setVacunas, i)} aria-label={`Quitar vacuna ${i + 1}`}>Quitar</button></div>
                  </div>
                ))}
                <button type="button" className="btn btn-outline-primary btn-sm mb-3" onClick={() => setVacunas([...vacunas, { nombreVacuna: '', fechaAplicacion: form.valores.fecha, proximaDosis: '' }])}>Agregar vacuna</button>

                <h3 className="h5">Medicamentos recetados</h3>
                {recetas.map((fila, i) => (
                  <div key={i} className="row align-items-start">
                    <div className="col-md-5"><CampoFormulario label="Medicamento" name={`rec-${i}-med`} as="select" value={fila.medicamentoId} onChange={(e) => cambiarFila(recetas, setRecetas, i, 'medicamentoId', e.target.value)} error={erroresFilas.recetas[i]?.medicamentoId} opciones={opcionesMedicamento} /></div>
                    <div className="col-md-6"><CampoFormulario label="Indicaciones" name={`rec-${i}-ind`} value={fila.indicaciones} onChange={(e) => cambiarFila(recetas, setRecetas, i, 'indicaciones', e.target.value)} error={erroresFilas.recetas[i]?.indicaciones} /></div>
                    <div className="col-md-1 pt-md-4"><button type="button" className="btn btn-outline-danger btn-sm mt-md-2" onClick={() => quitarFila(recetas, setRecetas, i)} aria-label={`Quitar medicamento ${i + 1}`}>Quitar</button></div>
                  </div>
                ))}
                <button type="button" className="btn btn-outline-primary btn-sm mb-3" onClick={() => setRecetas([...recetas, { medicamentoId: '', indicaciones: '' }])}>Agregar medicamento</button>

                <div className="acciones">
                  <button type="submit" className="btn btn-primary" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar consulta'}</button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setFormAbierto(false)}>Cancelar</button>
                </div>
              </form>
            )}

            {consultas.length === 0 ? (
              <div className="vacio"><strong>Aún no hay consultas</strong>El diagnóstico y el tratamiento de cada atención aparecerán aquí.</div>
            ) : (
              <ol className="linea-tiempo">
                {consultas.map((c) => (
                  <li key={c.id} className="consulta">
                    <h3>{fechaLarga(c.fecha)}</h3>
                    {editandoId === c.id ? (
                      <form onSubmit={guardarEdicion} noValidate aria-label="Editar consulta">
                        <CampoFormulario label="Diagnóstico" name="diagnostico" as="textarea" value={edicion.valores.diagnostico} onChange={edicion.alCambiar} onBlur={edicion.alSalir} error={edicion.errores.diagnostico} obligatorio />
                        <CampoFormulario label="Tratamiento" name="tratamiento" as="textarea" value={edicion.valores.tratamiento} onChange={edicion.alCambiar} />
                        <CampoFormulario label="Próximo control" name="proximoControl" type="date" value={edicion.valores.proximoControl} onChange={edicion.alCambiar} onBlur={edicion.alSalir} error={edicion.errores.proximoControl} />
                        <div className="acciones">
                          <button type="submit" className="btn btn-primary btn-sm" disabled={enviando}>Guardar cambios</button>
                          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setEditandoId(null)}>Cancelar</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <p className="mb-1"><strong>Diagnóstico:</strong> {c.diagnostico}</p>
                        {c.tratamiento && <p className="mb-1"><strong>Tratamiento:</strong> {c.tratamiento}</p>}
                        <p className="texto-suave mb-1">
                          {c.pesoKg != null && <>Peso {c.pesoKg} kg. </>}
                          {c.proximoControl && <>Próximo control: {fechaCorta(c.proximoControl)}.</>}
                        </p>
                        {c.vacunaciones.length > 0 && <p className="mb-1"><strong>Vacunas:</strong> {c.vacunaciones.map((v) => v.nombreVacuna).join(', ')}</p>}
                        {c.recetas.length > 0 && (
                          <div className="receta">
                            <strong>Receta</strong>
                            <ul className="mb-0">
                              {c.recetas.map((r) => {
                                const m = medicamentoPorId[r.medicamentoId]
                                return <li key={r.id}>{m ? `${m.nombreComercial} (${m.presentacion})` : `Medicamento #${r.medicamentoId}`}: {r.indicaciones}</li>
                              })}
                            </ul>
                          </div>
                        )}
                        {esPersonal && <button type="button" className="btn btn-outline-primary btn-sm mt-2" onClick={() => abrirEdicion(c)}>Editar</button>}
                      </>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </article>
    </main>
  )
}
