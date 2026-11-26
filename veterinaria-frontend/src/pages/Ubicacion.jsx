import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { CLINICA } from '../data/clinica'

const distanciaKm = (a, b) => {
  const rad = (g) => (g * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

/** mapa interactivo (Leaflet + OpenStreetMap) con la clínica y cómo llegar desde donde estás. */
export default function Ubicacion() {
  const contenedor = useRef(null)
  const mapa = useRef(null)
  const capaYo = useRef(null)
  const [estado, setEstado] = useState({ cargando: false, error: '', km: null, origen: null })

  useEffect(() => {
    if (!contenedor.current || mapa.current) return undefined
    const m = L.map(contenedor.current, { scrollWheelZoom: false }).setView([CLINICA.lat, CLINICA.lng], 16)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; Colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m)
    const pin = L.divIcon({ className: '', html: '<div class="pin"></div>', iconSize: [34, 34], iconAnchor: [17, 34] })
    L.marker([CLINICA.lat, CLINICA.lng], { icon: pin, title: CLINICA.nombre }).addTo(m).bindPopup(`<strong>${CLINICA.nombre}</strong><br>${CLINICA.direccion}`).openPopup()
    mapa.current = m
    return () => {
      m.remove()
      mapa.current = null
    }
  }, [])

  const destino = `${CLINICA.lat},${CLINICA.lng}`
  const enlaceGoogle = (origen) =>
    `https://www.google.com/maps/dir/?api=1&destination=${destino}&travelmode=driving${origen ? `&origin=${origen.lat},${origen.lng}` : ''}`

  const usarMiUbicacion = () => {
    if (!('geolocation' in navigator)) {
      setEstado({ cargando: false, error: 'Tu navegador no permite obtener la ubicación. Usa el enlace de indicaciones.', km: null, origen: null })
      return
    }
    setEstado({ cargando: true, error: '', km: null, origen: null })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const origen = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        const m = mapa.current
        if (m) {
          if (capaYo.current) capaYo.current.remove()
          const yo = L.marker([origen.lat, origen.lng], { icon: L.divIcon({ className: '', html: '<div class="pin-yo"></div>', iconSize: [18, 18] }), title: 'Tu ubicación' })
          const linea = L.polyline([[origen.lat, origen.lng], [CLINICA.lat, CLINICA.lng]], { color: '#1f5c4a', weight: 4, dashArray: '8 8' })
          capaYo.current = L.layerGroup([yo, linea]).addTo(m)
          m.fitBounds([[origen.lat, origen.lng], [CLINICA.lat, CLINICA.lng]], { padding: [40, 40] })
        }
        setEstado({ cargando: false, error: '', km: distanciaKm(origen, CLINICA), origen })
      },
      (err) => {
        const mensaje = err.code === 1 ? 'No diste permiso para usar tu ubicación. Puedes abrir las indicaciones igualmente.' : 'No pudimos obtener tu ubicación. Intenta de nuevo o abre las indicaciones.'
        setEstado({ cargando: false, error: mensaje, km: null, origen: null })
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <main className="container pagina">
      <div className="encabezado">
        <div>
          <h1>Cómo llegar</h1>
          <p>{CLINICA.nombre} · {CLINICA.direccion}</p>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <div ref={contenedor} className="mapa" role="region" aria-label={`Mapa con la ubicación de ${CLINICA.nombre}`} />
        </div>
        <div className="col-lg-4">
          <section className="panel">
            <h2 className="h4">Visítanos</h2>
            <dl className="mb-3">
              <dt>Dirección</dt><dd>{CLINICA.direccion}</dd>
              <dt>Horario</dt><dd>{CLINICA.horario}</dd>
              <dt>Región</dt><dd className="mb-0">{CLINICA.region}</dd>
            </dl>
            <div className="d-grid gap-2">
              <button type="button" className="btn btn-primary" onClick={usarMiUbicacion} disabled={estado.cargando}>
                {estado.cargando ? 'Buscando tu ubicación…' : 'Ver ruta desde mi ubicación'}
              </button>
              <a className="btn btn-outline-primary" href={enlaceGoogle(estado.origen)} target="_blank" rel="noopener noreferrer">
                Abrir indicaciones en Google Maps
              </a>
            </div>
            {estado.km !== null && (
              <p className="mt-3 mb-0" role="status">Estás a unos <strong>{estado.km < 1 ? `${Math.round(estado.km * 1000)} m` : `${estado.km.toFixed(1)} km`}</strong> en línea recta.</p>
            )}
            {estado.error && <div className="alert alert-warning mt-3 mb-0" role="alert">{estado.error}</div>}
          </section>
        </div>
      </div>
    </main>
  )
}
