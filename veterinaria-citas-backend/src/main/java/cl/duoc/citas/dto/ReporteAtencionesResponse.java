package cl.duoc.citas.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record ReporteAtencionesResponse(LocalDate desde, LocalDate hasta, long totalCitas, Map<String, Long> citasPorEstado,
                                        long consultasRegistradas, long pacientesNuevos, List<ServicioCantidad> serviciosMasSolicitados) {

    public record ServicioCantidad(Long servicioId, long cantidad) {
    }
}
