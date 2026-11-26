package cl.duoc.auth.dto;

public record AuthResponse(String token, String tipo, long expiraEnMinutos, UsuarioResponse usuario) {
}
