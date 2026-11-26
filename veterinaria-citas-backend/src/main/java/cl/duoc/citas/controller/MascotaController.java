package cl.duoc.citas.controller;

import cl.duoc.citas.dto.ConsultaRequest;
import cl.duoc.citas.dto.ConsultaResponse;
import cl.duoc.citas.dto.HistorialResponse;
import cl.duoc.citas.dto.MascotaRequest;
import cl.duoc.citas.dto.MascotaResponse;
import cl.duoc.citas.security.AuthUser;
import cl.duoc.citas.service.ConsultaService;
import cl.duoc.citas.service.MascotaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/mascotas")
@Tag(name = "Mascotas y ficha clínica")
public class MascotaController {

    private final MascotaService mascotas;
    private final ConsultaService consultas;

    public MascotaController(MascotaService mascotas, ConsultaService consultas) {
        this.mascotas = mascotas;
        this.consultas = consultas;
    }

    @GetMapping
    @Operation(summary = "Lista mascotas: el dueño ve solo las suyas; el personal ve todas (filtro opcional duenoId)")
    public List<MascotaResponse> listar(@AuthenticationPrincipal AuthUser user, @RequestParam(required = false) Long duenoId) {
        return mascotas.listar(user, duenoId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalle de una mascota (el dueño solo accede a las suyas)")
    public MascotaResponse obtener(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
        return mascotas.obtener(id, user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Registra una mascota (el personal debe indicar duenoId)")
    public MascotaResponse crear(@Valid @RequestBody MascotaRequest req, @AuthenticationPrincipal AuthUser user) {
        return mascotas.crear(req, user);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Edita los datos de una mascota")
    public MascotaResponse actualizar(@PathVariable Long id, @Valid @RequestBody MascotaRequest req,
                                      @AuthenticationPrincipal AuthUser user) {
        return mascotas.actualizar(id, req, user);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Da de baja una mascota (baja lógica; conserva la ficha)")
    public void eliminar(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
        mascotas.desactivar(id, user);
    }

    @GetMapping("/{id}/historial")
    @Operation(summary = "Historial clínico completo: consultas, vacunas y recetas")
    public HistorialResponse historial(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
        return consultas.historial(id, user);
    }

    @PostMapping("/{id}/consultas")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Registra una consulta en la ficha (personal de la clínica)")
    public ConsultaResponse registrarConsulta(@PathVariable Long id, @Valid @RequestBody ConsultaRequest req,
                                              @AuthenticationPrincipal AuthUser user) {
        return consultas.registrar(id, req, user);
    }
}
