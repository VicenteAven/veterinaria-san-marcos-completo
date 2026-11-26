import { useEffect, useState } from 'react'
import { citas } from '../services/api'
import { parseFecha } from '../utils/validators'

/** Pide a la API los bloques de 30 minutos (y sus cupos) de una fecha 'YYYY-MM-DD'. */
export function useDisponibilidad(fecha) {
  const [bloques, setBloques] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setBloques([])
    setError('')
    if (!fecha || !parseFecha(fecha)) return undefined
    let vivo = true
    setCargando(true)
    citas
      .disponibilidad(fecha)
      .then((d) => vivo && setBloques(d.bloques))
      .catch(() => vivo && setError('No pudimos consultar los horarios. Intenta de nuevo.'))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [fecha])

  return { bloques, cargando, error }
}
