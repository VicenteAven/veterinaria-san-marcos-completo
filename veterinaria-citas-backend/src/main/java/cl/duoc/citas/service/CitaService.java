package cl.duoc.citas.service;

import cl.duoc.citas.client.CatalogoClient;
import cl.duoc.citas.dto.CitaRequest;
import cl.duoc.citas.dto.CitaResponse;
import cl.duoc.citas.dto.DisponibilidadResponse;
import cl.duoc.citas.dto.ReagendarRequest;
import cl.duoc.citas.model.Cita;
import cl.duoc.citas.model.Mascota;
import cl.duoc.citas.exception.ApiException;
import cl.duoc.citas.repository.CitaRepository;
import cl.duoc.citas.security.AuthUser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Flujo de citas:
 * dueño solicita (SOLICITADA) → recepción confirma (CONFIRMADA) o propone otro horario (REPROGRAMADA)
 * → el dueño acepta la propuesta (CONFIRMADA) o cancela. Al atender se marca COMPLETADA.
 */
@Service
@Transactional
public class CitaService {

    public static final LocalTime APERTURA = LocalTime.of(9, 0);
    public static final LocalTime ULTIMO_BLOQUE = LocalTime.of(17, 30);
    public static final int DIAS_MAXIMOS_ANTICIPACION = 90;

    private final CitaRepository citas;
    private final AccesoService acceso;
    private final CatalogoClient catalogo;
    private final Clock clock;
    private final int capacidadPorBloque;

    public CitaService(CitaRepository citas, AccesoService acceso, CatalogoClient catalogo, Clock clock,
                       @Value("${app.citas.capacidad-por-bloque:3}") int capacidadPorBloque) {
        this.citas = citas;
        this.acceso = acceso;
        this.catalogo = catalogo;
        this.clock = clock;
        this.capacidadPorBloque = capacidadPorBloque;
    }

    // ------------------------------------------------------------------ consultas

