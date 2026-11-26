package cl.duoc.citas.service;

import cl.duoc.citas.dto.MascotaRequest;
import cl.duoc.citas.dto.MascotaResponse;
import cl.duoc.citas.model.Mascota;
import cl.duoc.citas.exception.ApiException;
import cl.duoc.citas.repository.CitaRepository;
import cl.duoc.citas.repository.MascotaRepository;
import cl.duoc.citas.security.AuthUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MascotaService {

    static final List<String> ESTADOS_ACTIVOS = List.of("SOLICITADA", "CONFIRMADA", "REPROGRAMADA");

    private final MascotaRepository mascotas;
    private final CitaRepository citas;
    private final AccesoService acceso;

    public MascotaService(MascotaRepository mascotas, CitaRepository citas, AccesoService acceso) {
        this.mascotas = mascotas;
        this.citas = citas;
        this.acceso = acceso;
    }

    @Transactional(readOnly = true)
    public List<MascotaResponse> listar(AuthUser user, Long duenoId) {
        List<Mascota> lista;
        if (user.esDueno()) {
            lista = mascotas.findByDuenoIdAndActivoTrueOrderByNombreAsc(user.id());
        } else if (duenoId != null) {
            lista = mascotas.findByDuenoIdAndActivoTrueOrderByNombreAsc(duenoId);
        } else {
            lista = mascotas.findByActivoTrueOrderByNombreAsc();
        }
        return lista.stream().map(MascotaResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public MascotaResponse obtener(Long id, AuthUser user) {
        return MascotaResponse.de(acceso.mascotaVisible(id, user));
    }

    public MascotaResponse crear(MascotaRequest req, AuthUser user) {
        Long duenoId = user.esDueno() ? user.id() : req.duenoId();
        if (duenoId == null) {
            throw ApiException.invalido("Indica a qué dueño pertenece la mascota.");
        }
        Mascota m = new Mascota();
        aplicar(m, req);
        m.setDuenoId(duenoId);
        m.setActivo(true);
        return MascotaResponse.de(mascotas.save(m));
    }

    public MascotaResponse actualizar(Long id, MascotaRequest req, AuthUser user) {
        Mascota m = acceso.mascotaVisible(id, user);
        aplicar(m, req);
        return MascotaResponse.de(mascotas.save(m));
    }

    /** Baja lógica: conserva la ficha clínica. No se permite si la mascota tiene citas pendientes. */
    public void desactivar(Long id, AuthUser user) {
        Mascota m = acceso.mascotaVisible(id, user);
        if (citas.existsByMascotaIdAndEstadoIn(id, ESTADOS_ACTIVOS)) {
            throw ApiException.conflicto("La mascota tiene citas pendientes. Cancélalas antes de eliminarla.");
        }
        m.setActivo(false);
        mascotas.save(m);
    }

    private void aplicar(Mascota m, MascotaRequest req) {
        m.setNombre(req.nombre().trim());
        m.setEspecie(req.especie());
        m.setRaza(req.raza() == null || req.raza().isBlank() ? null : req.raza().trim());
        m.setSexo(req.sexo());
        m.setFechaNacimiento(req.fechaNacimiento());
        m.setPesoKg(req.pesoKg());
    }
}
