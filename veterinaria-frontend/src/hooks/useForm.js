import { useRef, useState } from 'react'
import { validar } from '../utils/validators'

/**
 * Estado de un formulario con validación.
 *  - Valida cada campo al salir de él (blur) y, una vez tocado, revalida mientras el usuario corrige.
 *  - validarTodo() valida todo junto antes de enviar y marca los campos como tocados.
 *  - ponerErrores() recibe los errores por campo que devuelve el backend.
 * Los valores viven también en una ref para que varios cambios seguidos no se pisen entre sí.
 */
export function useForm(inicial, esquema, extra = {}) {
  const [valores, setValores] = useState(inicial)
  const [errores, setErrores] = useState({})
  const actual = useRef(inicial)
  const tocados = useRef({})
  const extraRef = useRef(extra)
  extraRef.current = extra

  const revalidarTocados = (nuevos) => {
    const todos = validar(esquema, nuevos, extraRef.current)
    setErrores((prev) => {
      const siguiente = { ...prev }
      for (const campo of Object.keys(esquema)) {
        if (!tocados.current[campo]) continue
        if (todos[campo]) siguiente[campo] = todos[campo]
        else delete siguiente[campo]
      }
      return siguiente
    })
  }

  const cambiarVarios = (cambios) => {
    actual.current = { ...actual.current, ...cambios }
    setValores(actual.current)
    revalidarTocados(actual.current)
  }

  const cambiar = (campo, valor) => cambiarVarios({ [campo]: valor })

  const alCambiar = (e) => {
    const { name, type, checked, value } = e.target
    cambiar(name, type === 'checkbox' ? checked : value)
  }

  const alSalir = (e) => {
    tocados.current = { ...tocados.current, [e.target.name]: true }
    revalidarTocados(actual.current)
  }

  const validarTodo = () => {
    const errs = validar(esquema, actual.current, extraRef.current)
    tocados.current = Object.fromEntries(Object.keys(esquema).map((c) => [c, true]))
    setErrores(errs)
    return Object.keys(errs).length === 0
  }

  const reiniciar = (nuevos = inicial) => {
    actual.current = nuevos
    tocados.current = {}
    setValores(nuevos)
    setErrores({})
  }

  const ponerErrores = (campos) => setErrores((prev) => ({ ...prev, ...campos }))

  return { valores, errores, cambiar, cambiarVarios, alCambiar, alSalir, validarTodo, reiniciar, ponerErrores }
}