    @Transactional(readOnly = true)
    public List<CitaResponse> listar(AuthUser user, String estado, LocalDate desde, LocalDate hasta, Long mascotaId) {
        List<Cita> base = user.esDueno()
                ? citas.findByMascotaDuenoIdOrderByFechaHoraDesc(user.id())
                : citas.findAllByOrderByFechaHoraDesc();
        return base.stream()
                .filter(c -> estado == null || estado.isBlank() || c.getEstado().equalsIgnoreCase(estado.trim()))
                .filter(c -> mascotaId == null || c.getMascota().getId().equals(mascotaId))
                .filter(c -> desde == null || !c.getFechaHora().toLocalDate().isBefore(desde))
                .filter(c -> hasta == null || !c.getFechaHora().toLocalDate().isAfter(hasta))
                .map(CitaResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public CitaResponse obtener(Long id, AuthUser user) {
        return CitaResponse.de(citaVisible(id, user));
    }

    @Transactional(readOnly = true)
    public DisponibilidadResponse disponibilidad(LocalDate fecha) {
        Map<LocalDateTime, Long> ocupados = citas
                .findByFechaHoraBetweenAndEstado(fecha.atStartOfDay(), fecha.plusDays(1).atStartOfDay(), "CONFIRMADA")
                .stream().collect(Collectors.groupingBy(Cita::getFechaHora, HashMap::new, Collectors.counting()));
        LocalDateTime ahora = LocalDateTime.now(clock);
        List<DisponibilidadResponse.Bloque> bloques = new ArrayList<>();
        if (fecha.getDayOfWeek() != DayOfWeek.SUNDAY) {
            for (LocalTime t = APERTURA; !t.isAfter(ULTIMO_BLOQUE); t = t.plusMinutes(30)) {
                LocalDateTime fh = fecha.atTime(t);
                int libres = fh.isAfter(ahora) ? (int) Math.max(0, capacidadPorBloque - ocupados.getOrDefault(fh, 0L)) : 0;
                bloques.add(new DisponibilidadResponse.Bloque(t.toString(), libres));
            }
        }
        return new DisponibilidadResponse(fecha.toString(), bloques);
    }

    // ------------------------------------------------------------------ acciones

    public CitaResponse crear(CitaRequest req, AuthUser user) {
        Mascota mascota = acceso.mascotaVisible(req.mascotaId(), user);
        if (!mascota.isActivo()) {
            throw ApiException.invalido("La mascota seleccionada está dada de baja.");
        }
        validarBloque(req.fechaHora());
        validarServicio(req.servicioId(), mascota);
        if (citas.existsByMascotaIdAndFechaHoraAndEstadoIn(mascota.getId(), req.fechaHora(), MascotaService.ESTADOS_ACTIVOS)) {
            throw ApiException.conflicto("Esa mascota ya tiene una cita en ese horario.");
        }
        Cita c = new Cita();
        c.setMascota(mascota);
        c.setServicioId(req.servicioId());
        c.setFechaHora(req.fechaHora());
        c.setMotivo(req.motivo().trim());
        if (user.esStaff()) {
            // La recepcionista agenda por teléfono o en persona: queda confirmada de inmediato (si hay cupo).
            exigirCupo(req.fechaHora());
            c.setEstado("CONFIRMADA");
        } else {
            c.setEstado("SOLICITADA");
        }
        return CitaResponse.de(citas.save(c));
    }

    public CitaResponse confirmar(Long id) {
        Cita c = buscar(id);
        exigirEstado(c, "Solo se pueden confirmar las citas solicitadas.", "SOLICITADA");
        exigirCupo(c.getFechaHora());
        c.setEstado("CONFIRMADA");
        c.setObservacion(null);
        return CitaResponse.de(citas.save(c));
    }

    public CitaResponse reagendar(Long id, ReagendarRequest req) {
        Cita c = buscar(id);
        exigirEstado(c, "Solo se pueden reagendar citas solicitadas o confirmadas.", "SOLICITADA", "CONFIRMADA");
        validarBloque(req.fechaPropuesta());
        if (req.fechaPropuesta().equals(c.getFechaHora())) {
            throw ApiException.invalido("El horario propuesto es el mismo que el actual.");
        }
        exigirCupo(req.fechaPropuesta());
        c.setEstado("REPROGRAMADA");
        c.setFechaPropuesta(req.fechaPropuesta());
        c.setObservacion(req.observacion() == null || req.observacion().isBlank() ? null : req.observacion().trim());
        return CitaResponse.de(citas.save(c));
    }

    /** El dueño acepta el horario que propuso la clínica. */
    public CitaResponse aceptarPropuesta(Long id, AuthUser user) {
        Cita c = citaVisible(id, user);
        exigirEstado(c, "Esta cita no tiene una propuesta de horario pendiente.", "REPROGRAMADA");
        if (c.getFechaPropuesta() == null) {
            throw ApiException.invalido("Esta cita no tiene una propuesta de horario pendiente.");
        }
        validarBloque(c.getFechaPropuesta());
        exigirCupo(c.getFechaPropuesta());
        c.setFechaHora(c.getFechaPropuesta());
        c.setFechaPropuesta(null);
        c.setEstado("CONFIRMADA");
        return CitaResponse.de(citas.save(c));
    }

    public CitaResponse cancelar(Long id, String motivo, AuthUser user) {
        Cita c = citaVisible(id, user);
        exigirEstado(c, "Solo se pueden cancelar citas pendientes o confirmadas.", "SOLICITADA", "CONFIRMADA", "REPROGRAMADA");
        c.setEstado("CANCELADA");
        c.setFechaPropuesta(null);
        if (motivo != null && !motivo.isBlank()) {
            c.setObservacion(motivo.trim());
        }
        return CitaResponse.de(citas.save(c));
    }

    public CitaResponse completar(Long id) {
        Cita c = buscar(id);
        exigirEstado(c, "Solo se pueden completar citas confirmadas.", "CONFIRMADA");
        c.setEstado("COMPLETADA");
        return CitaResponse.de(citas.save(c));
    }

    // ------------------------------------------------------------------ reglas

    /** Reglas de agenda: futuro, hasta 90 días, lunes a sábado, 09:00–17:30, bloques de 30 minutos. */
    void validarBloque(LocalDateTime fh) {
        LocalDateTime ahora = LocalDateTime.now(clock);
        if (!fh.isAfter(ahora)) {
            throw ApiException.invalido("La fecha y hora de la cita deben ser futuras.");
        }
        if (fh.isAfter(ahora.plusDays(DIAS_MAXIMOS_ANTICIPACION))) {
            throw ApiException.invalido("Solo se puede agendar con hasta " + DIAS_MAXIMOS_ANTICIPACION + " días de anticipación.");
        }
        if (fh.getDayOfWeek() == DayOfWeek.SUNDAY) {
            throw ApiException.invalido("La clínica no atiende los domingos.");
        }
        LocalTime t = fh.toLocalTime();
        if (t.isBefore(APERTURA) || t.isAfter(ULTIMO_BLOQUE)) {
            throw ApiException.invalido("El horario de atención es de 09:00 a 18:00 (último bloque 17:30).");
        }
        if (t.getMinute() % 30 != 0 || t.getSecond() != 0 || t.getNano() != 0) {
            throw ApiException.invalido("Las citas se agendan en bloques de 30 minutos (a las :00 o a las :30).");
        }
    }

    /** El servicio debe existir en el catálogo, estar activo y ser apto para la especie de la mascota. */
    private void validarServicio(Long servicioId, Mascota mascota) {
        CatalogoClient.ServicioRef s = catalogo.servicio(servicioId);
        if (!s.activo()) {
            throw ApiException.invalido("El servicio «" + s.nombre() + "» ya no está disponible.");
        }
        boolean compatible = s.especies() != null && s.especies().stream().anyMatch(e -> e.equalsIgnoreCase(mascota.getEspecie()));
        if (!compatible) {
            throw ApiException.invalido("El servicio «" + s.nombre() + "» no se ofrece para la especie " + mascota.getEspecie() + ".");
        }
    }

    /** Cada bloque admite tantas citas confirmadas como médicos hay (3 por defecto). */
    private void exigirCupo(LocalDateTime fh) {
        if (citas.countByFechaHoraAndEstado(fh, "CONFIRMADA") >= capacidadPorBloque) {
            throw ApiException.conflicto("Ese horario ya no tiene cupos disponibles. Elige otro bloque.");
        }
    }

    private void exigirEstado(Cita c, String mensaje, String... permitidos) {
        for (String p : permitidos) {
            if (p.equals(c.getEstado())) {
                return;
            }
        }
        throw ApiException.conflicto(mensaje);
    }

    private Cita buscar(Long id) {
        return citas.findById(id).orElseThrow(() -> ApiException.noEncontrado("La cita no existe."));
    }

    private Cita citaVisible(Long id, AuthUser user) {
        Cita c = buscar(id);
        acceso.verificarDueno(c.getMascota(), user);
        return c;
    }
}
