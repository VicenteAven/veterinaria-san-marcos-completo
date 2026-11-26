package cl.duoc.catalogo.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.LinkedHashMap;
import java.util.Map;

/** Convierte cualquier excepción en una respuesta JSON consistente (ErrorApi). */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Object> api(ApiException ex, WebRequest request) {
        return respuesta(ex.getStatus(), ex.getMessage(), request, null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Object> accesoDenegado(AccessDeniedException ex, WebRequest request) {
        return respuesta(HttpStatus.FORBIDDEN, "No tienes permisos para realizar esta operación.", request, null);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Object> integridad(DataIntegrityViolationException ex, WebRequest request) {
        return respuesta(HttpStatus.CONFLICT, "La operación viola una restricción de datos (valor duplicado o en uso).", request, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> inesperado(Exception ex, WebRequest request) {
        log.error("Error no controlado", ex);
        return respuesta(HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrió un error inesperado. Intenta nuevamente.", request, null);
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex, HttpHeaders headers,
                                                                  HttpStatusCode status, WebRequest request) {
        Map<String, String> errores = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(f -> errores.putIfAbsent(f.getField(), f.getDefaultMessage()));
        return respuesta(HttpStatus.BAD_REQUEST, "Hay datos inválidos en la solicitud.", request, errores);
    }

    /** Todas las excepciones estándar de Spring MVC (404, 405, JSON mal formado, etc.) pasan por aquí. */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers,
                                                             HttpStatusCode status, WebRequest request) {
        HttpStatus http = HttpStatus.resolve(status.value());
        String mensaje = switch (status.value()) {
            case 400 -> "La solicitud está mal formada o le faltan datos.";
            case 404 -> "El recurso solicitado no existe.";
            case 405 -> "Método HTTP no permitido para este recurso.";
            case 415 -> "Formato de contenido no soportado (usa application/json).";
            default -> "No se pudo procesar la solicitud.";
        };
        return respuesta(http != null ? http : HttpStatus.INTERNAL_SERVER_ERROR, mensaje, request, null);
    }

    private ResponseEntity<Object> respuesta(HttpStatus status, String mensaje, WebRequest request, Map<String, String> errores) {
        String path = request instanceof ServletWebRequest swr ? swr.getRequest().getRequestURI() : "";
        ErrorApi cuerpo = ErrorApi.de(status.value(), status.getReasonPhrase(), mensaje, path, errores);
        return ResponseEntity.status(status).body(cuerpo);
    }
}
