package cl.duoc.citas.dto;

import cl.duoc.citas.model.Cita;

import java.time.LocalDateTime;

public record CitaResponse(Long id, Long mascotaId, String mascotaNombre, String mascotaEspecie, Long duenoId,
                           Long servicioId, LocalDateTime fechaHora, String motivo, String estado,
                           LocalDateTime fechaPropuesta, String observacion, LocalDateTime creadoEn) {

    public static CitaResponse de(Cita c) {
        return new CitaResponse(c.getId(), c.getMascota().getId(), c.getMascota().getNombre(), c.getMascota().getEspecie(),
                c.getMascota().getDuenoId(), c.getServicioId(), c.getFechaHora(), c.getMotivo(), c.getEstado(),
                c.getFechaPropuesta(), c.getObservacion(), c.getCreadoEn());
    }
}
