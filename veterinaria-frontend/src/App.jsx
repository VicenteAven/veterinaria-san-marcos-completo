import { Link, Route, Routes } from 'react-router-dom'
import Navegacion from './components/Navegacion'
import RutaProtegida from './components/RutaProtegida'
import Login from './pages/Login'
import Inicio from './pages/Inicio'
import Catalogo from './pages/Catalogo'
import Mascotas from './pages/Mascotas'
import Citas from './pages/Citas'
import FichaClinica from './pages/FichaClinica'
import Usuarios from './pages/admin/Usuarios'
import Reportes from './pages/admin/Reportes'
import Ubicacion from './pages/Ubicacion'

const PERSONAL = ['ADMIN', 'RECEPCIONISTA']

/** define las rutas. Todo requiere sesión salvo /login y /registro. */
export default function App() {
  return (
    <>
      <a href="#contenido" className="saltar">Saltar al contenido</a>
      <Navegacion />
      <div id="contenido">
        <Routes>
          <Route path="/login" element={<Login modo="login" />} />
          <Route path="/registro" element={<Login modo="registro" />} />
          <Route path="/" element={<RutaProtegida><Inicio /></RutaProtegida>} />
          <Route path="/citas" element={<RutaProtegida><Citas /></RutaProtegida>} />
          <Route path="/mascotas" element={<RutaProtegida><Mascotas /></RutaProtegida>} />
          <Route path="/mascotas/:id/ficha" element={<RutaProtegida><FichaClinica /></RutaProtegida>} />
          <Route path="/catalogo" element={<RutaProtegida><Catalogo /></RutaProtegida>} />
          <Route path="/reportes" element={<RutaProtegida roles={PERSONAL}><Reportes /></RutaProtegida>} />
          <Route path="/usuarios" element={<RutaProtegida roles={['ADMIN']}><Usuarios /></RutaProtegida>} />
          <Route path="/ubicacion" element={<RutaProtegida><Ubicacion /></RutaProtegida>} />
          <Route
            path="*"
            element={
              <main className="container pagina">
                <h1>Esta página no existe</h1>
                <p>Revisa la dirección o vuelve al inicio.</p>
                <Link to="/" className="btn btn-primary">Ir al inicio</Link>
              </main>
            }
          />
        </Routes>
      </div>
    </>
  )
}
