package cl.duoc.auth.controller;

import cl.duoc.auth.dto.EstadoRequest;
import cl.duoc.auth.dto.RolResponse;
import cl.duoc.auth.dto.UsuarioRequest;
import cl.duoc.auth.dto.UsuarioResponse;
import cl.duoc.auth.security.AuthUser;
import cl.duoc.auth.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Usuarios y roles")
public class UsuarioController {

    private final UsuarioService service;

    public UsuarioController(UsuarioService service) {
        this.service = service;
    }

    @GetMapping("/usuarios")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lista todos los usuarios (solo administrador)")
    public List<UsuarioResponse> listar() {
        return service.listar();
    }

    @GetMapping("/usuarios/duenos")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    @Operation(summary = "Lista los dueños de mascota activos (personal de la clínica)")
    public List<UsuarioResponse> duenos() {
        return service.duenosActivos();
    }

    @GetMapping("/usuarios/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Obtiene un usuario por id")
    public UsuarioResponse obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @PostMapping("/usuarios")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crea un usuario y le asigna un rol")
    public UsuarioResponse crear(@Valid @RequestBody UsuarioRequest req) {
        return service.crear(req);
    }

    @PutMapping("/usuarios/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Edita datos y rol de un usuario (la contraseña es opcional)")
    public UsuarioResponse actualizar(@PathVariable Long id, @Valid @RequestBody UsuarioRequest req,
                                      @AuthenticationPrincipal AuthUser actor) {
        return service.actualizar(id, req, actor.id());
    }

    @PatchMapping("/usuarios/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activa o desactiva un usuario")
    public UsuarioResponse estado(@PathVariable Long id, @Valid @RequestBody EstadoRequest req,
                                  @AuthenticationPrincipal AuthUser actor) {
        return service.cambiarEstado(id, req.activo(), actor.id());
    }

    @GetMapping("/roles")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lista los roles disponibles")
    public List<RolResponse> roles() {
        return service.roles();
    }
}
