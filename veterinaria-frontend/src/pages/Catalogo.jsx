import { useCallback, useEffect, useState } from 'react'
import CampoFormulario from '../components/CampoFormulario'
import { useAuth } from '../context/AuthContext'
import { useForm } from '../hooks/useForm'
import { catalogo as api, leerError } from '../services/api'
import { ESPECIES, duracion, pesos } from '../utils/format'
import { esquemas, validar } from '../utils/validators'

const SERVICIO_VACIO = { codigo: '', categoriaId: '', nombre: '', duracionMin: '30', precio: '', observaciones: '', especies: [], activo: true }
const MEDICAMENTO_VACIO = { codigo: '', categoriaId: '', nombreComercial: '', principioActivo: '', presentacion: '', stock: '0', precio: '', especies: [], activo: true }

/** catálogo de servicios y medicamentos con búsqueda y filtros. El administrador lo edita. */
export default function Catalogo() {
  const { esRol, esPersonal } = useAuth()
  const esAdmin = esRol('ADMIN')
  const [pestana, setPestana] = useState('servicios')
  const [q, setQ] = useState('')
  const [qFiltro, setQFiltro] = useState('')
  const [especie, setEspecie] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [categorias, setCategorias] = useState([])
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [editando, setEditando] = useState(null) // null | 'nuevo' | item
  const [confirmando, setConfirmando] = useState(null)
  const [stock, setStock] = useState(null) // { id, valor, error }
  const [enviando, setEnviando] = useState(false)
  const formServicio = useForm(SERVICIO_VACIO, esquemas.servicio)
  const formMedicamento = useForm(MEDICAMENTO_VACIO, esquemas.medicamento)

  const esServicios = pestana === 'servicios'
  const form = esServicios ? formServicio : formMedicamento
  const { valores, errores, alCambiar, alSalir } = form

  useEffect(() => {
    const t = setTimeout(() => setQFiltro(q), 300)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    api.categorias(esServicios ? 'SERVICIO' : 'MEDICAMENTO').then(setCategorias).catch(() => setCategorias([]))
  }, [esServicios])

  const cargar = useCallback(async () => {
    setCargando(true)
    const params = { q: qFiltro || undefined, especie: especie || undefined, categoriaId: categoriaId || undefined, incluirInactivos: esPersonal || undefined }
    try {
      setItems(esServicios ? await api.servicios(params) : await api.medicamentos(params))
      setError('')
    } catch (e) {
      setError(leerError(e).mensaje)
    } finally {
      setCargando(false)
    }
  }, [esServicios, qFiltro, especie, categoriaId, esPersonal])

  useEffect(() => {
    cargar()
  }, [cargar])

  const cambiarPestana = (p) => {
    setPestana(p)
    setCategoriaId('')
    setEditando(null)
    setConfirmando(null)
    setStock(null)
    setMensaje('')
  }

  const abrirNuevo = () => {
    form.reiniciar(esServicios ? SERVICIO_VACIO : MEDICAMENTO_VACIO)
    setEditando('nuevo')
    setMensaje('')
  }

  const abrirEdicion = (it) => {
    const comunes = { codigo: it.codigo, categoriaId: String(it.categoria.id), precio: String(it.precio), especies: it.especies, activo: it.activo }
    form.reiniciar(
      esServicios
        ? { ...comunes, nombre: it.nombre, duracionMin: String(it.duracionMin), observaciones: it.observaciones || '' }
        : { ...comunes, nombreComercial: it.nombreComercial, principioActivo: it.principioActivo, presentacion: it.presentacion, stock: String(it.stock) },
    )
    setEditando(it)
    setMensaje('')
  }

  const alternarEspecie = (nombre) => {
    const actuales = valores.especies
    form.cambiar('especies', actuales.includes(nombre) ? actuales.filter((e) => e !== nombre) : [...actuales, nombre])
  }

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.validarTodo()) return
    const v = valores
    const comunes = { codigo: v.codigo.trim().toUpperCase(), categoriaId: Number(v.categoriaId), precio: Number(v.precio), especies: v.especies, activo: v.activo }
    const cuerpo = esServicios
      ? { ...comunes, nombre: v.nombre.trim(), duracionMin: Number(v.duracionMin), observaciones: v.observaciones.trim() || null }
      : { ...comunes, nombreComercial: v.nombreComercial.trim(), principioActivo: v.principioActivo.trim(), presentacion: v.presentacion.trim(), stock: Number(v.stock) }
    setEnviando(true)
    try {
      if (editando === 'nuevo') await (esServicios ? api.crearServicio(cuerpo) : api.crearMedicamento(cuerpo))
      else await (esServicios ? api.actualizarServicio(editando.id, cuerpo) : api.actualizarMedicamento(editando.id, cuerpo))
      setMensaje(editando === 'nuevo' ? 'Agregamos el elemento al catálogo.' : 'Guardamos los cambios.')
      setEditando(null)
      await cargar()
    } catch (err) {
      const { mensaje: m, campos } = leerError(err)
      form.ponerErrores(campos)
      setError(m)
    } finally {
      setEnviando(false)
    }
  }

  const desactivar = async (it) => {
    setError('')
    try {
      await (esServicios ? api.desactivarServicio(it.id) : api.desactivarMedicamento(it.id))
      setMensaje('Lo desactivamos: ya no se ofrece, pero se conserva en las citas anteriores.')
      setConfirmando(null)
      await cargar()
    } catch (err) {
      setError(leerError(err).mensaje)
      setConfirmando(null)
    }
  }

  const guardarStock = async () => {
    const errs = validar(esquemas.stock, { stock: stock.valor })
    if (errs.stock) {
      setStock({ ...stock, error: errs.stock })
      return
    }
    try {
      await api.ajustarStock(stock.id, Number(stock.valor))
      setMensaje('Actualizamos el stock.')
      setStock(null)
      await cargar()
    } catch (err) {
      setStock({ ...stock, error: leerError(err).mensaje })
    }
  }

  return (
    <main className="container pagina">
      <div className="encabezado">
        <div>
          <h1>Servicios y medicamentos</h1>
          <p>Precios en pesos chilenos, según el catálogo vigente de la clínica.</p>
        </div>
        {esAdmin && !editando && <button type="button" className="btn btn-calendula" onClick={abrirNuevo}>{esServicios ? 'Nuevo servicio' : 'Nuevo medicamento'}</button>}
      </div>

      <div className="pestanas mb-3" role="tablist" aria-label="Tipo de catálogo">
        <button type="button" role="tab" aria-selected={esServicios} onClick={() => cambiarPestana('servicios')}>Servicios</button>
        <button type="button" role="tab" aria-selected={!esServicios} onClick={() => cambiarPestana('medicamentos')}>Medicamentos y vacunas</button>
      </div>

      {mensaje && <div className="alert alert-success" role="status">{mensaje}</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {editando && (
        <section className="panel mb-3" aria-labelledby="titulo-form-catalogo">
          <div className="panel-titulo"><h2 id="titulo-form-catalogo">{editando === 'nuevo' ? (esServicios ? 'Nuevo servicio' : 'Nuevo medicamento') : 'Editar'}</h2></div>
          <form onSubmit={guardar} noValidate>
            <div className="row">
              <div className="col-md-3"><CampoFormulario label="Código" name="codigo" value={valores.codigo} onChange={alCambiar} onBlur={alSalir} error={errores.codigo} ayuda="Ej: SV001" obligatorio /></div>
              <div className="col-md-5">
                {esServicios
                  ? <CampoFormulario label="Nombre del servicio" name="nombre" value={valores.nombre} onChange={alCambiar} onBlur={alSalir} error={errores.nombre} obligatorio />
                  : <CampoFormulario label="Nombre comercial" name="nombreComercial" value={valores.nombreComercial} onChange={alCambiar} onBlur={alSalir} error={errores.nombreComercial} obligatorio />}
              </div>
              <div className="col-md-4"><CampoFormulario label="Categoría" name="categoriaId" as="select" value={valores.categoriaId} onChange={alCambiar} onBlur={alSalir} error={errores.categoriaId} opciones={categorias.map((c) => ({ value: c.id, label: c.nombre }))} obligatorio /></div>
              {esServicios ? (
                <>
                  <div className="col-md-3"><CampoFormulario label="Duración (minutos)" name="duracionMin" type="number" min="1" max="1440" value={valores.duracionMin} onChange={alCambiar} onBlur={alSalir} error={errores.duracionMin} obligatorio /></div>
                  <div className="col-md-3"><CampoFormulario label="Precio (CLP)" name="precio" type="number" min="0" value={valores.precio} onChange={alCambiar} onBlur={alSalir} error={errores.precio} obligatorio /></div>
                  <div className="col-md-6"><CampoFormulario label="Observaciones" name="observaciones" value={valores.observaciones} onChange={alCambiar} onBlur={alSalir} error={errores.observaciones} ayuda="Opcional" /></div>
                </>
              ) : (
                <>
                  <div className="col-md-4"><CampoFormulario label="Principio activo" name="principioActivo" value={valores.principioActivo} onChange={alCambiar} onBlur={alSalir} error={errores.principioActivo} obligatorio /></div>
                  <div className="col-md-4"><CampoFormulario label="Presentación" name="presentacion" value={valores.presentacion} onChange={alCambiar} onBlur={alSalir} error={errores.presentacion} obligatorio /></div>
                  <div className="col-md-2"><CampoFormulario label="Stock" name="stock" type="number" min="0" value={valores.stock} onChange={alCambiar} onBlur={alSalir} error={errores.stock} obligatorio /></div>
                  <div className="col-md-2"><CampoFormulario label="Precio (CLP)" name="precio" type="number" min="0" value={valores.precio} onChange={alCambiar} onBlur={alSalir} error={errores.precio} obligatorio /></div>
                </>
              )}
              <div className="col-12">
                <CampoFormulario label="Especies" error={errores.especies} obligatorio>
                  <div className="checks">
                    {ESPECIES.map((n) => (
                      <div key={n} className="form-check">
                        <input id={`esp-${n}`} type="checkbox" className="form-check-input" checked={valores.especies.includes(n)} onChange={() => alternarEspecie(n)} />
                        <label className="form-check-label" htmlFor={`esp-${n}`}>{n}</label>
                      </div>
                    ))}
                  </div>
                </CampoFormulario>
              </div>
              <div className="col-12"><CampoFormulario label="Disponible para las citas" name="activo" type="checkbox" value={valores.activo} onChange={alCambiar} /></div>
            </div>
            <div className="acciones">
              <button type="submit" className="btn btn-primary" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setEditando(null)}>Cancelar</button>
            </div>
          </form>
        </section>
      )}

      <section className="panel" aria-label="Listado">
        <div className="filtros">
          <div>
            <label htmlFor="buscar" className="visually-hidden">Buscar</label>
            <input id="buscar" type="search" className="form-control" placeholder={esServicios ? 'Buscar servicio o código' : 'Buscar nombre, principio activo o código'} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div>
            <label htmlFor="filtro-especie" className="visually-hidden">Especie</label>
            <select id="filtro-especie" className="form-select" value={especie} onChange={(e) => setEspecie(e.target.value)}>
              <option value="">Todas las especies</option>
              {ESPECIES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filtro-categoria" className="visually-hidden">Categoría</label>
            <select id="filtro-categoria" className="form-select" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
              <option value="">Todas las categorías</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
        </div>

        {cargando ? (
          <div className="pagina-cargando" role="status"><span className="spinner-border text-primary" aria-hidden="true" /><span className="ms-2">Cargando…</span></div>
        ) : items.length === 0 ? (
          <div className="vacio"><strong>No encontramos resultados</strong>Prueba con otra búsqueda o quita algún filtro.</div>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Código</th><th>{esServicios ? 'Servicio' : 'Medicamento'}</th><th>Categoría</th><th>Especies</th>
                <th>{esServicios ? 'Duración' : 'Stock'}</th><th>Precio</th>{esPersonal && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td data-label="Código">{it.codigo}</td>
                  <td data-label={esServicios ? 'Servicio' : 'Medicamento'}>
                    <div className="celda-texto">
                    <strong>{esServicios ? it.nombre : it.nombreComercial}</strong>
                    {!it.activo && <span className="estado estado-secondary ms-2">Inactivo</span>}
                    <br />
                    <span className="texto-suave">{esServicios ? it.observaciones : `${it.principioActivo} · ${it.presentacion}`}</span>
                    </div>
                  </td>
                  <td data-label="Categoría">{it.categoria.nombre}</td>
                  <td data-label="Especies">{it.especies.join(', ')}</td>
                  <td data-label={esServicios ? 'Duración' : 'Stock'}>
                    {esServicios ? duracion(it.duracionMin) : <span className={it.stock <= 20 ? 'stock-bajo' : undefined}>{it.stock}{it.stock <= 20 ? ' (bajo)' : ''}</span>}
                  </td>
                  <td data-label="Precio" className="precio">{pesos(it.precio)}</td>
                  {esPersonal && (
                    <td className="acciones" data-label="Acciones">
                      {stock?.id === it.id ? (
                        <div>
                          <label className="visually-hidden" htmlFor={`stock-${it.id}`}>Nuevo stock de {it.nombreComercial}</label>
                          <div className="d-flex gap-1">
                            <input id={`stock-${it.id}`} type="number" min="0" className={`form-control form-control-sm ${stock.error ? 'is-invalid' : ''}`} style={{ width: 90 }} value={stock.valor} onChange={(e) => setStock({ ...stock, valor: e.target.value, error: '' })} />
                            <button type="button" className="btn btn-primary btn-sm" onClick={guardarStock}>Guardar</button>
                            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setStock(null)}>Cancelar</button>
                          </div>
                          {stock.error && <div className="campo-error" role="alert">{stock.error}</div>}
                        </div>
                      ) : confirmando === it.id ? (
                        <>
                          <span>¿Desactivar?</span>
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => desactivar(it)}>Sí</button>
                          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setConfirmando(null)}>No</button>
                        </>
                      ) : (
                        <>
                          {!esServicios && <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setStock({ id: it.id, valor: String(it.stock), error: '' })}>Ajustar stock</button>}
                          {esAdmin && <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => abrirEdicion(it)}>Editar</button>}
                          {esAdmin && it.activo && <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setConfirmando(it.id)}>Desactivar</button>}
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}
