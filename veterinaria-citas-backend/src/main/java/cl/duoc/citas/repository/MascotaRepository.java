package cl.duoc.citas.repository;

import cl.duoc.citas.model.Mascota;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface MascotaRepository extends JpaRepository<Mascota, Long> {

    List<Mascota> findByDuenoIdAndActivoTrueOrderByNombreAsc(Long duenoId);

    List<Mascota> findByActivoTrueOrderByNombreAsc();

    List<Mascota> findByCreadoEnBetween(LocalDateTime desde, LocalDateTime hasta);
}
