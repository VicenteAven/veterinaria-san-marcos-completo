package cl.duoc.citas.dto;

import cl.duoc.citas.model.Consulta;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ConsultaResponse(Long id, Long mascotaId, Long citaId, LocalDate fecha, String diagnostico, String tratamiento,
                               BigDecimal pesoKg, LocalDate proximoControl, Long registradoPor,
                               List<VacunacionResponse> vacunaciones, List<RecetaResponse> recetas) {

    public record VacunacionResponse(Long id, String nombreVacuna, LocalDate fechaAplicacion, LocalDate proximaDosis) {
    }

    public record RecetaResponse(Long id, Long medicamentoId, String indicaciones) {
    }

    public static ConsultaResponse de(Consulta c) {
        return new ConsultaResponse(c.getId(), c.getMascota().getId(), c.getCitaId(), c.getFecha(), c.getDiagnostico(),
                c.getTratamiento(), c.getPesoKg(), c.getProximoControl(), c.getRegistradoPor(),
                c.getVacunaciones().stream()
                        .map(v -> new VacunacionResponse(v.getId(), v.getNombreVacuna(), v.getFechaAplicacion(), v.getProximaDosis()))
                        .toList(),
                c.getRecetas().stream()
                        .map(r -> new RecetaResponse(r.getId(), r.getMedicamentoId(), r.getIndicaciones()))
                        .toList());
    }
}
