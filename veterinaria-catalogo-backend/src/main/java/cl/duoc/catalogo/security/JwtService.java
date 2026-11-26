package cl.duoc.catalogo.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

/** Genera y valida tokens JWT (HS256). Los tres microservicios comparten el mismo secreto. */
@Component
public class JwtService {

    private final SecretKey key;
    private final long expiracionMinutos;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiration-minutes:240}") long expiracionMinutos) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiracionMinutos = expiracionMinutos;
    }

    public String generar(Long id, String email, String nombre, String rol) {
        Instant ahora = Instant.now();
        return Jwts.builder()
                .subject(email)
                .claim("uid", id)
                .claim("nombre", nombre)
                .claim("rol", rol)
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(ahora.plus(expiracionMinutos, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    /** Lanza JwtException si el token es inválido, está vencido o fue alterado. */
    public AuthUser leer(String token) {
        Claims c = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        Number uid = (Number) c.get("uid");
        return new AuthUser(uid.longValue(), c.getSubject(), c.get("nombre", String.class), c.get("rol", String.class));
    }

    public long getExpiracionMinutos() {
        return expiracionMinutos;
    }
}
