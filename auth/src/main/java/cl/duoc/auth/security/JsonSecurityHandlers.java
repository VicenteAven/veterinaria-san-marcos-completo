package cl.duoc.auth.security;

import cl.duoc.auth.exception.ErrorApi;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/** Respuestas 401 y 403 siempre en JSON (nunca la página HTML por defecto). */
@Component
public class JsonSecurityHandlers implements AuthenticationEntryPoint, AccessDeniedHandler {

    @Override
    public void commence(HttpServletRequest req, HttpServletResponse res, AuthenticationException ex) throws IOException {
        escribir(req, res, HttpStatus.UNAUTHORIZED, "Debes iniciar sesión para acceder a este recurso.");
    }

    @Override
    public void handle(HttpServletRequest req, HttpServletResponse res, AccessDeniedException ex) throws IOException {
        escribir(req, res, HttpStatus.FORBIDDEN, "No tienes permisos para realizar esta operación.");
    }

    private void escribir(HttpServletRequest req, HttpServletResponse res, HttpStatus status, String mensaje) throws IOException {
        res.setStatus(status.value());
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.setCharacterEncoding("UTF-8");
        ErrorApi e = ErrorApi.de(status.value(), status.getReasonPhrase(), mensaje, req.getRequestURI(), null);
        res.getWriter().write("{\"timestamp\":\"" + e.timestamp() + "\",\"status\":" + e.status()
            + ",\"error\":\"" + esc(e.error()) + "\",\"message\":\"" + esc(e.message())
            + "\",\"path\":\"" + esc(e.path()) + "\"}");
    }

    private static String esc(String s) {
        return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
