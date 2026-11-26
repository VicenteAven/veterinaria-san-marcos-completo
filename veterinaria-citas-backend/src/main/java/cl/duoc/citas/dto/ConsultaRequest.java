package cl.duoc.citas.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Registro de una atención: diagnóstico, tratamiento, vacunas aplicadas y medicamentos recetados. */
public record ConsultaRequest(
        Long citaId,

        @NotNull(message = "La fecha de la consulta es obligatoria")
        @PastOrPresent(message = "La fecha de la consulta no puede ser futura")
        LocalDate fecha,

        @NotBlank(message = "El diagnóstico es obligatorio")
        @Size(min = 5, max = 500, message = "El diagnóstico debe tener entre 5 y 500 caracteres")
        String diagnostico,

        @Size(max = 500, message = "El tratamiento no puede superar 500 caracteres")
        String tratamiento,

        @DecimalMin(value = "0.05", message = "El peso debe ser mayor a 0")
        @DecimalMax(value = "100.00", message = "El peso no puede superar 100 kg")
        BigDecimal pesoKg,

        LocalDate proximoControl,

        @Valid List<VacunaRequest> vacunas,

        @Valid List<RecetaRequest> recetas
) {

    public record VacunaRequest(
            @NotBlank(message = "El nombre de la vacuna es obligatorio")
            @Size(max = 80, message = "El nombre de la vacuna no puede superar 80 caracteres")
            String nombreVacuna,

            @NotNull(message = "La fecha de aplicación es obligatoria")
            @PastOrPresent(message = "La fecha de aplicación no puede ser futura")
            LocalDate fechaAplicacion,

            LocalDate proximaDosis
    ) {
    }

    public record RecetaRequest(
            @NotNull(message = "Selecciona el medicamento")
            Long medicamentoId,

            @NotBlank(message = "Las indicaciones son obligatorias")
            @Size(max = 200, message = "Las indicaciones no pueden superar 200 caracteres")
            String indicaciones
    ) {
    }
}
