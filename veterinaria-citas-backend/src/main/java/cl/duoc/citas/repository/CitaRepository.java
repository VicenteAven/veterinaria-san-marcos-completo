package cl.duoc.citas.repository;

import cl.duoc.citas.model.Cita;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface CitaRepository extends JpaRepository<Cita, Long> {

    List<Cita> findByMascotaDuenoIdOrderByFechaHoraDesc(Long duenoId);

    List<Cita> findAllByOrderByFechaHoraDesc();

    long countByFechaHoraAndEstado(LocalDateTime fechaHora, String estado);

    List<Cita> findByFechaHoraBetweenAndEstado(LocalDateTime desde, LocalDateTime hasta, String estado);

    List<Cita> findByFechaHoraBetween(LocalDateTime desde, LocalDateTime hasta);

    boolean existsByMascotaIdAndFechaHoraAndEstadoIn(Long mascotaId, LocalDateTime fechaHora, Collection<String> estados);

    boolean existsByMascotaIdAndEstadoIn(Long mascotaId, Collection<String> estados);
}
