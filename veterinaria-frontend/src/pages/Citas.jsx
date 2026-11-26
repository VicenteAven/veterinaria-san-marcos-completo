import { useCallback, useEffect, useMemo, useState } from 'react'
import CampoFormulario from '../components/CampoFormulario'
import InsigniaEstado from '../components/InsigniaEstado'
import { useAuth } from '../context/AuthContext'
import { useDisponibilidad } from '../hooks/useDisponibilidad'
import { useForm } from '../hooks/useForm'
import { useReferencias } from '../hooks/useReferencias'
import { citas as api, leerError, mascotas as apiMascotas, usuarios } from '../services/api'
import { AGENDA } from '../data/clinica'
import { ESTADOS_CITA, fechaHora, hoyMas } from '../utils/format'
import { esquemas } from '../utils/validators'

const CITA_VACIA = { mascotaId: '', servicioId: '', fecha: '', hora: '', motivo: '' }
const REAGENDAR_VACIA = { fecha: '', hora: '', observacion: '' }
const VIGENTES = ['SOLICITADA', 'CONFIRMADA', 'REPROGRAMADA']

const opcionesHora = (bloques) =>
  bloques.map((b) => ({ value: b.hora, label: b.cuposLibres > 0 ? `${b.hora} · ${b.cuposLibres} ${b.cuposLibres === 1 ? 'cupo' : 'cupos'}` : `${b.hora} · completo`, disabled: b.cuposLibres === 0 }))

