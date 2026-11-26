package cl.duoc.auth.controller;

import cl.duoc.auth.dto.AuthResponse;
import cl.duoc.auth.dto.LoginRequest;
import cl.duoc.auth.dto.RegisterRequest;
import cl.duoc.auth.dto.UsuarioResponse;
import cl.duoc.auth.security.AuthUser;
import cl.duoc.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Autenticación")
public class AuthController {

    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Registro público de dueños de mascota")
    public AuthResponse registrar(@Valid @RequestBody RegisterRequest req) {
        return service.registrar(req);
    }

    @PostMapping("/login")
    @Operation(summary = "Inicio de sesión: entrega el token JWT")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return service.login(req);
    }

    @GetMapping("/me")
    @Operation(summary = "Datos del usuario autenticado")
    public UsuarioResponse yo(@AuthenticationPrincipal AuthUser user) {
        return service.yo(user.id());
    }
}
