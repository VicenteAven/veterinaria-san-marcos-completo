import { useEffect, useMemo, useState } from 'react'
import { catalogo } from '../services/api'

/** Carga servicios y medicamentos una vez y entrega mapas id → objeto, para mostrar nombres en citas y fichas. */
export function useReferencias() {
  const [servicios, setServicios] = useState([])
  const [medicamentos, setMedicamentos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vivo = true
    Promise.all([catalogo.servicios({ incluirInactivos: true }), catalogo.medicamentos({ incluirInactivos: true })])
      .then(([s, m]) => {
        if (vivo) {
          setServicios(s)
          setMedicamentos(m)
        }
      })
      .catch(() => {})
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [])

  const servicioPorId = useMemo(() => Object.fromEntries(servicios.map((s) => [s.id, s])), [servicios])
  const medicamentoPorId = useMemo(() => Object.fromEntries(medicamentos.map((m) => [m.id, m])), [medicamentos])
  return { servicios, medicamentos, servicioPorId, medicamentoPorId, cargando }
}
