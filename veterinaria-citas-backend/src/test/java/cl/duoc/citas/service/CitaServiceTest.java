package cl.duoc.citas.service;

import cl.duoc.citas.client.CatalogoClient;
import cl.duoc.citas.dto.CitaRequest;
import cl.duoc.citas.dto.CitaResponse;
import cl.duoc.citas.dto.ReagendarRequest;
import cl.duoc.citas.model.Cita;
import cl.duoc.citas.model.Mascota;
import cl.duoc.citas.exception.ApiException;
import cl.duoc.citas.repository.CitaRepository;
import cl.duoc.citas.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/** Reglas de negocio de la agenda. "Hoy" es miércoles 25-11-2026 10:00 (hora de Chile). */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CitaServiceTest {

    private static final ZoneId CHILE = ZoneId.of("America/Santiago");
    private static final AuthUser DUENO = new AuthUser(3L, "dueno@correo.cl", "María", "DUENO");
    private static final AuthUser RECEPCION = new AuthUser(2L, "recepcion@sanmarcos.cl", "Recepción", "RECEPCIONISTA");

    @Mock CitaRepository citas;
    @Mock AccesoService acceso;
    @Mock CatalogoClient catalogo;

    CitaService service;
    Mascota luna;

    @BeforeEach
    void preparar() {
        Clock reloj = Clock.fixed(LocalDateTime.of(2026, 11, 25, 10, 0).atZone(CHILE).toInstant(), CHILE);
        service = new CitaService(citas, acceso, catalogo, reloj, 3);

        luna = new Mascota();
        luna.setId(1L);
        luna.setDuenoId(3L);
        luna.setNombre("Luna");
        luna.setEspecie("Perro");
        luna.setActivo(true);

        when(acceso.mascotaVisible(eq(1L), any())).thenReturn(luna);
        when(catalogo.servicio(1L)).thenReturn(new CatalogoClient.ServicioRef(1L, "Consulta general", true, List.of("Perro", "Gato")));
        when(citas.existsByMascotaIdAndFechaHoraAndEstadoIn(anyLong(), any(), anyCollection())).thenReturn(false);
        when(citas.countByFechaHoraAndEstado(any(), any())).thenReturn(0L);
        when(citas.save(any(Cita.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private CitaRequest pedido(LocalDateTime fechaHora) {
        return new CitaRequest(1L, 1L, fechaHora, "Control general y revisión de vacunas.");
    }

    private void esperarError(LocalDateTime fechaHora, HttpStatus status, String fragmento) {
        assertThatThrownBy(() -> service.crear(pedido(fechaHora), DUENO))
                .isInstanceOfSatisfying(ApiException.class, e -> {
                    assertThat(e.getStatus()).isEqualTo(status);
                    assertThat(e.getMessage()).contains(fragmento);
                });
    }

    @Test
    void duenoSolicitaCitaQuedaSolicitada() {
        CitaResponse r = service.crear(pedido(LocalDateTime.of(2026, 11, 26, 10, 30)), DUENO);
        assertThat(r.estado()).isEqualTo("SOLICITADA");
        assertThat(r.mascotaNombre()).isEqualTo("Luna");
    }

    @Test
    void personalAgendaCitaQuedaConfirmada() {
        CitaResponse r = service.crear(pedido(LocalDateTime.of(2026, 11, 26, 10, 30)), RECEPCION);
        assertThat(r.estado()).isEqualTo("CONFIRMADA");
    }

    @Test
    void rechazaFechaPasada() {
        esperarError(LocalDateTime.of(2026, 11, 24, 10, 0), HttpStatus.BAD_REQUEST, "futuras");
    }

    @Test
    void rechazaDomingo() {
        esperarError(LocalDateTime.of(2026, 11, 29, 10, 0), HttpStatus.BAD_REQUEST, "domingos");
    }

    @Test
    void rechazaFueraDeHorario() {
        esperarError(LocalDateTime.of(2026, 11, 26, 8, 30), HttpStatus.BAD_REQUEST, "09:00 a 18:00");
        esperarError(LocalDateTime.of(2026, 11, 26, 18, 0), HttpStatus.BAD_REQUEST, "09:00 a 18:00");
    }

    @Test
    void rechazaMinutosQueNoSonBloquesDe30() {
        esperarError(LocalDateTime.of(2026, 11, 26, 10, 15), HttpStatus.BAD_REQUEST, "30 minutos");
    }

    @Test
    void rechazaMasDeNoventaDias() {
        esperarError(LocalDateTime.of(2027, 3, 31, 10, 0), HttpStatus.BAD_REQUEST, "90 días");
    }

    @Test
    void rechazaServicioNoCompatibleConLaEspecie() {
        when(catalogo.servicio(2L)).thenReturn(new CatalogoClient.ServicioRef(2L, "Vacuna triple felina", true, List.of("Gato")));
        CitaRequest req = new CitaRequest(1L, 2L, LocalDateTime.of(2026, 11, 26, 10, 0), "Vacuna de refuerzo anual.");
        assertThatThrownBy(() -> service.crear(req, DUENO))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getMessage()).contains("no se ofrece para la especie Perro"));
    }

    @Test
    void rechazaServicioInactivo() {
        when(catalogo.servicio(3L)).thenReturn(new CatalogoClient.ServicioRef(3L, "Servicio antiguo", false, List.of("Perro")));
        CitaRequest req = new CitaRequest(1L, 3L, LocalDateTime.of(2026, 11, 26, 10, 0), "Consulta por servicio retirado.");
        assertThatThrownBy(() -> service.crear(req, DUENO))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getMessage()).contains("ya no está disponible"));
    }

    @Test
    void rechazaCitaDuplicadaDeLaMismaMascota() {
        when(citas.existsByMascotaIdAndFechaHoraAndEstadoIn(anyLong(), any(), anyCollection())).thenReturn(true);
        esperarError(LocalDateTime.of(2026, 11, 26, 10, 0), HttpStatus.CONFLICT, "ya tiene una cita");
    }

    @Test
    void personalNoPuedeAgendarEnBloqueLleno() {
        when(citas.countByFechaHoraAndEstado(any(), eq("CONFIRMADA"))).thenReturn(3L);
        assertThatThrownBy(() -> service.crear(pedido(LocalDateTime.of(2026, 11, 26, 10, 0)), RECEPCION))
                .isInstanceOfSatisfying(ApiException.class, e -> {
                    assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(e.getMessage()).contains("cupos");
                });
    }

    private Cita citaEn(String estado) {
        Cita c = new Cita();
        c.setId(10L);
        c.setMascota(luna);
        c.setServicioId(1L);
        c.setFechaHora(LocalDateTime.of(2026, 11, 26, 10, 0));
        c.setMotivo("Control general.");
        c.setEstado(estado);
        when(citas.findById(10L)).thenReturn(Optional.of(c));
        return c;
    }

    @Test
    void confirmarSoloFuncionaConCitasSolicitadas() {
        citaEn("SOLICITADA");
        assertThat(service.confirmar(10L).estado()).isEqualTo("CONFIRMADA");

        citaEn("CANCELADA");
        assertThatThrownBy(() -> service.confirmar(10L)).isInstanceOf(ApiException.class);
    }

    @Test
    void reagendarPasaAReprogramadaConLaPropuesta() {
        citaEn("SOLICITADA");
        LocalDateTime propuesta = LocalDateTime.of(2026, 11, 27, 15, 0);
        CitaResponse r = service.reagendar(10L, new ReagendarRequest(propuesta, "Ese día no hay médico en la mañana."));
        assertThat(r.estado()).isEqualTo("REPROGRAMADA");
        assertThat(r.fechaPropuesta()).isEqualTo(propuesta);
    }

    @Test
    void duenoAceptaPropuestaYLaCitaQuedaConfirmadaEnElNuevoHorario() {
        Cita c = citaEn("REPROGRAMADA");
        LocalDateTime propuesta = LocalDateTime.of(2026, 11, 27, 15, 0);
        c.setFechaPropuesta(propuesta);

        CitaResponse r = service.aceptarPropuesta(10L, DUENO);
        assertThat(r.estado()).isEqualTo("CONFIRMADA");
        assertThat(r.fechaHora()).isEqualTo(propuesta);
        assertThat(r.fechaPropuesta()).isNull();
    }

    @Test
    void noSePuedeCancelarUnaCitaYaCompletada() {
        citaEn("COMPLETADA");
        assertThatThrownBy(() -> service.cancelar(10L, null, DUENO)).isInstanceOf(ApiException.class);
    }

    @Test
    void disponibilidadMuestraBloquesDeLunesASabadoYNadaLosDomingos() {
        assertThat(service.disponibilidad(java.time.LocalDate.of(2026, 11, 29)).bloques()).isEmpty();
        var lunes = service.disponibilidad(java.time.LocalDate.of(2026, 11, 30));
        assertThat(lunes.bloques()).hasSize(18);
        assertThat(lunes.bloques().get(0).hora()).isEqualTo("09:00");
        assertThat(lunes.bloques().get(0).cuposLibres()).isEqualTo(3);
    }
}
