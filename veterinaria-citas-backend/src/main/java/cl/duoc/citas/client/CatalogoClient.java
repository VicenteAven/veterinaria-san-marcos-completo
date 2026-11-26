package cl.duoc.citas.client;

import cl.duoc.citas.exception.ApiException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

/**
 * Cliente HTTP hacia catalogo-service. Reenvía el mismo token JWT del usuario que hizo la petición,
 * así el catálogo aplica sus propias reglas de seguridad.
 */
@Component
public class CatalogoClient {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ServicioRef(Long id, String nombre, boolean activo, List<String> especies) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MedicamentoRef(Long id, boolean activo) {
    }

    private final RestClient http;

    public CatalogoClient(@Value("${app.catalogo.url}") String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(5000);
        this.http = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
    }

    public ServicioRef servicio(Long id) {
        return obtener("/api/v1/servicios/{id}", id, ServicioRef.class, "El servicio indicado no existe.");
    }

    public MedicamentoRef medicamento(Long id) {
        return obtener("/api/v1/medicamentos/{id}", id, MedicamentoRef.class, "El medicamento indicado no existe.");
    }

    private <T> T obtener(String ruta, Long id, Class<T> tipo, String mensajeNoExiste) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String token = auth == null ? "" : String.valueOf(auth.getCredentials());
        try {
            T cuerpo = http.get().uri(ruta, id).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).retrieve().body(tipo);
            if (cuerpo == null) {
                throw ApiException.invalido(mensajeNoExiste);
            }
            return cuerpo;
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode().value() == 404) {
                throw ApiException.invalido(mensajeNoExiste);
            }
            throw new ApiException(HttpStatus.BAD_GATEWAY, "El catálogo rechazó la consulta (" + e.getStatusCode().value() + ").");
        } catch (RestClientException e) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "El catálogo no está disponible en este momento. Intenta nuevamente.");
        }
    }
}
