import { useEffect, useRef, useState } from 'react'
import CampoFormulario from '../../components/CampoFormulario'
import { useForm } from '../../hooks/useForm'
import { useReferencias } from '../../hooks/useReferencias'
import { leerError, reportes } from '../../services/api'
import { ESTADOS_CITA, fechaCorta, hoyMas } from '../../utils/format'
import { esquemas } from '../../utils/validators'

/** reportes de atenciones por período (solo personal de la clínica). */
export default function Reportes() {
  const { servicioPorId } = useReferencias()
  const [reporte, setReporte] = useState(null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const form = useForm({ desde: hoyMas(-30), hasta: hoyMas(0) }, esquemas.reporte)
  const inicial = useRef(true)

  const consultar = async () => {
    setError('')
    if (!form.validarTodo()) return
    setCargando(true)
    try {
      setReporte(await reportes.atenciones(form.valores.desde, form.valores.hasta))
    } catch (e) {
      setError(leerError(e).mensaje)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    if (inicial.current) {
      inicial.current = false
      consultar()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const maxEstado = reporte ? Math.max(1, ...Object.values(reporte.citasPorEstado)) : 1
  const maxServicio = reporte?.serviciosMasSolicitados.length ? Math.max(1, ...reporte.serviciosMasSolicitados.map((s) => s.cantidad)) : 1

  return (
    <main className="container pagina">
      <div className="encabezado">
        <div>
          <h1>Reportes de atención</h1>
          <p>Citas, consultas y pacientes nuevos por período, sin revisar archivadores.</p>
        </div>
      </div>

      <section className="panel mb-3" aria-label="Período">
        <form onSubmit={(e) => { e.preventDefault(); consultar() }} noValidate>
          <div className="row align-items-start">
            <div className="col-md-4"><CampoFormulario label="Desde" name="desde" type="date" value={form.valores.desde} onChange={form.alCambiar} onBlur={form.alSalir} error={form.errores.desde} max={hoyMas(0)} obligatorio /></div>
            <div className="col-md-4"><CampoFormulario label="Hasta" name="hasta" type="date" value={form.valores.hasta} onChange={form.alCambiar} onBlur={form.alSalir} error={form.errores.hasta} obligatorio /></div>
            <div className="col-md-4 pt-md-4"><button type="submit" className="btn btn-primary mt-md-2 w-100" disabled={cargando}>{cargando ? 'Calculando…' : 'Ver reporte'}</button></div>
          </div>
        </form>
      </section>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {reporte && (
        <>
          <p className="texto-suave">Del {fechaCorta(reporte.desde)} al {fechaCorta(reporte.hasta)}</p>
          <div className="cifras">
            <div className="cifra"><strong>{reporte.totalCitas}</strong><span>citas en el período</span></div>
            <div className="cifra"><strong>{reporte.consultasRegistradas}</strong><span>consultas registradas</span></div>
            <div className="cifra"><strong>{reporte.pacientesNuevos}</strong><span>pacientes nuevos</span></div>
          </div>

          <div className="row g-3">
            <div className="col-lg-6">
              <section className="panel h-100">
                <h2 className="h4 mb-3">Citas por estado</h2>
                {Object.keys(reporte.citasPorEstado).length === 0 ? (
                  <div className="vacio"><strong>Sin citas</strong>No hubo citas en este período.</div>
                ) : (
                  <div className="barras">
                    {Object.entries(reporte.citasPorEstado).map(([estado, n]) => (
                      <div key={estado} className="barra-fila">
                        <span>{ESTADOS_CITA[estado]?.texto || estado}</span>
                        <div className="barra-pista" aria-hidden="true"><div className="barra-valor" style={{ width: `${(n / maxEstado) * 100}%` }} /></div>
                        <strong>{n}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
            <div className="col-lg-6">
              <section className="panel h-100">
                <h2 className="h4 mb-3">Servicios más solicitados</h2>
                {reporte.serviciosMasSolicitados.length === 0 ? (
                  <div className="vacio"><strong>Sin datos</strong>No hubo servicios solicitados en este período.</div>
                ) : (
                  <div className="barras">
                    {reporte.serviciosMasSolicitados.map((s) => (
                      <div key={s.servicioId} className="barra-fila">
                        <span>{servicioPorId[s.servicioId]?.nombre || `Servicio #${s.servicioId}`}</span>
                        <div className="barra-pista" aria-hidden="true"><div className="barra-valor" style={{ width: `${(s.cantidad / maxServicio) * 100}%` }} /></div>
                        <strong>{s.cantidad}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
