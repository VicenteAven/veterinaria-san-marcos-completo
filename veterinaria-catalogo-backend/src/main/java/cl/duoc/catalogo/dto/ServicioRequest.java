package cl.duoc.catalogo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ServicioRequest(
        @NotBlank(message = "El código es obligatorio")
        @Pattern(regexp = "^[A-Z]{2}\\d{3}$", message = "El código debe tener 2 letras mayúsculas y 3 números (ej: SV001)")
        String codigo,

        @NotNull(message = "La categoría es obligatoria")
        Long categoriaId,

        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 120, message = "El nombre no puede superar 120 caracteres")
        String nombre,

        @NotNull(message = "La duración es obligatoria")
        @Min(value = 1, message = "La duración debe ser de al menos 1 minuto")
        @Max(value = 1440, message = "La duración no puede superar 24 horas")
        Integer duracionMin,

        @NotNull(message = "El precio es obligatorio")
        @Min(value = 0, message = "El precio no puede ser negativo")
        @Max(value = 10000000, message = "El precio es demasiado alto")
        Integer precio,

        @Size(max = 200, message = "Las observaciones no pueden superar 200 caracteres")
        String observaciones,

        @NotEmpty(message = "Indica al menos una especie")
        List<String> especies,

        Boolean activo
) {
}
