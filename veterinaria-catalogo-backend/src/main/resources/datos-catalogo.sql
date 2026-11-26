-- Datos iniciales del catálogo (se cargan solo si la tabla especie está vacía)
SET NAMES utf8mb4;
INSERT INTO especie (id, nombre) VALUES (1,'Perro'), (2,'Gato'), (3,'Conejo'), (4,'Ave');

INSERT INTO categoria (id, nombre, tipo) VALUES
  (1,'Consultas','SERVICIO'),
  (2,'Vacunación','SERVICIO'),
  (3,'Cirugía','SERVICIO'),
  (4,'Desparasitación','SERVICIO'),
  (5,'Exámenes','SERVICIO'),
  (6,'Otros','SERVICIO'),
  (7,'Antibióticos','MEDICAMENTO'),
  (8,'Antiparasitarios','MEDICAMENTO'),
  (9,'Antiinflamatorios','MEDICAMENTO'),
  (10,'Dermatología','MEDICAMENTO'),
  (11,'Digestivo','MEDICAMENTO'),
  (12,'Cardíaco','MEDICAMENTO'),
  (13,'Analgésicos','MEDICAMENTO'),
  (14,'Vacunas','MEDICAMENTO'),
  (15,'Suplementos','MEDICAMENTO');

INSERT INTO servicio (id, codigo, categoria_id, nombre, duracion_min, precio, observaciones, activo) VALUES
  (1,'SV001',1,'Consulta general',30,15000,NULL, 1),
  (2,'SV002',1,'Consulta urgencia',30,25000,'Fuera de horario +$10.000', 1),
  (3,'SV003',1,'Control postoperatorio',20,10000,NULL, 1),
  (4,'SV004',1,'Consulta ave / conejo',30,18000,NULL, 1),
  (5,'SV005',1,'Segunda opinión médica',40,20000,'Requiere ficha previa', 1),
  (6,'VA001',2,'Vacuna antirrábica canina',10,12000,'Obligatoria por ley', 1),
  (7,'VA002',2,'Vacuna sextuple canina',10,18000,'Refuerzo anual', 1),
  (8,'VA003',2,'Vacuna bivalente felina',10,15000,'Refuerzo anual', 1),
  (9,'VA004',2,'Vacuna triple felina',10,17000,'Refuerzo anual', 1),
  (10,'VA005',2,'Vacuna Bordetella canina',10,14000,'Tos de las perreras', 1),
  (11,'VA006',2,'Vacuna antirrábica felina',10,12000,NULL, 1),
  (12,'CI001',3,'Esterilización hembra canina',90,80000,'Incluye anestesia y hospitalización 24h', 1),
  (13,'CI002',3,'Esterilización macho canino',60,60000,'Incluye anestesia', 1),
  (14,'CI003',3,'Esterilización hembra felina',60,65000,'Incluye anestesia y hospitalización 12h', 1),
  (15,'CI004',3,'Esterilización macho felino',45,50000,'Incluye anestesia', 1),
  (16,'CI005',3,'Extirpación de tumor cutáneo',60,120000,'Precio referencial; varía según tamaño', 1),
  (17,'CI006',3,'Cesárea de urgencia',120,180000,NULL, 1),
  (18,'DE001',4,'Desparasitación interna pequeños (<10 kg)',5,8000,NULL, 1),
  (19,'DE002',4,'Desparasitación interna medianos (10-25 kg)',5,9500,NULL, 1),
  (20,'DE003',4,'Desparasitación interna grandes (>25 kg)',5,11000,NULL, 1),
  (21,'DE004',4,'Desparasitación interna felina',5,8000,NULL, 1),
  (22,'DE005',4,'Antiparasitario externo (pipeta)',5,7500,'Incluye aplicación', 1),
  (23,'EX001',5,'Hemograma completo',30,22000,'Resultado en 24-48 h', 1),
  (24,'EX002',5,'Perfil bioquímico completo',30,35000,'Resultado en 24-48 h', 1),
  (25,'EX003',5,'Radiografía (1 proyección)',20,28000,NULL, 1),
  (26,'EX004',5,'Ecografía abdominal',30,45000,NULL, 1),
  (27,'EX005',5,'Test de leishmaniasis',20,18000,NULL, 1),
  (28,'OT001',6,'Corte de uñas',15,5000,NULL, 1),
  (29,'OT002',6,'Limpieza dental',45,55000,'Requiere anestesia', 1),
  (30,'OT003',6,'Microchip identificación',10,15000,'Incluye registro', 1),
  (31,'OT004',6,'Hospitalización (por día)',1440,30000,'Incluye monitoreo y alimentación básica', 1);

