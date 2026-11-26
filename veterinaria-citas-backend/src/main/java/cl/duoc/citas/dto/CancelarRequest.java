package cl.duoc.citas.dto;

import jakarta.validation.constraints.Size;

public record CancelarRequest(
        @Size(max = 300, message = "El motivo no puede superar 300 caracteres")
        String motivo
) {
}
