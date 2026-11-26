package cl.duoc.catalogo.service;

import cl.duoc.catalogo.dto.MedicamentoRequest;
import cl.duoc.catalogo.dto.MedicamentoResponse;
import cl.duoc.catalogo.model.Medicamento;
import cl.duoc.catalogo.exception.ApiException;
import cl.duoc.catalogo.repository.MedicamentoRepository;
import cl.duoc.catalogo.util.Texto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MedicamentoService {

    private final MedicamentoRepository repo;
    private final EspecieResolver resolver;

    public MedicamentoService(MedicamentoRepository repo, EspecieResolver resolver) {
        this.repo = repo;
        this.resolver = resolver;
    }

    @Transactional(readOnly = true)
    public List<MedicamentoResponse> listar(String q, String especie, Long categoriaId, boolean incluirInactivos) {
        String texto = Texto.normalizar(q);
        return repo.findAllByOrderByCodigoAsc().stream()
                .filter(m -> incluirInactivos || m.isActivo())
                .filter(m -> categoriaId == null || m.getCategoria().getId().equals(categoriaId))
                .filter(m -> especie == null || especie.isBlank()
                        || m.getEspecies().stream().anyMatch(e -> e.getNombre().equalsIgnoreCase(especie.trim())))
                .filter(m -> texto.isEmpty() || Texto.normalizar(m.getNombreComercial()).contains(texto)
                        || Texto.normalizar(m.getPrincipioActivo()).contains(texto)
                        || Texto.normalizar(m.getCodigo()).contains(texto))
                .map(MedicamentoResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public MedicamentoResponse obtener(Long id) {
        return MedicamentoResponse.de(buscar(id));
    }

    public MedicamentoResponse crear(MedicamentoRequest req) {
        if (repo.existsByCodigoIgnoreCase(req.codigo())) {
            throw ApiException.conflicto("Ya existe un medicamento con el código " + req.codigo() + ".");
        }
        Medicamento m = new Medicamento();
        aplicar(m, req);
        m.setActivo(req.activo() == null || req.activo());
        return MedicamentoResponse.de(repo.save(m));
    }

    public MedicamentoResponse actualizar(Long id, MedicamentoRequest req) {
        Medicamento m = buscar(id);
        if (!m.getCodigo().equalsIgnoreCase(req.codigo()) && repo.existsByCodigoIgnoreCase(req.codigo())) {
            throw ApiException.conflicto("Ya existe un medicamento con el código " + req.codigo() + ".");
        }
        aplicar(m, req);
        if (req.activo() != null) {
            m.setActivo(req.activo());
        }
        return MedicamentoResponse.de(repo.save(m));
    }

    public MedicamentoResponse ajustarStock(Long id, int stock) {
        Medicamento m = buscar(id);
        m.setStock(stock);
        return MedicamentoResponse.de(repo.save(m));
    }

    public void desactivar(Long id) {
        Medicamento m = buscar(id);
        m.setActivo(false);
        repo.save(m);
    }

    private void aplicar(Medicamento m, MedicamentoRequest req) {
        m.setCodigo(req.codigo().trim().toUpperCase());
        m.setCategoria(resolver.categoria(req.categoriaId(), "MEDICAMENTO"));
        m.setNombreComercial(req.nombreComercial().trim());
        m.setPrincipioActivo(req.principioActivo().trim());
        m.setPresentacion(req.presentacion().trim());
        m.setStock(req.stock());
        m.setPrecio(req.precio());
        m.setEspecies(resolver.resolver(req.especies()));
    }

    private Medicamento buscar(Long id) {
        return repo.findById(id).orElseThrow(() -> ApiException.noEncontrado("El medicamento no existe."));
    }
}
