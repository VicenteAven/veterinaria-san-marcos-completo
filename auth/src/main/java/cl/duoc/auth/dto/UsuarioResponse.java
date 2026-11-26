package cl.duoc.auth.dto;

import cl.duoc.auth.model.Usuario;

import java.time.LocalDateTime;

public record UsuarioResponse(Long id, String nombre, String email, String telefono, String rol, boolean activo, LocalDateTime creadoEn) {

    public static UsuarioResponse de(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNombre(), u.getEmail(), u.getTelefono(), u.getRol().getNombre(), u.isActivo(), u.getCreadoEn());
    }
}
