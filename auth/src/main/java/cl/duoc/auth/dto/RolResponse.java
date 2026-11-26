package cl.duoc.auth.dto;

import cl.duoc.auth.model.Rol;

public record RolResponse(Long id, String nombre) {
    public static RolResponse de(Rol r) {
        return new RolResponse(r.getId(), r.getNombre());
    }
}
