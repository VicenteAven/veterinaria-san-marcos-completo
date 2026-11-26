package cl.duoc.citas.service;

import cl.duoc.citas.model.Mascota;
import cl.duoc.citas.exception.ApiException;
import cl.duoc.citas.repository.MascotaRepository;
import cl.duoc.citas.security.AuthUser;
import org.springframework.stereotype.Component;

/** Regla de privacidad: un dueño solo puede ver y tocar los datos de sus propias mascotas. */
@Component
public class AccesoService {

    private final MascotaRepository mascotas;

    public AccesoService(MascotaRepository mascotas) {
        this.mascotas = mascotas;
    }

    public Mascota mascotaVisible(Long mascotaId, AuthUser user) {
        Mascota m = mascotas.findById(mascotaId).orElseThrow(() -> ApiException.noEncontrado("La mascota no existe."));
        verificarDueno(m, user);
        return m;
    }

    public void verificarDueno(Mascota m, AuthUser user) {
        if (user.esDueno() && !m.getDuenoId().equals(user.id())) {
            throw ApiException.prohibido("Solo puedes ver los datos de tus propias mascotas.");
        }
    }
}
