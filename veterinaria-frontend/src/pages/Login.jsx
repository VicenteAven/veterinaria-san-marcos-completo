import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import CampoFormulario from '../components/CampoFormulario'
import { useAuth } from '../context/AuthContext'
import { useForm } from '../hooks/useForm'
import { leerError } from '../services/api'
import { esquemas } from '../utils/validators'
import { CLINICA } from '../data/clinica'

const INICIAL_LOGIN = { email: '', password: '' }
const INICIAL_REGISTRO = { nombre: '', email: '', telefono: '', password: '', confirmar: '', terminos: false }

/** inicio de sesión y registro público de dueños de mascota. */
export default function Login({ modo }) {
  const esRegistro = modo === 'registro'
  const { usuario, iniciarSesion, registrarse } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const form = useForm(esRegistro ? INICIAL_REGISTRO : INICIAL_LOGIN, esRegistro ? esquemas.registro : esquemas.login)
  const { valores, errores, alCambiar, alSalir } = form

  if (usuario) return <Navigate to="/" replace />

  const enviar = async (e) => {
    e.preventDefault()
    setErrorGeneral('')
    if (!form.validarTodo()) return
    setEnviando(true)
    try {
      if (esRegistro) {
        await registrarse({ nombre: valores.nombre, email: valores.email, telefono: valores.telefono, password: valores.password })
      } else {
        await iniciarSesion(valores.email, valores.password)
      }
      navegar(ubicacion.state?.desde || '/', { replace: true })
    } catch (err) {
      const { mensaje, campos } = leerError(err)
      form.ponerErrores(campos)
      setErrorGeneral(mensaje)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="acceso">
      <section className="acceso-lado" aria-label="Presentación">
        <h1>Cuidamos a quienes no pueden decirnos qué sienten.</h1>
        <p>Pide hora, revisa la libreta de vacunas y el historial de tu mascota desde cualquier dispositivo.</p>
        <div className="acceso-datos">
          <div><strong>Desde {CLINICA.fundada}</strong>en {CLINICA.ciudad}</div>
          <div><strong>Lunes a sábado</strong>de 9:00 a 18:00</div>
        </div>
      </section>

      <section className="acceso-form" aria-label={esRegistro ? 'Crear cuenta' : 'Iniciar sesión'}>
        <div>
          <h2 className="mb-1">{esRegistro ? 'Crea tu cuenta' : 'Iniciar sesión'}</h2>
          <p className="texto-suave mb-4">
            {esRegistro ? 'Para pedir citas y ver la ficha de tus mascotas.' : 'Entra para ver tus citas y mascotas.'}
          </p>

          {errorGeneral && <div className="alert alert-danger" role="alert">{errorGeneral}</div>}

          <form onSubmit={enviar} noValidate>
            {esRegistro && (
              <CampoFormulario label="Nombre completo" name="nombre" value={valores.nombre} onChange={alCambiar} onBlur={alSalir} error={errores.nombre} autoComplete="name" obligatorio />
            )}
            <CampoFormulario label="Correo electrónico" name="email" type="email" value={valores.email} onChange={alCambiar} onBlur={alSalir} error={errores.email} autoComplete="email" obligatorio />
            {esRegistro && (
              <CampoFormulario label="Celular" name="telefono" type="tel" value={valores.telefono} onChange={alCambiar} onBlur={alSalir} error={errores.telefono} ayuda="Opcional. Ej: +56912345678" autoComplete="tel" />
            )}
            <CampoFormulario
              label="Contraseña" name="password" type="password" value={valores.password} onChange={alCambiar} onBlur={alSalir} error={errores.password}
              ayuda={esRegistro ? 'Mínimo 8 caracteres, con mayúscula, minúscula y número.' : undefined}
              autoComplete={esRegistro ? 'new-password' : 'current-password'} obligatorio
            />
            {esRegistro && (
              <>
                <CampoFormulario label="Repite la contraseña" name="confirmar" type="password" value={valores.confirmar} onChange={alCambiar} onBlur={alSalir} error={errores.confirmar} autoComplete="new-password" obligatorio />
                <CampoFormulario label="Acepto que la clínica guarde los datos de mi mascota y los use para gestionar sus atenciones." name="terminos" type="checkbox" value={valores.terminos} onChange={alCambiar} onBlur={alSalir} error={errores.terminos} />
              </>
            )}
            <button type="submit" className="btn btn-primary w-100 mt-2" disabled={enviando}>
              {enviando ? 'Un momento…' : esRegistro ? 'Crear cuenta' : 'Entrar'}
            </button>
          </form>

          <p className="mt-4 mb-0 text-center">
            {esRegistro ? (
              <>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></>
            ) : (
              <>¿Primera vez aquí? <Link to="/registro">Crea tu cuenta</Link></>
            )}
          </p>

          {!esRegistro && (
            <div className="credenciales">
              <strong>Cuentas de demostración</strong>
              <div><code>admin@sanmarcos.cl</code> · Admin#2026</div>
              <div><code>recepcion@sanmarcos.cl</code> · Recepcion#2026</div>
              <div><code>dueno@correo.cl</code> · Dueno#2026</div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
