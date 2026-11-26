package cl.duoc.catalogo.controller;

import cl.duoc.catalogo.dto.ServicioRequest;
import cl.duoc.catalogo.dto.ServicioResponse;
import cl.duoc.catalogo.security.AuthUser;
import cl.duoc.catalogo.service.ServicioService;
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
@RequestMapping("/api/v1/servicios")
@Tag(name = "Servicios")
public class ServicioController {

    private final ServicioService service;

    public ServicioController(ServicioService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Lista servicios con filtros opcionales (q, especie, categoriaId)")
    public List<ServicioResponse> listar(@RequestParam(required = false) String q,
                                         @RequestParam(required = false) String especie,
                                         @RequestParam(required = false) Long categoriaId,
                                         @RequestParam(defaultValue = "false") boolean incluirInactivos,
                                         @AuthenticationPrincipal AuthUser user) {
        return service.listar(q, especie, categoriaId, incluirInactivos && user.esStaff());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalle de un servicio")
    public ServicioResponse obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crea un servicio (administrador)")
    public ServicioResponse crear(@Valid @RequestBody ServicioRequest req) {
        return service.crear(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Edita un servicio (administrador)")
    public ServicioResponse actualizar(@PathVariable Long id, @Valid @RequestBody ServicioRequest req) {
        return service.actualizar(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Desactiva un servicio (baja lógica, administrador)")
    public void desactivar(@PathVariable Long id) {
        service.desactivar(id);
    }
}
