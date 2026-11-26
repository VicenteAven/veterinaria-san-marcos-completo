package cl.duoc.citas.dto;

import cl.duoc.citas.model.Mascota;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MascotaResponse(Long id, Long duenoId, String nombre, String especie, String raza, String sexo,
                              LocalDate fechaNacimiento, BigDecimal pesoKg, boolean activo) {

    public static MascotaResponse de(Mascota m) {
        return new MascotaResponse(m.getId(), m.getDuenoId(), m.getNombre(), m.getEspecie(), m.getRaza(), m.getSexo(),
                m.getFechaNacimiento(), m.getPesoKg(), m.isActivo());
    }
}
