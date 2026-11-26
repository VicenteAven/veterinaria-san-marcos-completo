package cl.duoc.auth.service;

import cl.duoc.auth.dto.RolResponse;
import cl.duoc.auth.dto.UsuarioRequest;
import cl.duoc.auth.dto.UsuarioResponse;
import cl.duoc.auth.model.Rol;
import cl.duoc.auth.model.Usuario;
import cl.duoc.auth.exception.ApiException;
import cl.duoc.auth.repository.RolRepository;
import cl.duoc.auth.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Lógica de negocio de la administración de usuarios (solo el rol ADMIN llega aquí). */
@Service
@Transactional
public class UsuarioService {

    private static final String PASSWORD_FUERTE = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)\\S{8,72}$";

    private final UsuarioRepository usuarios;
    private final RolRepository roles;
    private final PasswordEncoder encoder;

    public UsuarioService(UsuarioRepository usuarios, RolRepository roles, PasswordEncoder encoder) {
        this.usuarios = usuarios;
        this.roles = roles;
        this.encoder = encoder;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return usuarios.findAllByOrderByNombreAsc().stream().map(UsuarioResponse::de).toList();
    }

    /** Dueños activos: lo usa recepción para registrar mascotas y citas a nombre de un cliente. */
    @Transactional(readOnly = true)
    public List<UsuarioResponse> duenosActivos() {
        return usuarios.findByRolNombreAndActivoTrueOrderByNombreAsc("DUENO").stream().map(UsuarioResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtener(Long id) {
        return UsuarioResponse.de(buscar(id));
    }

    @Transactional(readOnly = true)
    public List<RolResponse> roles() {
        return roles.findAll().stream().map(RolResponse::de).toList();
    }

    public UsuarioResponse crear(UsuarioRequest req) {
        String email = req.email().trim().toLowerCase();
        if (usuarios.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflicto("Ya existe un usuario con ese correo.");
        }
        validarPassword(req.password(), true);
        Usuario u = new Usuario();
        aplicar(u, req, email);
        u.setPasswordHash(encoder.encode(req.password()));
        u.setActivo(true);
        return UsuarioResponse.de(usuarios.save(u));
    }

    public UsuarioResponse actualizar(Long id, UsuarioRequest req, Long actorId) {
        Usuario u = buscar(id);
        String email = req.email().trim().toLowerCase();
        if (!email.equalsIgnoreCase(u.getEmail()) && usuarios.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflicto("Ya existe un usuario con ese correo.");
        }
        if (id.equals(actorId) && !"ADMIN".equals(req.rol())) {
            throw ApiException.invalido("No puedes quitarte a ti mismo el rol de administrador.");
        }
        validarPassword(req.password(), false);
        aplicar(u, req, email);
        if (req.password() != null && !req.password().isBlank()) {
            u.setPasswordHash(encoder.encode(req.password()));
        }
        return UsuarioResponse.de(usuarios.save(u));
    }

    public UsuarioResponse cambiarEstado(Long id, boolean activo, Long actorId) {
        Usuario u = buscar(id);
        if (id.equals(actorId) && !activo) {
            throw ApiException.invalido("No puedes desactivar tu propia cuenta.");
        }
        u.setActivo(activo);
        return UsuarioResponse.de(usuarios.save(u));
    }

    private void aplicar(Usuario u, UsuarioRequest req, String email) {
        Rol rol = roles.findByNombre(req.rol()).orElseThrow(() -> ApiException.invalido("El rol indicado no existe."));
        u.setNombre(req.nombre().trim());
        u.setEmail(email);
        u.setTelefono(req.telefono() == null || req.telefono().isBlank() ? null : req.telefono().trim());
        u.setRol(rol);
    }

    private void validarPassword(String password, boolean obligatoria) {
        boolean vacia = password == null || password.isBlank();
        if (vacia && obligatoria) {
            throw ApiException.invalido("La contraseña es obligatoria para crear un usuario.");
        }
        if (!vacia && !password.matches(PASSWORD_FUERTE)) {
            throw ApiException.invalido("La contraseña debe tener 8 a 72 caracteres con mayúscula, minúscula y número, sin espacios.");
        }
    }

    private Usuario buscar(Long id) {
        return usuarios.findById(id).orElseThrow(() -> ApiException.noEncontrado("El usuario no existe."));
    }
}
