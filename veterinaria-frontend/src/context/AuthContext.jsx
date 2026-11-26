import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { auth, sesion } from '../services/api'

const AuthContext = createContext(null)

/** guarda quién inició sesión y entrega login, registro y logout a toda la app. */
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(Boolean(sesion.token()))

  const salir = useCallback(() => {
    sesion.borrar()
    setUsuario(null)
  }, [])

  // Al abrir la app, si hay un token guardado se comprueba que siga siendo válido.
  useEffect(() => {
    if (!sesion.token()) return undefined
    let vivo = true
    auth
      .yo()
      .then((u) => vivo && setUsuario(u))
      .catch(() => sesion.borrar())
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [])

  useEffect(() => {
    window.addEventListener('vet:sesion-expirada', salir)
    return () => window.removeEventListener('vet:sesion-expirada', salir)
  }, [salir])

  const iniciar = useCallback(async (respuesta) => {
    sesion.guardar(respuesta.token)
    setUsuario(respuesta.usuario)
    return respuesta.usuario
  }, [])

  const valor = useMemo(
    () => ({
      usuario,
      cargando,
      iniciarSesion: async (email, password) => iniciar(await auth.login(email, password)),
      registrarse: async (datos) => iniciar(await auth.registrar(datos)),
      salir,
      esRol: (...roles) => Boolean(usuario) && roles.includes(usuario.rol),
      esPersonal: Boolean(usuario) && (usuario.rol === 'ADMIN' || usuario.rol === 'RECEPCIONISTA'),
    }),
    [usuario, cargando, iniciar, salir],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
