package cl.duoc.catalogo.repository;

import cl.duoc.catalogo.model.Servicio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServicioRepository extends JpaRepository<Servicio, Long> {
    boolean existsByCodigoIgnoreCase(String codigo);

    List<Servicio> findAllByOrderByCodigoAsc();
}
