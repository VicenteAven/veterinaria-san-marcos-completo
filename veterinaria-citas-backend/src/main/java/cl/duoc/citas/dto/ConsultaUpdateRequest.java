package cl.duoc.citas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ConsultaUpdateRequest(
        @NotBlank(message = "El diagnóstico es obligatorio")
        @Size(min = 5, max = 500, message = "El diagnóstico debe tener entre 5 y 500 caracteres")
        String diagnostico,

        @Size(max = 500, message = "El tratamiento no puede superar 500 caracteres")
        String tratamiento,

        LocalDate proximoControl
) {
}
