package cl.duoc.catalogo.exception;

import java.time.LocalDateTime;
import java.util.Map;

/** Formato único de error: todas las respuestas de error de la API son JSON con esta forma. */
public record ErrorApi(String timestamp, int status, String error, String message, String path, Map<String, String> errores) {

    public static ErrorApi de(int status, String error, String message, String path, Map<String, String> errores) {
        return new ErrorApi(LocalDateTime.now().toString(), status, error, message, path, errores);
    }
}
