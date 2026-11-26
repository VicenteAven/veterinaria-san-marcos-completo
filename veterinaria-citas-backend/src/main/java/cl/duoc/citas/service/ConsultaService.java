package cl.duoc.citas.service;

import cl.duoc.citas.client.CatalogoClient;
import cl.duoc.citas.dto.ConsultaRequest;
import cl.duoc.citas.dto.ConsultaResponse;
import cl.duoc.citas.dto.ConsultaUpdateRequest;
import cl.duoc.citas.dto.HistorialResponse;
import cl.duoc.citas.dto.MascotaResponse;
import cl.duoc.citas.dto.VacunaProximaResponse;
import cl.duoc.citas.model.Cita;
import cl.duoc.citas.model.Consulta;
import cl.duoc.citas.model.Mascota;
import cl.duoc.citas.model.Receta;
import cl.duoc.citas.model.Vacunacion;
import cl.duoc.citas.exception.ApiException;
import cl.duoc.citas.repository.CitaRepository;
import cl.duoc.citas.repository.ConsultaRepository;
import cl.duoc.citas.repository.MascotaRepository;
import cl.duoc.citas.repository.VacunacionRepository;
import cl.duoc.citas.security.AuthUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Ficha clínica: historial de consultas, vacunas aplicadas, recetas y avisos de próximas dosis. */
@Service
@Transactional
public class ConsultaService {

    private final ConsultaRepository consultas;
    private final VacunacionRepository vacunaciones;
    private final MascotaRepository mascotas;
    private final CitaRepository citas;
    private final AccesoService acceso;
    private final CatalogoClient catalogo;
    private final Clock clock;

    public ConsultaService(ConsultaRepository consultas, VacunacionRepository vacunaciones, MascotaRepository mascotas,
                           CitaRepository citas, AccesoService acceso, CatalogoClient catalogo, Clock clock) {
        this.consultas = consultas;
        this.vacunaciones = vacunaciones;
        this.mascotas = mascotas;
        this.citas = citas;
        this.acceso = acceso;
        this.catalogo = catalogo;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public HistorialResponse historial(Long mascotaId, AuthUser user) {
        Mascota m = acceso.mascotaVisible(mascotaId, user);
        List<ConsultaResponse> lista = consultas.findByMascotaIdOrderByFechaDescIdDesc(mascotaId).stream()
                .map(ConsultaResponse::de).toList();
        return new HistorialResponse(MascotaResponse.de(m), lista);
    }

    public ConsultaResponse registrar(Long mascotaId, ConsultaRequest req, AuthUser user) {
        Mascota m = acceso.mascotaVisible(mascotaId, user);
        validarFechas(req);

        Consulta c = new Consulta();
        c.setMascota(m);
        c.setFecha(req.fecha());
        c.setDiagnostico(req.diagnostico().trim());
        c.setTratamiento(req.tratamiento() == null || req.tratamiento().isBlank() ? null : req.tratamiento().trim());
        c.setPesoKg(req.pesoKg());
        c.setProximoControl(req.proximoControl());
        c.setRegistradoPor(user.id());

        if (req.citaId() != null) {
            Cita cita = citas.findById(req.citaId()).orElseThrow(() -> ApiException.invalido("La cita indicada no existe."));
            if (!cita.getMascota().getId().equals(mascotaId)) {
                throw ApiException.invalido("La cita indicada pertenece a otra mascota.");
            }
            c.setCitaId(cita.getId());
            if ("CONFIRMADA".equals(cita.getEstado())) {
                cita.setEstado("COMPLETADA");
                citas.save(cita);
            }
        }
        if (req.vacunas() != null) {
            for (ConsultaRequest.VacunaRequest v : req.vacunas()) {
                if (v.proximaDosis() != null && v.proximaDosis().isBefore(v.fechaAplicacion())) {
                    throw ApiException.invalido("La próxima dosis de «" + v.nombreVacuna() + "» no puede ser anterior a su aplicación.");
                }
                Vacunacion vac = new Vacunacion();
                vac.setConsulta(c);
                vac.setNombreVacuna(v.nombreVacuna().trim());
                vac.setFechaAplicacion(v.fechaAplicacion());
                vac.setProximaDosis(v.proximaDosis());
                c.getVacunaciones().add(vac);
            }
        }
        if (req.recetas() != null) {
            for (ConsultaRequest.RecetaRequest r : req.recetas()) {
                if (!catalogo.medicamento(r.medicamentoId()).activo()) {
                    throw ApiException.invalido("Uno de los medicamentos recetados ya no está disponible.");
                }
                Receta rec = new Receta();
                rec.setConsulta(c);
                rec.setMedicamentoId(r.medicamentoId());
                rec.setIndicaciones(r.indicaciones().trim());
                c.getRecetas().add(rec);
            }
        }
        if (req.pesoKg() != null) {
            m.setPesoKg(req.pesoKg());
            mascotas.save(m);
        }
        return ConsultaResponse.de(consultas.save(c));
    }

    public ConsultaResponse editar(Long consultaId, ConsultaUpdateRequest req) {
        Consulta c = consultas.findById(consultaId).orElseThrow(() -> ApiException.noEncontrado("La consulta no existe."));
        if (req.proximoControl() != null && req.proximoControl().isBefore(c.getFecha())) {
            throw ApiException.invalido("El próximo control no puede ser anterior a la fecha de la consulta.");
        }
        c.setDiagnostico(req.diagnostico().trim());
        c.setTratamiento(req.tratamiento() == null || req.tratamiento().isBlank() ? null : req.tratamiento().trim());
        c.setProximoControl(req.proximoControl());
        return ConsultaResponse.de(consultas.save(c));
    }

    /**
     * Vacunas por vencer (o vencidas). Por cada vacuna de cada mascota solo cuenta la aplicación más reciente:
     * si ya se aplicó el refuerzo, el aviso anterior desaparece.
     */
    @Transactional(readOnly = true)
    public List<VacunaProximaResponse> proximas(AuthUser user, int dias) {
        LocalDate hoy = LocalDate.now(clock);
        LocalDate limite = hoy.plusDays(dias);
        Map<String, Vacunacion> ultimas = vacunaciones.findAll().stream()
                .filter(v -> !user.esDueno() || v.getConsulta().getMascota().getDuenoId().equals(user.id()))
                .filter(v -> v.getConsulta().getMascota().isActivo())
                .collect(Collectors.toMap(
                        v -> v.getConsulta().getMascota().getId() + "|" + v.getNombreVacuna().toLowerCase(),
                        Function.identity(),
                        (a, b) -> a.getFechaAplicacion().isBefore(b.getFechaAplicacion()) ? b : a));
        return ultimas.values().stream()
                .filter(v -> v.getProximaDosis() != null && !v.getProximaDosis().isAfter(limite))
                .map(v -> {
                    long restantes = ChronoUnit.DAYS.between(hoy, v.getProximaDosis());
                    Mascota m = v.getConsulta().getMascota();
                    return new VacunaProximaResponse(m.getId(), m.getNombre(), v.getNombreVacuna(), v.getProximaDosis(),
                            restantes, restantes < 0);
                })
                .sorted(Comparator.comparing(VacunaProximaResponse::proximaDosis))
                .toList();
    }

    private void validarFechas(ConsultaRequest req) {
        if (req.proximoControl() != null && req.proximoControl().isBefore(req.fecha())) {
            throw ApiException.invalido("El próximo control no puede ser anterior a la fecha de la consulta.");
        }
    }
}
