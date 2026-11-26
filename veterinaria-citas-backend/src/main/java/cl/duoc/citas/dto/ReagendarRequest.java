package cl.duoc.citas.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record ReagendarRequest(
        @NotNull(message = "Indica el nuevo horario propuesto")
        LocalDateTime fechaPropuesta,

        @Size(max = 300, message = "La observación no puede superar 300 caracteres")
        String observacion
) {
}
