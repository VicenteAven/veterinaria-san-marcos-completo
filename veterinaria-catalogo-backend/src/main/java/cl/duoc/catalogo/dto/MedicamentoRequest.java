package cl.duoc.catalogo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record MedicamentoRequest(
        @NotBlank(message = "El código es obligatorio")
        @Pattern(regexp = "^[A-Z]{2}\\d{3}$", message = "El código debe tener 2 letras mayúsculas y 3 números (ej: ME001)")
        String codigo,

        @NotNull(message = "La categoría es obligatoria")
        Long categoriaId,

        @NotBlank(message = "El nombre comercial es obligatorio")
        @Size(max = 120, message = "El nombre comercial no puede superar 120 caracteres")
        String nombreComercial,

        @NotBlank(message = "El principio activo es obligatorio")
        @Size(max = 120, message = "El principio activo no puede superar 120 caracteres")
        String principioActivo,

        @NotBlank(message = "La presentación es obligatoria")
        @Size(max = 80, message = "La presentación no puede superar 80 caracteres")
        String presentacion,

        @NotNull(message = "El stock es obligatorio")
        @Min(value = 0, message = "El stock no puede ser negativo")
        @Max(value = 100000, message = "El stock es demasiado alto")
        Integer stock,

        @NotNull(message = "El precio es obligatorio")
        @Min(value = 0, message = "El precio no puede ser negativo")
        @Max(value = 10000000, message = "El precio es demasiado alto")
        Integer precio,

        @NotEmpty(message = "Indica al menos una especie")
        List<String> especies,

        Boolean activo
) {
}
