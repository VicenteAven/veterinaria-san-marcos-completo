package cl.duoc.citas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record CitaRequest(
        @NotNull(message = "Selecciona una mascota")
        Long mascotaId,

        @NotNull(message = "Selecciona un servicio")
        Long servicioId,

        @NotNull(message = "La fecha y hora son obligatorias")
        LocalDateTime fechaHora,

        @NotBlank(message = "Cuéntanos el motivo de la visita")
        @Size(min = 10, max = 300, message = "El motivo debe tener entre 10 y 300 caracteres")
        String motivo
) {
}
