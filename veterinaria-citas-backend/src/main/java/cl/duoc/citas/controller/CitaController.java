package cl.duoc.citas.controller;

import cl.duoc.citas.dto.CancelarRequest;
import cl.duoc.citas.dto.CitaRequest;
import cl.duoc.citas.dto.CitaResponse;
import cl.duoc.citas.dto.DisponibilidadResponse;
import cl.duoc.citas.dto.ReagendarRequest;
import cl.duoc.citas.security.AuthUser;
import cl.duoc.citas.service.CitaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/citas")
@Tag(name = "Citas")
public class CitaController {

    private final CitaService service;

    public CitaController(CitaService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Lista citas: el dueño ve las suyas; el personal ve todas. Filtros: estado, desde, hasta, mascotaId")
    public List<CitaResponse> listar(@AuthenticationPrincipal AuthUser user,
                                     @RequestParam(required = false) String estado,
                                     @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                                     @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
                                     @RequestParam(required = false) Long mascotaId) {
        return service.listar(user, estado, desde, hasta, mascotaId);
    }

    @GetMapping("/disponibilidad")
    @Operation(summary = "Cupos libres por bloque de 30 minutos en una fecha")
    public DisponibilidadResponse disponibilidad(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return service.disponibilidad(fecha);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalle de una cita")
    public CitaResponse obtener(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
        return service.obtener(id, user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Solicita una cita (dueño) o la agenda confirmada (personal)")
    public CitaResponse crear(@Valid @RequestBody CitaRequest req, @AuthenticationPrincipal AuthUser user) {
        return service.crear(req, user);
    }

    @PatchMapping("/{id}/confirmar")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    @Operation(summary = "Confirma una cita solicitada (personal)")
    public CitaResponse confirmar(@PathVariable Long id) {
        return service.confirmar(id);
    }

    @PatchMapping("/{id}/reagendar")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    @Operation(summary = "Propone otro horario al dueño (personal)")
    public CitaResponse reagendar(@PathVariable Long id, @Valid @RequestBody ReagendarRequest req) {
        return service.reagendar(id, req);
    }

    @PatchMapping("/{id}/aceptar-propuesta")
    @PreAuthorize("hasRole('DUENO')")
    @Operation(summary = "El dueño acepta el horario propuesto por la clínica")
    public CitaResponse aceptar(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
        return service.aceptarPropuesta(id, user);
    }

    @PatchMapping("/{id}/cancelar")
    @Operation(summary = "Cancela una cita (dueño de la mascota o personal)")
    public CitaResponse cancelar(@PathVariable Long id, @RequestBody(required = false) @Valid CancelarRequest req,
                                 @AuthenticationPrincipal AuthUser user) {
        return service.cancelar(id, req == null ? null : req.motivo(), user);
    }

    @PatchMapping("/{id}/completar")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    @Operation(summary = "Marca una cita confirmada como atendida (personal)")
    public CitaResponse completar(@PathVariable Long id) {
        return service.completar(id);
    }
}
