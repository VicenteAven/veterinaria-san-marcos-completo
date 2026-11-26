package cl.duoc.citas.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MascotaRequest(
        @NotBlank(message = "El nombre de la mascota es obligatorio")
        @Size(min = 2, max = 60, message = "El nombre debe tener entre 2 y 60 caracteres")
        String nombre,

        @NotBlank(message = "La especie es obligatoria")
        @Pattern(regexp = "Perro|Gato|Conejo|Ave", message = "La especie debe ser Perro, Gato, Conejo o Ave")
        String especie,

        @Size(max = 60, message = "La raza no puede superar 60 caracteres")
        String raza,

        @NotBlank(message = "El sexo es obligatorio")
        @Pattern(regexp = "M|H", message = "El sexo debe ser M (macho) o H (hembra)")
        String sexo,

        @PastOrPresent(message = "La fecha de nacimiento no puede ser futura")
        LocalDate fechaNacimiento,

        @DecimalMin(value = "0.05", message = "El peso debe ser mayor a 0")
        @DecimalMax(value = "100.00", message = "El peso no puede superar 100 kg")
        @Digits(integer = 3, fraction = 2, message = "El peso admite hasta 2 decimales")
        BigDecimal pesoKg,

        /** Solo lo usa el personal de la clínica para registrar una mascota a nombre de un dueño. */
        Long duenoId
) {
}
