package cl.duoc.catalogo.repository;

import cl.duoc.catalogo.model.Medicamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicamentoRepository extends JpaRepository<Medicamento, Long> {
    boolean existsByCodigoIgnoreCase(String codigo);

    List<Medicamento> findAllByOrderByCodigoAsc();
}
