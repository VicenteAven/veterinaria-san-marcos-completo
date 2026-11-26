package cl.duoc.citas.repository;

import cl.duoc.citas.model.Consulta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ConsultaRepository extends JpaRepository<Consulta, Long> {

    List<Consulta> findByMascotaIdOrderByFechaDescIdDesc(Long mascotaId);

    List<Consulta> findByFechaBetween(LocalDate desde, LocalDate hasta);
}
