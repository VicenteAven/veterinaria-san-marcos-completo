import { useId } from 'react'

/**
 * un campo de formulario con etiqueta, control y mensaje de error accesible.
 * Sirve para input, select, textarea y checkbox; con `children` se puede poner un control propio
 * (por ejemplo un grupo de casillas) y conservar la etiqueta y el error.
 */
export default function CampoFormulario({
  label, name, as = 'input', type = 'text', value, onChange, onBlur, error, ayuda,
  opciones = [], placeholder, obligatorio = false, children, ...resto
}) {
  const id = useId()
  const errorId = `${id}-error`
  const ayudaId = `${id}-ayuda`
  const describe = [error ? errorId : null, ayuda ? ayudaId : null].filter(Boolean).join(' ') || undefined
  const comunes = { id, name, onBlur, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': describe, ...resto }

  let control
  if (children) {
    control = <div role="group" aria-labelledby={`${id}-label`} aria-describedby={describe}>{children}</div>
  } else if (type === 'checkbox') {
    return (
      <div className="mb-3">
        <div className="form-check">
          <input {...comunes} type="checkbox" className={`form-check-input ${error ? 'is-invalid' : ''}`} checked={Boolean(value)} onChange={onChange} />
          <label className="form-check-label" htmlFor={id}>{label}</label>
        </div>
        {error && <div id={errorId} className="campo-error" role="alert">{error}</div>}
      </div>
    )
  } else if (as === 'select') {
    control = (
      <select {...comunes} className={`form-select ${error ? 'is-invalid' : ''}`} value={value ?? ''} onChange={onChange}>
        <option value="">{placeholder || 'Selecciona…'}</option>
        {opciones.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
        ))}
      </select>
    )
  } else if (as === 'textarea') {
    control = <textarea {...comunes} rows={3} className={`form-control ${error ? 'is-invalid' : ''}`} value={value ?? ''} onChange={onChange} placeholder={placeholder} />
  } else {
    control = <input {...comunes} type={type} className={`form-control ${error ? 'is-invalid' : ''}`} value={value ?? ''} onChange={onChange} placeholder={placeholder} />
  }

  return (
    <div className="mb-3">
      <label id={`${id}-label`} htmlFor={children ? undefined : id} className="form-label">
        {label}
        {obligatorio && <span className="text-danger" aria-hidden="true"> *</span>}
      </label>
      {control}
      {ayuda && <div id={ayudaId} className="form-text">{ayuda}</div>}
      {error && <div id={errorId} className="campo-error" role="alert">{error}</div>}
    </div>
  )
}
