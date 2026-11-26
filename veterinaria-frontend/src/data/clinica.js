// Datos de la clínica en un solo lugar. Cambia aquí la dirección y las coordenadas reales.
export const CLINICA = {
  nombre: 'Veterinaria San Marcos',
  ciudad: 'Rancagua',
  region: "Región del Libertador General Bernardo O'Higgins",
  direccion: 'Rancagua, Región de O’Higgins', // TODO: reemplazar por la dirección exacta de la clínica
  fundada: 2009,
  horario: 'Lunes a sábado, de 9:00 a 18:00',
  // Coordenadas de referencia: centro de Rancagua (Plaza de los Héroes). Reemplazar por las de la clínica.
  lat: -34.17083,
  lng: -70.74444,
}

// Reglas de agenda: deben coincidir con las de citas-service.
export const AGENDA = {
  apertura: '09:00',
  ultimoBloque: '17:30',
  diasMaximos: 90,
}
