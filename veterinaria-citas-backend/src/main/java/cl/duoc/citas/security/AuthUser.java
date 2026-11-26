package cl.duoc.citas.security;

/** Usuario autenticado, reconstruido a partir del token JWT. */
public record AuthUser(Long id, String email, String nombre, String rol) {
    public boolean esStaff() {
        return "ADMIN".equals(rol) || "RECEPCIONISTA".equals(rol);
    }

    public boolean esDueno() {
        return "DUENO".equals(rol);
    }
}
