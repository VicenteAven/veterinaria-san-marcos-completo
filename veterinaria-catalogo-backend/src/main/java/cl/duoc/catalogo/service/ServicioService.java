package cl.duoc.catalogo.service;

import cl.duoc.catalogo.dto.ServicioRequest;
import cl.duoc.catalogo.dto.ServicioResponse;
import cl.duoc.catalogo.model.Servicio;
import cl.duoc.catalogo.exception.ApiException;
import cl.duoc.catalogo.repository.ServicioRepository;
import cl.duoc.catalogo.util.Texto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ServicioService {

    private final ServicioRepository repo;
    private final EspecieResolver resolver;

    public ServicioService(ServicioRepository repo, EspecieResolver resolver) {
        this.repo = repo;
        this.resolver = resolver;
    }

    @Transactional(readOnly = true)
    public List<ServicioResponse> listar(String q, String especie, Long categoriaId, boolean incluirInactivos) {
        String texto = Texto.normalizar(q);
        return repo.findAllByOrderByCodigoAsc().stream()
                .filter(s -> incluirInactivos || s.isActivo())
                .filter(s -> categoriaId == null || s.getCategoria().getId().equals(categoriaId))
                .filter(s -> especie == null || especie.isBlank()
                        || s.getEspecies().stream().anyMatch(e -> e.getNombre().equalsIgnoreCase(especie.trim())))
                .filter(s -> texto.isEmpty() || Texto.normalizar(s.getNombre()).contains(texto)
                        || Texto.normalizar(s.getCodigo()).contains(texto))
                .map(ServicioResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public ServicioResponse obtener(Long id) {
        return ServicioResponse.de(buscar(id));
    }

    public ServicioResponse crear(ServicioRequest req) {
        if (repo.existsByCodigoIgnoreCase(req.codigo())) {
            throw ApiException.conflicto("Ya existe un servicio con el código " + req.codigo() + ".");
        }
        Servicio s = new Servicio();
        aplicar(s, req);
        s.setActivo(req.activo() == null || req.activo());
        return ServicioResponse.de(repo.save(s));
    }

    public ServicioResponse actualizar(Long id, ServicioRequest req) {
        Servicio s = buscar(id);
        if (!s.getCodigo().equalsIgnoreCase(req.codigo()) && repo.existsByCodigoIgnoreCase(req.codigo())) {
            throw ApiException.conflicto("Ya existe un servicio con el código " + req.codigo() + ".");
        }
        aplicar(s, req);
        if (req.activo() != null) {
            s.setActivo(req.activo());
        }
        return ServicioResponse.de(repo.save(s));
    }

    /** Baja lógica: el servicio deja de ofrecerse, pero las citas antiguas siguen pudiendo referenciarlo. */
    public void desactivar(Long id) {
        Servicio s = buscar(id);
        s.setActivo(false);
        repo.save(s);
    }

    private void aplicar(Servicio s, ServicioRequest req) {
        s.setCodigo(req.codigo().trim().toUpperCase());
        s.setCategoria(resolver.categoria(req.categoriaId(), "SERVICIO"));
        s.setNombre(req.nombre().trim());
        s.setDuracionMin(req.duracionMin());
        s.setPrecio(req.precio());
        s.setObservaciones(req.observaciones() == null || req.observaciones().isBlank() ? null : req.observaciones().trim());
        s.setEspecies(resolver.resolver(req.especies()));
    }

    private Servicio buscar(Long id) {
        return repo.findById(id).orElseThrow(() -> ApiException.noEncontrado("El servicio no existe."));
    }
}
