import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import InsigniaEstado from '../components/InsigniaEstado'
import { useAuth } from '../context/AuthContext'
import { useReferencias } from '../hooks/useReferencias'
import { citas as apiCitas, leerError, mascotas as apiMascotas } from '../services/api'
import { diasHasta, fechaHora, fechaLarga, isoFecha } from '../utils/format'

/** pantalla de inicio. Cambia según el rol: el dueño ve lo suyo; el personal ve la agenda. */
export default function Inicio() {
  const { usuario, esPersonal } = useAuth()
  const { servicioPorId } = useReferencias()
  const [citas, setCitas] = useState([])
  const [vacunas, setVacunas] = useState([])
  const [mascotas, setMascotas] = useState([])
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vivo = true
    Promise.all([apiCitas.listar(), apiMascotas.vacunasProximas(30), apiMascotas.listar()])
      .then(([c, v, m]) => {
        if (!vivo) return
        setCitas(c)
        setVacunas(v)
        setMascotas(m)
      })
      .catch((e) => vivo && setError(leerError(e).mensaje))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [])

  const hoy = isoFecha()
  const vigentes = citas.filter((c) => ['SOLICITADA', 'CONFIRMADA', 'REPROGRAMADA'].includes(c.estado))
  const proximas = [...vigentes].filter((c) => c.fechaHora.slice(0, 10) >= hoy).sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))
  const porConfirmar = citas.filter((c) => c.estado === 'SOLICITADA')
  const deHoy = citas.filter((c) => c.estado === 'CONFIRMADA' && c.fechaHora.slice(0, 10) === hoy).sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))
  const conPropuesta = citas.filter((c) => c.estado === 'REPROGRAMADA')
  const nombreServicio = (id) => servicioPorId[id]?.nombre || 'Servicio'
  const primerNombre = usuario.nombre.split(' ')[0]

  if (cargando) {
    return <div className="pagina-cargando" role="status"><span className="spinner-border text-primary" aria-hidden="true" /><span className="ms-2">Cargando…</span></div>
  }

  return (
    <main className="container pagina">
      <div className="encabezado">
        <div>
          <h1>Hola, {primerNombre}</h1>
          <p>{fechaLarga(hoy)}</p>
        </div>
        <div className="acciones">
          <Link to="/citas" className="btn btn-calendula">{esPersonal ? 'Agendar o gestionar citas' : 'Pedir una hora'}</Link>
        </div>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <div className="cifras">
        {esPersonal ? (
          <>
            <div className={`cifra ${porConfirmar.length ? 'alerta' : ''}`}><strong>{porConfirmar.length}</strong><span>citas por confirmar</span></div>
            <div className="cifra"><strong>{deHoy.length}</strong><span>citas confirmadas hoy</span></div>
            <div className="cifra"><strong>{vacunas.length}</strong><span>vacunas por vencer (30 días)</span></div>
            <div className="cifra"><strong>{mascotas.length}</strong><span>pacientes activos</span></div>
          </>
        ) : (
          <>
            <div className="cifra"><strong>{mascotas.length}</strong><span>{mascotas.length === 1 ? 'mascota registrada' : 'mascotas registradas'}</span></div>
            <div className="cifra"><strong>{proximas.length}</strong><span>{proximas.length === 1 ? 'cita vigente' : 'citas vigentes'}</span></div>
            <div className={`cifra ${vacunas.length ? 'alerta' : ''}`}><strong>{vacunas.length}</strong><span>vacunas por vencer</span></div>
          </>
        )}
      </div>

      {!esPersonal && conPropuesta.length > 0 && (
        <div className="alert alert-info" role="status">
          La clínica te propuso un nuevo horario para {conPropuesta.length === 1 ? 'una cita' : `${conPropuesta.length} citas`}.{' '}
          <Link to="/citas">Revísalo y acepta o cancela</Link>.
        </div>
      )}

      <div className="row g-3">
        <div className="col-lg-7">
          <section className="panel h-100">
            <div className="panel-titulo">
              <h2>{esPersonal ? 'Agenda de hoy' : 'Tus próximas citas'}</h2>
              <Link to="/citas">Ver todas</Link>
            </div>
            {(esPersonal ? deHoy : proximas.slice(0, 5)).length === 0 ? (
              <div className="vacio">
                <strong>{esPersonal ? 'No hay citas confirmadas para hoy' : 'No tienes citas vigentes'}</strong>
                {esPersonal ? 'Las citas confirmadas del día aparecerán aquí.' : 'Pide una hora y te avisaremos cuando la clínica la confirme.'}
              </div>
            ) : (
              <ul className="lista-simple">
                {(esPersonal ? deHoy : proximas.slice(0, 5)).map((c) => (
                  <li key={c.id}>
                    <span>
                      <strong>{c.mascotaNombre}</strong> · {nombreServicio(c.servicioId)}
                      <br /><span className="texto-suave">{fechaHora(c.fechaHora)}</span>
                    </span>
                    <InsigniaEstado estado={c.estado} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="col-lg-5">
          <section className="panel h-100">
            <div className="panel-titulo"><h2>Vacunas por vencer</h2></div>
            {vacunas.length === 0 ? (
              <div className="vacio"><strong>Todo al día</strong>No hay vacunas vencidas ni por vencer en los próximos 30 días.</div>
            ) : (
              vacunas.slice(0, 6).map((v) => {
                const dias = diasHasta(v.proximaDosis)
                return (
                  <div key={`${v.mascotaId}-${v.nombreVacuna}`} className={`aviso-vacuna ${v.vencida ? 'vencida' : ''}`}>
                    <strong>{v.mascotaNombre}</strong> · {v.nombreVacuna}
                    <br />
                    <span>{v.vencida ? `Vencida hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}` : dias === 0 ? 'Vence hoy' : `Vence en ${dias} ${dias === 1 ? 'día' : 'días'}`} ({fechaHora(v.proximaDosis).split(',')[0]})</span>{' '}
                    <Link to={`/mascotas/${v.mascotaId}/ficha`}>Ver ficha</Link>
                  </div>
                )
              })
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
