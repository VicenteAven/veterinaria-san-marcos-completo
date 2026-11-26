package cl.duoc.citas.dto;

import java.time.LocalDate;

/** Vacuna cuya próxima dosis vence pronto (o ya venció). diasRestantes es negativo si está vencida. */
public record VacunaProximaResponse(Long mascotaId, String mascotaNombre, String nombreVacuna,
                                    LocalDate proximaDosis, long diasRestantes, boolean vencida) {
}
