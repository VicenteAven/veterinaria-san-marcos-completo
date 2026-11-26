package cl.duoc.citas.service;

import cl.duoc.citas.dto.ReporteAtencionesResponse;
import cl.duoc.citas.model.Cita;
import cl.duoc.citas.exception.ApiException;
import cl.duoc.citas.repository.CitaRepository;
import cl.duoc.citas.repository.ConsultaRepository;
import cl.duoc.citas.repository.MascotaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

/** Reportes de atenciones por período, sin revisar archivadores. */
@Service
@Transactional(readOnly = true)
public class ReporteService {

    private final CitaRepository citas;
    private final ConsultaRepository consultas;
    private final MascotaRepository mascotas;

    public ReporteService(CitaRepository citas, ConsultaRepository consultas, MascotaRepository mascotas) {
        this.citas = citas;
        this.consultas = consultas;
        this.mascotas = mascotas;
    }

    public ReporteAtencionesResponse atenciones(LocalDate desde, LocalDate hasta) {
        if (desde.isAfter(hasta)) {
            throw ApiException.invalido("La fecha «desde» no puede ser posterior a «hasta».");
        }
        if (ChronoUnit.DAYS.between(desde, hasta) > 366) {
            throw ApiException.invalido("El período máximo de un reporte es de un año.");
        }
        List<Cita> delPeriodo = citas.findByFechaHoraBetween(desde.atStartOfDay(), hasta.plusDays(1).atStartOfDay());
        Map<String, Long> porEstado = new TreeMap<>(delPeriodo.stream()
                .collect(Collectors.groupingBy(Cita::getEstado, Collectors.counting())));
        List<ReporteAtencionesResponse.ServicioCantidad> top = delPeriodo.stream()
                .filter(c -> !"CANCELADA".equals(c.getEstado()))
                .collect(Collectors.groupingBy(Cita::getServicioId, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey(Comparator.naturalOrder())))
                .limit(5)
                .map(e -> new ReporteAtencionesResponse.ServicioCantidad(e.getKey(), e.getValue()))
                .toList();
        long consultasRegistradas = consultas.findByFechaBetween(desde, hasta).size();
        long nuevos = mascotas.findByCreadoEnBetween(desde.atStartOfDay(), hasta.plusDays(1).atStartOfDay()).size();
        return new ReporteAtencionesResponse(desde, hasta, delPeriodo.size(), porEstado, consultasRegistradas, nuevos, top);
    }
}
