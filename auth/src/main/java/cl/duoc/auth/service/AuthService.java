package cl.duoc.auth.service;

import cl.duoc.auth.dto.AuthResponse;
import cl.duoc.auth.dto.LoginRequest;
import cl.duoc.auth.dto.RegisterRequest;
import cl.duoc.auth.dto.UsuarioResponse;
import cl.duoc.auth.model.Rol;
import cl.duoc.auth.model.Usuario;
import cl.duoc.auth.exception.ApiException;
import cl.duoc.auth.repository.RolRepository;
import cl.duoc.auth.repository.UsuarioRepository;
import cl.duoc.auth.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UsuarioRepository usuarios;
    private final RolRepository roles;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UsuarioRepository usuarios, RolRepository roles, PasswordEncoder encoder, JwtService jwt) {
        this.usuarios = usuarios;
        this.roles = roles;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @Transactional
    public AuthResponse registrar(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (usuarios.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflicto("Ya existe una cuenta con ese correo.");
        }
        Rol dueno = roles.findByNombre("DUENO")
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "El rol DUENO no está configurado."));
        Usuario u = new Usuario();
        u.setNombre(req.nombre().trim());
        u.setEmail(email);
        u.setTelefono(req.telefono() == null || req.telefono().isBlank() ? null : req.telefono().trim());
        u.setPasswordHash(encoder.encode(req.password()));
        u.setRol(dueno);
        u.setActivo(true);
        return respuesta(usuarios.save(u));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        Usuario u = usuarios.findByEmailIgnoreCase(req.email().trim())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos."));
        if (!encoder.matches(req.password(), u.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos.");
        }
        if (!u.isActivo()) {
            throw ApiException.prohibido("Tu cuenta está desactivada. Contacta a la clínica.");
        }
        return respuesta(u);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse yo(Long id) {
        Usuario u = usuarios.findById(id).orElseThrow(() -> ApiException.noEncontrado("El usuario ya no existe."));
        if (!u.isActivo()) {
            throw ApiException.prohibido("Tu cuenta está desactivada. Contacta a la clínica.");
        }
        return UsuarioResponse.de(u);
    }

    private AuthResponse respuesta(Usuario u) {
        String token = jwt.generar(u.getId(), u.getEmail(), u.getNombre(), u.getRol().getNombre());
        return new AuthResponse(token, "Bearer", jwt.getExpiracionMinutos(), UsuarioResponse.de(u));
    }
}