INSERT INTO servicio_especie (servicio_id, especie_id) VALUES (1,1), (1,2), (2,1), (2,2), (3,1), (3,2), (4,3), (4,4), (5,1), (5,2), (5,3), (5,4), (6,1), (7,1), (8,2), (9,2), (10,1), (11,2), (12,1), (13,1), (14,2), (15,2), (16,1), (16,2), (17,1), (17,2), (18,1), (19,1), (20,1), (21,2), (22,1), (22,2), (23,1), (23,2), (24,1), (24,2), (25,1), (25,2), (26,1), (26,2), (27,1), (28,1), (28,2), (29,1), (29,2), (30,1), (30,2), (31,1), (31,2);

INSERT INTO medicamento (id, codigo, categoria_id, nombre_comercial, principio_activo, presentacion, stock, precio, activo) VALUES
  (1,'ME001',7,'Amoxibay 250mg','Amoxicilina','Blíster 10 comp.',45,4200, 1),
  (2,'ME002',7,'Enrox 50mg','Enrofloxacino','Blíster 10 comp.',30,6800, 1),
  (3,'ME003',7,'Metrobay 250mg','Metronidazol','Blíster 10 comp.',28,3900, 1),
  (4,'ME004',8,'Nexgard','Afoxolaner','Masticable 1 unid.',60,9500, 1),
  (5,'ME005',8,'Bravecto','Fluralaner','Masticable 1 unid.',40,18900, 1),
  (6,'ME006',8,'Revolution Plus','Selamectina+Sarolaner','Pipeta 1 unid.',35,14500, 1),
  (7,'ME007',8,'Drontal Plus','Praziquantel+Pamoato','Comprimido 1 unid.',80,3200, 1),
  (8,'ME008',8,'Milbemax Gato','Milbemicina+Praziq.','Comprimido 2 unid.',50,6800, 1),
  (9,'ME009',9,'Meloxicam 1mg','Meloxicam','Blíster 10 comp.',55,4500, 1),
  (10,'ME010',9,'Carprofen 50mg','Carprofeno','Blíster 10 comp.',30,9800, 1),
  (11,'ME011',10,'Clorhexidina shampoo','Clorhexidina 2%','Frasco 250ml',25,8900, 1),
  (12,'ME012',10,'Malaseb shampoo','Miconazol+Clorhex.','Frasco 250ml',20,12500, 1),
  (13,'ME013',10,'Apoquel 16mg','Oclacitinib','Blíster 10 comp.',18,22000, 1),
  (14,'ME014',11,'Probifor','Bacillus clausii','Sobre 5ml x10',40,5600, 1),
  (15,'ME015',11,'Omeprazol 10mg vet','Omeprazol','Blíster 10 comp.',35,3800, 1),
  (16,'ME016',12,'Vetmedin 2.5mg','Pimobendan','Blíster 10 comp.',15,28000, 1),
  (17,'ME017',13,'Tramadol 50mg vet','Tramadol','Blíster 10 comp.',22,5200, 1),
  (18,'ME018',14,'Nobivac DHPPi','Vacuna polivalente','Vial 1 dosis',48,8500, 1),
  (19,'ME019',14,'Nobivac Rabies','Vacuna antirrábica','Vial 1 dosis',60,5800, 1),
  (20,'ME020',14,'Felocell CVR','Vacuna triple felina','Vial 1 dosis',36,7200, 1),
  (21,'ME021',15,'Omega vet 3-6-9','Ácidos grasos omega','Frasco 100ml',30,9900, 1),
  (22,'ME022',15,'Condrovet forte','Condroitín+Glucos.','Blíster 30 comp.',25,14500, 1);

INSERT INTO medicamento_especie (medicamento_id, especie_id) VALUES (1,1), (1,2), (2,1), (2,2), (3,1), (3,2), (4,1), (5,1), (6,2), (7,1), (8,2), (9,1), (9,2), (10,1), (11,1), (11,2), (12,1), (12,2), (13,1), (14,1), (14,2), (15,1), (15,2), (16,1), (17,1), (18,1), (19,1), (19,2), (20,2), (21,1), (21,2), (22,1);
