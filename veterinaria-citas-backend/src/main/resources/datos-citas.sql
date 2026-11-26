-- Datos de demostración (se cargan solo si la tabla mascota está vacía). El dueño de prueba es el usuario id 3 de auth.
SET NAMES utf8mb4;
INSERT INTO mascota (id, dueno_id, nombre, especie, raza, sexo, fecha_nacimiento, peso_kg, activo, creado_en) VALUES
  (1, 3, 'Luna',  'Perro', 'Labrador', 'H', DATE_SUB(CURDATE(), INTERVAL 4 YEAR),  26.50, 1, NOW()),
  (2, 3, 'Michi', 'Gato',  'Mestizo',  'M', DATE_SUB(CURDATE(), INTERVAL 2 YEAR),   4.20, 1, NOW());

INSERT INTO consulta (id, mascota_id, fecha, diagnostico, tratamiento, peso_kg, proximo_control, registrado_por, creado_en) VALUES
  (1, 1, DATE_SUB(CURDATE(), INTERVAL 11 MONTH), 'Control anual sin hallazgos. Buen estado general.',
        'Vacunación de refuerzo y desparasitación.', 26.00, DATE_ADD(CURDATE(), INTERVAL 20 DAY), 2, NOW());

INSERT INTO vacunacion (consulta_id, nombre_vacuna, fecha_aplicacion, proxima_dosis) VALUES
  (1, 'Vacuna sextuple canina',   DATE_SUB(CURDATE(), INTERVAL 11 MONTH), DATE_ADD(CURDATE(), INTERVAL 20 DAY)),
  (1, 'Vacuna antirrábica canina', DATE_SUB(CURDATE(), INTERVAL 11 MONTH), DATE_ADD(CURDATE(), INTERVAL 1 MONTH));

INSERT INTO receta (consulta_id, medicamento_id, indicaciones) VALUES
  (1, 7, '1 comprimido cada 12 horas durante 7 días');

INSERT INTO cita (mascota_id, servicio_id, fecha_hora, motivo, estado, creado_en) VALUES
  (1, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 3 DAY), '10:00:00'), 'Control general y revisión de vacunas.', 'SOLICITADA', NOW()),
  (2, 4, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 5 DAY), '11:30:00'), 'Vacuna triple felina de refuerzo.',     'CONFIRMADA', NOW());
