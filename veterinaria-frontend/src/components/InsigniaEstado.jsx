import { ESTADOS_CITA } from '../utils/format'

/** etiqueta con el estado de una cita (color + texto, nunca solo color). */
export default function InsigniaEstado({ estado }) {
  const info = ESTADOS_CITA[estado] || { texto: estado, tono: 'secondary' }
  return <span className={`estado estado-${info.tono}`}>{info.texto}</span>
}
