package cl.duoc.citas.repository;

import cl.duoc.citas.model.Vacunacion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VacunacionRepository extends JpaRepository<Vacunacion, Long> {
}