/** flujo de citas. El dueño solicita; la recepción confirma o propone otro horario; el dueño acepta. */
export default function Citas() {
  const { esPersonal } = useAuth()
  const { servicios, servicioPorId } = useReferencias()
  const [lista, setLista] = useState([])
  const [mascotas, setMascotas] = useState([])
  const [duenos, setDuenos] = useState([])
  const [duenoSel, setDuenoSel] = useState('')
  const [filtro, setFiltro] = useState('')
  const [formAbierto, setFormAbierto] = useState(false)
  const [reagendando, setReagendando] = useState(null)
  const [cancelando, setCancelando] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)

  const serviciosActivos = useMemo(() => servicios.filter((s) => s.activo), [servicios])
  const extra = useMemo(() => ({ mascotas, servicios: serviciosActivos }), [mascotas, serviciosActivos])
  const form = useForm(CITA_VACIA, esquemas.cita, extra)
  const formRe = useForm(REAGENDAR_VACIA, esquemas.reagendar)
  const dispo = useDisponibilidad(form.valores.fecha)
  const dispoRe = useDisponibilidad(formRe.valores.fecha)

  const cargar = useCallback(async () => {
    try {
      const [c, m, d] = await Promise.all([api.listar(), apiMascotas.listar(), esPersonal ? usuarios.duenos() : Promise.resolve([])])
      setLista(c)
      setMascotas(m)
      setDuenos(d)
      setError('')
    } catch (e) {
      setError(leerError(e).mensaje)
    } finally {
      setCargando(false)
    }
  }, [esPersonal])

  useEffect(() => {
    cargar()
  }, [cargar])

  const nombreDueno = useMemo(() => Object.fromEntries(duenos.map((d) => [d.id, d.nombre])), [duenos])
  const mascotaElegida = mascotas.find((m) => String(m.id) === String(form.valores.mascotaId))
  const mascotasDelFormulario = esPersonal ? mascotas.filter((m) => String(m.duenoId) === String(duenoSel)) : mascotas
  const serviciosDisponibles = mascotaElegida ? serviciosActivos.filter((s) => s.especies.includes(mascotaElegida.especie)) : serviciosActivos

  const ordenadas = useMemo(() => {
    const filtradas = lista.filter((c) => !filtro || c.estado === filtro)
    const vigentes = filtradas.filter((c) => VIGENTES.includes(c.estado)).sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))
    const otras = filtradas.filter((c) => !VIGENTES.includes(c.estado)).sort((a, b) => b.fechaHora.localeCompare(a.fechaHora))
    return [...vigentes, ...otras]
  }, [lista, filtro])

  const abrirFormulario = () => {
    form.reiniciar(CITA_VACIA)
    setDuenoSel('')
    setFormAbierto(true)
    setReagendando(null)
    setMensaje('')
  }

  const solicitar = async (e) => {
    e.preventDefault()
    setError('')
    if (esPersonal && !duenoSel) {
      setError('Primero selecciona al dueño de la mascota.')
      return
    }
    if (!form.validarTodo()) return
    const { mascotaId, servicioId, fecha, hora, motivo } = form.valores
    setEnviando(true)
    try {
      await api.crear({ mascotaId: Number(mascotaId), servicioId: Number(servicioId), fechaHora: `${fecha}T${hora}:00`, motivo: motivo.trim() })
      setMensaje(esPersonal ? 'La cita quedó agendada y confirmada.' : 'Enviamos tu solicitud. La clínica la confirmará o te propondrá otro horario.')
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

  const ejecutar = async (llamada, exito) => {
    setError('')
    setMensaje('')
    try {
      await llamada()
      setMensaje(exito)
      setCancelando(null)
      await cargar()
    } catch (err) {
      setError(leerError(err).mensaje)
      setCancelando(null)
    }
  }

  const abrirReagendar = (c) => {
    formRe.reiniciar(REAGENDAR_VACIA)
    setReagendando(c)
    setFormAbierto(false)
    setMensaje('')
  }

  const proponer = async (e) => {
    e.preventDefault()
    setError('')
    if (!formRe.validarTodo()) return
    const { fecha, hora, observacion } = formRe.valores
    setEnviando(true)
    try {
      await api.reagendar(reagendando.id, { fechaPropuesta: `${fecha}T${hora}:00`, observacion: observacion.trim() || null })
      setMensaje('Enviamos la propuesta de nuevo horario al dueño.')
      setReagendando(null)
      await cargar()
    } catch (err) {
      const { mensaje: m, campos } = leerError(err)
      formRe.ponerErrores(campos)
      setError(m)
    } finally {
      setEnviando(false)
    }
  }

  const nombreServicio = (id) => servicioPorId[id]?.nombre || `Servicio #${id}`

  return (
    <main className="container pagina">
      <div className="encabezado">
        <div>
          <h1>Citas</h1>
          <p>{esPersonal ? 'Confirma solicitudes, propone otro horario o agenda por teléfono.' : 'Pide una hora y sigue el estado de tus citas.'}</p>
        </div>
        {!formAbierto && <button type="button" className="btn btn-calendula" onClick={abrirFormulario}>{esPersonal ? 'Agendar cita' : 'Pedir una hora'}</button>}
      </div>

      {mensaje && <div className="alert alert-success" role="status">{mensaje}</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {formAbierto && (
        <section className="panel mb-3" aria-labelledby="titulo-form-cita">
          <div className="panel-titulo"><h2 id="titulo-form-cita">{esPersonal ? 'Agendar cita' : 'Solicitar cita'}</h2></div>
          {mascotas.length === 0 && !esPersonal ? (
            <div className="vacio"><strong>Primero registra a tu mascota</strong>Ve a «Mis mascotas» y agrégala para poder pedir una hora.</div>
          ) : (
            <form onSubmit={solicitar} noValidate>
              <div className="row">
                {esPersonal && (
                  <div className="col-md-6">
                    <CampoFormulario label="Dueño" name="duenoSel" as="select" value={duenoSel} onChange={(e) => { setDuenoSel(e.target.value); form.cambiarVarios({ mascotaId: '', servicioId: '' }) }}
                      opciones={duenos.map((d) => ({ value: d.id, label: d.nombre }))} placeholder="Selecciona al dueño" obligatorio />
                  </div>
                )}
                <div className="col-md-6">
                  <CampoFormulario label="Mascota" name="mascotaId" as="select" value={form.valores.mascotaId}
                    onChange={(e) => form.cambiarVarios({ mascotaId: e.target.value, servicioId: '' })} onBlur={form.alSalir} error={form.errores.mascotaId}
                    opciones={mascotasDelFormulario.map((m) => ({ value: m.id, label: `${m.nombre} (${m.especie})` }))} obligatorio />
                </div>
                <div className="col-md-6">
                  <CampoFormulario label="Servicio" name="servicioId" as="select" value={form.valores.servicioId} onChange={form.alCambiar} onBlur={form.alSalir} error={form.errores.servicioId}
                    opciones={serviciosDisponibles.map((s) => ({ value: s.id, label: s.nombre }))}
                    ayuda={mascotaElegida ? `Mostramos los servicios para ${mascotaElegida.especie.toLowerCase()}s.` : 'Elige primero la mascota para ver los servicios que le corresponden.'} obligatorio />
                </div>
                <div className="col-md-3">
                  <CampoFormulario label="Fecha" name="fecha" type="date" value={form.valores.fecha} min={hoyMas(0)} max={hoyMas(AGENDA.diasMaximos)}
                    onChange={(e) => form.cambiarVarios({ fecha: e.target.value, hora: '' })} onBlur={form.alSalir} error={form.errores.fecha} obligatorio />
                </div>
                <div className="col-md-3">
                  <CampoFormulario label="Hora" name="hora" as="select" value={form.valores.hora} onChange={form.alCambiar} onBlur={form.alSalir} error={form.errores.hora}
                    opciones={opcionesHora(dispo.bloques)} placeholder={dispo.cargando ? 'Buscando horarios…' : form.valores.fecha ? 'Selecciona una hora' : 'Elige primero la fecha'}
                    ayuda={dispo.error || (form.valores.fecha && !dispo.cargando && dispo.bloques.length === 0 ? 'Ese día la clínica no atiende.' : undefined)} obligatorio />
                </div>
                <div className="col-12">
                  <CampoFormulario label="Motivo de la visita" name="motivo" as="textarea" value={form.valores.motivo} onChange={form.alCambiar} onBlur={form.alSalir} error={form.errores.motivo}
                    ayuda={`${form.valores.motivo.trim().length}/300 caracteres`} obligatorio />
                </div>
              </div>
              <div className="acciones">
                <button type="submit" className="btn btn-primary" disabled={enviando}>{enviando ? 'Enviando…' : esPersonal ? 'Agendar cita' : 'Enviar solicitud'}</button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setFormAbierto(false)}>Cancelar</button>
              </div>
            </form>
          )}
        </section>
      )}

      {reagendando && (
        <section className="panel mb-3" aria-labelledby="titulo-form-reagendar">
          <div className="panel-titulo"><h2 id="titulo-form-reagendar">Proponer otro horario</h2></div>
          <p className="texto-suave">{reagendando.mascotaNombre} · {nombreServicio(reagendando.servicioId)} · hoy figura para {fechaHora(reagendando.fechaHora)}</p>
          <form onSubmit={proponer} noValidate>
            <div className="row">
              <div className="col-md-4">
                <CampoFormulario label="Nueva fecha" name="fecha" type="date" value={formRe.valores.fecha} min={hoyMas(0)} max={hoyMas(AGENDA.diasMaximos)}
                  onChange={(e) => formRe.cambiarVarios({ fecha: e.target.value, hora: '' })} onBlur={formRe.alSalir} error={formRe.errores.fecha} obligatorio />
              </div>
              <div className="col-md-4">
                <CampoFormulario label="Nueva hora" name="hora" as="select" value={formRe.valores.hora} onChange={formRe.alCambiar} onBlur={formRe.alSalir} error={formRe.errores.hora}
                  opciones={opcionesHora(dispoRe.bloques)} placeholder={formRe.valores.fecha ? 'Selecciona una hora' : 'Elige primero la fecha'} obligatorio />
              </div>
              <div className="col-md-4">
                <CampoFormulario label="Mensaje para el dueño" name="observacion" value={formRe.valores.observacion} onChange={formRe.alCambiar} onBlur={formRe.alSalir} error={formRe.errores.observacion} ayuda="Opcional" />
              </div>
            </div>
            <div className="acciones">
              <button type="submit" className="btn btn-primary" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar propuesta'}</button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setReagendando(null)}>Cancelar</button>
            </div>
          </form>
        </section>
      )}

      <section className="panel" aria-labelledby="titulo-lista-citas">
        <div className="panel-titulo">
          <h2 id="titulo-lista-citas">{esPersonal ? 'Todas las citas' : 'Tus citas'}</h2>
          <div style={{ minWidth: 220 }}>
            <label className="visually-hidden" htmlFor="filtro-estado">Filtrar por estado</label>
            <select id="filtro-estado" className="form-select" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
              <option value="">Todos los estados</option>
              {Object.entries(ESTADOS_CITA).map(([k, v]) => <option key={k} value={k}>{v.texto}</option>)}
            </select>
          </div>
        </div>

        {cargando ? (
          <div className="pagina-cargando" role="status"><span className="spinner-border text-primary" aria-hidden="true" /><span className="ms-2">Cargando…</span></div>
        ) : ordenadas.length === 0 ? (
          <div className="vacio"><strong>No hay citas para mostrar</strong>{filtro ? 'Prueba con otro estado.' : 'Cuando haya citas, las verás aquí.'}</div>
        ) : (
          <table className="tabla">
            <thead>
              <tr><th>Fecha y hora</th><th>Mascota</th><th>Servicio</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {ordenadas.map((c) => (
                <tr key={c.id}>
                  <td data-label="Fecha y hora"><strong>{fechaHora(c.fechaHora)}</strong></td>
                  <td data-label="Mascota">{c.mascotaNombre}{esPersonal && nombreDueno[c.duenoId] && <><br /><span className="texto-suave">{nombreDueno[c.duenoId]}</span></>}</td>
                  <td data-label="Servicio">{nombreServicio(c.servicioId)}<br /><span className="texto-suave">{c.motivo}</span></td>
                  <td data-label="Estado">
                    <InsigniaEstado estado={c.estado} />
                    {c.estado === 'REPROGRAMADA' && c.fechaPropuesta && (
                      <div className="propuesta"><strong>Propuesta:</strong> {fechaHora(c.fechaPropuesta)}{c.observacion && <><br />{c.observacion}</>}</div>
                    )}
                    {c.estado === 'CANCELADA' && c.observacion && <div className="texto-suave small mt-1">{c.observacion}</div>}
                  </td>
                  <td className="acciones" data-label="Acciones">
                    {cancelando === c.id ? (
                      <>
                        <span className="me-1">¿Cancelar esta cita?</span>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => ejecutar(() => api.cancelar(c.id), 'La cita fue cancelada.')}>Sí, cancelar</button>
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setCancelando(null)}>No</button>
                      </>
                    ) : (
                      <>
                        {!esPersonal && c.estado === 'REPROGRAMADA' && (
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => ejecutar(() => api.aceptarPropuesta(c.id), 'Aceptaste el nuevo horario. La cita quedó confirmada.')}>Aceptar nuevo horario</button>
                        )}
                        {esPersonal && c.estado === 'SOLICITADA' && (
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => ejecutar(() => api.confirmar(c.id), 'La cita fue confirmada.')}>Confirmar</button>
                        )}
                        {esPersonal && c.estado === 'CONFIRMADA' && (
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => ejecutar(() => api.completar(c.id), 'La cita quedó marcada como atendida.')}>Marcar atendida</button>
                        )}
                        {esPersonal && ['SOLICITADA', 'CONFIRMADA'].includes(c.estado) && (
                          <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => abrirReagendar(c)}>Proponer otro horario</button>
                        )}
                        {VIGENTES.includes(c.estado) && (
                          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setCancelando(c.id)}>Cancelar</button>
                        )}
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
